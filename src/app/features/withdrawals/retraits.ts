import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BASE_RETRAITS, WithdrawalsService } from './withdrawals.service';
import type {
  DetailRetrait,
  ReglesRetrait,
  RetraitAdmin,
  StatutRetrait,
  StatutVerification,
  SyntheseRetraits,
} from './withdrawals.model';
import { rechargerEnDirect } from '../../core/api/ressources';
import { messageApi } from '../../core/auth/http';
import type { Page } from '../../core/models/common.model';
import { ToastService } from '../../core/notifications/toast.service';
import { dateHeure, fcfa } from '../../core/utils/format';
import { Icon } from '../../shared/icons/icon';
import {
  Badge,
  BarreChargement,
  ConfirmationService,
  EntetePage,
  EtatVide,
  Squelette,
} from '../../shared/components/ui';

type Ton = 'neutre' | 'succes' | 'attention' | 'erreur' | 'info' | 'accent';

const MOYENS: Record<string, string> = { ORANGE_MONEY: 'Orange Money', WAVE: 'Wave' };

const IDENTITES: Record<StatutVerification, { libelle: string; ton: Ton }> = {
  APPROUVEE: { libelle: 'Identité vérifiée', ton: 'succes' },
  EN_REVUE: { libelle: 'Identité en revue', ton: 'attention' },
  EN_TRAITEMENT: { libelle: 'Identité en cours', ton: 'attention' },
  EN_ATTENTE_ENVOI: { libelle: 'Identité non envoyée', ton: 'attention' },
  A_REPRENDRE: { libelle: 'Identité à reprendre', ton: 'attention' },
  REJETEE: { libelle: 'Identité rejetée', ton: 'erreur' },
  EXPIREE: { libelle: 'Vérification expirée', ton: 'erreur' },
  ANNULEE: { libelle: 'Vérification annulée', ton: 'erreur' },
};

const ONGLETS: { valeur: StatutRetrait; libelle: string }[] = [
  { valeur: 'DEMANDEE', libelle: 'À traiter' },
  { valeur: 'VERSEE', libelle: 'Envoyés' },
  { valeur: 'REJETEE', libelle: 'Refusés' },
  { valeur: 'ANNULEE', libelle: 'Annulés' },
];

/**
 * « Retraits des mentors » : chaque mentor demande le retrait de sa part
 * disponible (ventes payées depuis plus que le délai de libération), vers son
 * compte Orange Money ou Wave. L'équipe vérifie le bénéficiaire, envoie
 * l'argent puis saisit la référence de l'opération, ou refuse avec un motif.
 */
