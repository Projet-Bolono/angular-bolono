import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseSalesService } from './course-sales.service';
import { rechargerEnDirect } from '../../core/api/ressources';
import { dateHeure, fcfa } from '../../core/utils/format';
import { messageApi } from '../../core/auth/http';
import type { Page } from '../../core/models/common.model';
import type { AchatAdmin, StatutAchat, SyntheseVentes } from './course-sales.model';
import { API_ADMIN } from '../../core/api/ressources';
import { ToastService } from '../../core/notifications/toast.service';
import { Icon } from '../../shared/icons/icon';
import {
  Badge,
  BarreChargement,
  ConfirmationService,
  EntetePage,
  EtatVide,
  Squelette,
} from '../../shared/components/ui';

type Onglet = 'payees' | 'attente' | 'remboursees';

const MOYENS: Record<string, string> = { ORANGE_MONEY: 'Orange Money', WAVE: 'Wave' };

/** Confirmation de la réception d'un paiement : montant reçu et référence de l'opération. */
@Component({
  selector: 'app-confirmation-achat',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation-achat.html',
})
export class ConfirmationAchat {
  protected readonly fcfa = fcfa;
  readonly achat = input.required<AchatAdmin>();
  readonly occupe = input(false);
  readonly confirmer = output<{ montant: number; operation: string }>();
  readonly refuser = output<void>();
  protected montant: number | null = null;
  protected operation = '';

  ngOnInit(): void {
    this.montant = this.achat().montant;
  }

  protected envoyer(): void {
    if (this.montant === null || !this.operation.trim()) return;
    this.confirmer.emit({ montant: this.montant, operation: this.operation.trim() });
  }
}

/**
 * « Ventes de formations » : les apprenants paient les vidéos premium des
 * mentors par Orange Money ou Wave ; le paiement direct débloque aussitôt le
 * contenu (l'onglet « Paiements à confirmer » ne sert qu'en mode manuel).
 * L'équipe peut rembourser une vente tant que le mentor ne l'a pas retirée ;
 * les retraits des mentors se traitent sur la page « Retraits ».
 */
@Component({
  selector: 'app-ventes-formations',
  imports: [
    FormsModule,
    RouterLink,
    EntetePage,
    Icon,
    Badge,
    BarreChargement,
    EtatVide,
    Squelette,
    ConfirmationAchat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-sales.html',
})
export class VentesFormationsPage {
  private readonly api = inject(CourseSalesService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly fcfa = fcfa;
  protected readonly dateHeure = dateHeure;
  protected readonly moyens = MOYENS;

  protected readonly onglet = signal<Onglet>('payees');
  protected readonly enCours = signal<string | null>(null);

  protected readonly synthese = httpResource<SyntheseVentes>(
    () => `${API_ADMIN}/achats-contenus/synthese`,
  );
  protected readonly achats = httpResource<Page<AchatAdmin>>(() => {
    const statut: StatutAchat = (
      { payees: 'PAYE', attente: 'EN_ATTENTE', remboursees: 'REMBOURSE' } as const
    )[this.onglet()];
    return { url: `${API_ADMIN}/achats-contenus`, params: { statut, size: 100 } };
  });

  protected readonly onglets = computed(() => {
    const s = this.synthese.hasValue() ? this.synthese.value() : undefined;
    return [
      { valeur: 'payees' as Onglet, libelle: 'Ventes payées', compte: 0 },
      // Paiement direct : vide, sauf en mode manuel (premium.paiement-direct=false).
      { valeur: 'attente' as Onglet, libelle: 'Paiements à confirmer', compte: s?.enAttente ?? 0 },
      { valeur: 'remboursees' as Onglet, libelle: 'Remboursées', compte: 0 },
    ];
  });

  protected readonly titreVide = computed(
    () =>
      ({
        payees: 'Aucune vente',
        attente: 'Aucun paiement à confirmer',
        remboursees: 'Aucun remboursement',
      })[this.onglet()],
  );
  protected readonly messageVide = computed(() =>
    this.onglet() === 'attente'
      ? 'Les paiements sont validés directement : rien à confirmer.'
      : 'Les achats de vidéos premium apparaîtront ici.',
  );

  /** Commission saisie (%), initialisée depuis la synthèse. */
  protected commission: number | null = null;
  protected readonly commissionEnregistrement = signal(false);

  constructor() {
    rechargerEnDirect(this.achats);
    rechargerEnDirect(this.synthese);
    effect(() => {
      if (this.synthese.hasValue() && this.commission === null) {
        this.commission = this.synthese.value().commissionPourcent;
      }
    });
  }

  /** Part du mentor sur un prix donné, comme calculée par le serveur. */
  protected partMentor(prix: number, pourcent: number): number {
    return prix - Math.floor((prix * pourcent) / 100);
  }

  protected erreur(e: unknown): string {
    return messageApi(e);
  }

  private recharger(): void {
    this.achats.reload();
    this.synthese.reload();
  }

  protected confirmer(a: AchatAdmin, montant: number, operation: string): void {
    this.enCours.set(a.reference);
    this.api.confirmer(a.reference, montant, operation).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes(
          `Paiement ${a.reference} confirmé : contenu débloqué pour ${a.acheteurNom}.`,
        );
        this.recharger();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected async refuser(a: AchatAdmin): Promise<void> {
    const { ok, notification } = await this.confirmation.demander({
      titre: `Annuler l'achat ${a.reference} ?`,
      message: `Le paiement de ${fcfa(a.montant)} n'est jamais arrivé ? L'achat sera annulé.`,
      confirmer: "Annuler l'achat",
      danger: true,
      notification: a.acheteurNom,
    });
    if (!ok) return;
    this.enCours.set(a.reference);
    this.api.refuser(a.reference, notification).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes('Achat annulé.');
        this.recharger();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  /** Remboursable tant que la part du mentor n'est ni demandée en retrait ni envoyée. */
  protected remboursable(a: AchatAdmin): boolean {
    return a.statut === 'PAYE' && !a.dateVersement && !a.referenceRetrait;
  }

  protected async rembourser(a: AchatAdmin): Promise<void> {
    const motif = await this.confirmation.demander({
      titre: `Rembourser ${fcfa(a.montant)} à ${a.acheteurNom} ?`,
      message: `« ${a.titreContenu} » sera reverrouillé et la vente retirée des revenus de ${a.mentorNom}. Rendez d'abord l'argent à l'apprenant.`,
      confirmer: 'Continuer',
      danger: true,
      champ: { libelle: 'Motif (envoyé à l\'apprenant et au mentor)', obligatoire: true },
    });
    if (!motif.ok) return;
    const operation = await this.confirmation.demander({
      titre: `Remboursement de ${a.reference}`,
      message: `Saisissez la référence de l'opération ${this.moyens[a.modePaiement] ?? ''} par laquelle ${fcfa(a.montant)} ont été rendus.`,
      confirmer: 'Marquer remboursé',
      champ: { libelle: "Référence de l'opération", obligatoire: true },
    });
    if (!operation.ok) return;
    this.enCours.set(a.reference);
    this.api.rembourser(a.reference, operation.texte, motif.texte).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes(`Achat ${a.reference} remboursé.`);
        this.recharger();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected enregistrerCommission(): void {
    const p = this.commission;
    if (p === null || p < 0 || p > 90) {
      this.toast.erreur('La commission doit être comprise entre 0 et 90 %.');
      return;
    }
    this.commissionEnregistrement.set(true);
    this.api.enregistrerCommission(Math.round(p)).subscribe({
      next: (r) => {
        this.commissionEnregistrement.set(false);
        this.commission = r.pourcent;
        this.synthese.reload();
        this.toast.succes(`Commission fixée à ${r.pourcent} % pour les prochains achats.`);
      },
      error: (e) => {
        this.commissionEnregistrement.set(false);
        this.toast.erreur(messageApi(e));
      },
    });
  }
}