@Component({
  selector: 'app-retraits',
  imports: [FormsModule, EntetePage, Icon, Badge, BarreChargement, EtatVide, Squelette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retraits.html',
})
export class RetraitsPage {
  private readonly api = inject(WithdrawalsService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly fcfa = fcfa;
  protected readonly dateHeure = dateHeure;
  protected readonly moyens = MOYENS;

  protected readonly onglet = signal<StatutRetrait>('DEMANDEE');
  protected readonly enCours = signal<string | null>(null);
  /** Demande dépliée et ses ventes. */
  protected readonly ouverte = signal<string | null>(null);
  protected readonly detail = signal<DetailRetrait | null>(null);

  protected readonly synthese = httpResource<SyntheseRetraits>(() => `${BASE_RETRAITS}/synthese`);
  protected readonly demandes = httpResource<Page<RetraitAdmin>>(() => ({
    url: BASE_RETRAITS,
    params: { statut: this.onglet(), size: 100 },
  }));
  protected readonly reglesActuelles = httpResource<ReglesRetrait>(() => `${BASE_RETRAITS}/regles`);

  protected readonly onglets = computed(() => {
    const attente = this.synthese.hasValue() ? this.synthese.value().demandesEnAttente : 0;
    return ONGLETS.map((o) => ({ ...o, compte: o.valeur === 'DEMANDEE' ? attente : 0 }));
  });

  /** Critères saisis, initialisés depuis le serveur. */
  protected regles: ReglesRetrait | null = null;
  protected readonly reglesEnregistrement = signal(false);

  constructor() {
    rechargerEnDirect(this.demandes);
    rechargerEnDirect(this.synthese);
    effect(() => {
      if (this.reglesActuelles.hasValue() && this.regles === null) {
        this.regles = { ...this.reglesActuelles.value() };
      }
    });
  }

  protected identite(r: RetraitAdmin): { libelle: string; ton: Ton } {
    return r.identite ? IDENTITES[r.identite] : { libelle: 'Identité non vérifiée', ton: 'erreur' };
  }

  /** Compte modifié moins de 7 jours avant la demande : à regarder de plus près. */
  protected compteRecent(r: RetraitAdmin): boolean {
    if (!r.compteModifieLe) return false;
    const ecart = new Date(r.dateDemande).getTime() - new Date(r.compteModifieLe).getTime();
    return ecart < 7 * 24 * 3600_000;
  }

  protected erreur(e: unknown): string {
    return messageApi(e);
  }

  protected basculer(r: RetraitAdmin): void {
    if (this.ouverte() === r.reference) {
      this.ouverte.set(null);
      return;
    }
    this.ouverte.set(r.reference);
    this.detail.set(null);
    this.http.get<DetailRetrait>(`${BASE_RETRAITS}/${r.reference}`).subscribe({
      next: (d) => {
        if (this.ouverte() === r.reference) this.detail.set(d);
      },
      error: (e) => this.toast.erreur(messageApi(e)),
    });
  }

  private recharger(): void {
    this.demandes.reload();
    this.synthese.reload();
  }

  protected async verser(r: RetraitAdmin): Promise<void> {
    const { ok, texte } = await this.confirmation.demander({
      titre: `Envoyer ${fcfa(r.montant)} à ${r.mentorNom}`,
      message:
        `${this.moyens[r.operateur] ?? r.operateur} ${r.numero} · titulaire : ${r.titulaire}. ` +
        "Vérifiez que le titulaire correspond à l'identité du mentor, envoyez la somme, puis saisissez la référence de l'opération.",
      confirmer: 'Marquer comme envoyé',
      champ: { libelle: "Référence de l'opération", obligatoire: true },
    });
    if (!ok) return;
    this.enCours.set(r.reference);
    this.api.verser(r.reference, texte).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes(`Retrait ${r.reference} envoyé : ${r.mentorNom} est prévenu.`);
        this.recharger();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected async rejeter(r: RetraitAdmin): Promise<void> {
    const { ok, texte } = await this.confirmation.demander({
      titre: `Refuser le retrait ${r.reference} ?`,
      message: `${r.mentorNom} sera prévenu du motif ; ses ${fcfa(r.montant)} redeviennent disponibles.`,
      confirmer: 'Refuser',
      danger: true,
      champ: { libelle: 'Motif (envoyé au mentor)', obligatoire: true },
    });
    if (!ok) return;
    this.enCours.set(r.reference);
    this.api.rejeter(r.reference, texte).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes('Retrait refusé.');
        this.recharger();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected enregistrerRegles(): void {
    const r = this.regles;
    if (
      !r ||
      r.delaiLiberationJours < 0 ||
      r.delaiLiberationJours > 90 ||
      r.montantMinimum < 0 ||
      r.delaiCompteHeures < 0 ||
      r.delaiCompteHeures > 720
    ) {
      this.toast.erreur('Valeurs invalides : délai 0 à 90 jours, compte 0 à 720 heures.');
      return;
    }
    this.reglesEnregistrement.set(true);
    this.api
      .enregistrerRegles({
        delaiLiberationJours: Math.round(r.delaiLiberationJours),
        montantMinimum: Math.round(r.montantMinimum),
        delaiCompteHeures: Math.round(r.delaiCompteHeures),
      })
      .subscribe({
        next: (enregistrees) => {
          this.reglesEnregistrement.set(false);
          this.regles = { ...enregistrees };
          this.toast.succes('Critères de retrait enregistrés.');
        },
        error: (e) => {
          this.reglesEnregistrement.set(false);
          this.toast.erreur(messageApi(e));
        },
      });
  }
}
