import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MentorshipService } from './mentorship.service';
import { MOTIFS_KYC, STATUTS_CANDIDATURE, STATUTS_KYC } from './mentorship.labels';
import type { CandidatureMentor } from './mentorship.model';
import type { UtilisateurDetail } from '../users/users.model';
import { environment } from '../../../environments/environment';
import { API_ADMIN } from '../../core/api/api';
import { messageApi } from '../../core/auth/http';
import { dateCourte, dateHeure, fcfa, nombre } from '../../core/utils/format';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { ToastService } from '../../core/notifications/toast.service';
import { Icon } from '../../shared/icons/icon';
import { Avatar, Badge, ConfirmationService, EtatVide, Squelette, type Ton } from '../../shared/components/ui';

/**
 * Page de détail d'une candidature de mentorat : ce que l'artisan a déclaré,
 * l'état de sa vérification d'identité, un résumé de son profil et de son
 * activité, puis la décision. Ouverte depuis la liste (/mentorat/:id).
 */
@Component({
  selector: 'app-candidature-mentor',
  imports: [RouterLink, Icon, Avatar, Badge, EtatVide, Squelette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './candidature-mentor.html',
})
export class CandidatureMentorPage {
  /** Identifiant de la candidature (paramètre de route). */
  readonly id = input.required<string>();

  private readonly api = inject(MentorshipService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly notifications = inject(NotificationsService);
  protected readonly dateCourte = dateCourte;
  protected readonly dateHeure = dateHeure;
  protected readonly fcfa = fcfa;
  protected readonly nombre = nombre;
  protected readonly statuts = STATUTS_CANDIDATURE;
  protected readonly statutsKyc = STATUTS_KYC;

  protected readonly candidature = httpResource<CandidatureMentor>(
    () => `${environment.apiUrl}/api/users/admin/candidatures-mentor/${this.id()}`,
  );
  /** Profil complet du candidat, chargé une fois la candidature connue. */
  protected readonly profil = httpResource<UtilisateurDetail>(() =>
    this.candidature.hasValue() ? `${API_ADMIN}/utilisateurs/${this.candidature.value().artisanId}` : undefined,
  );
  protected readonly erreur = computed(() => messageApi(this.candidature.error()));
  protected readonly enCours = signal(false);

  /** Ce qui mérite l'attention avant d'accepter : identité, compte suspendu, profil vide. */
  protected readonly alertes = computed(() => {
    if (!this.candidature.hasValue()) return [];
    const c = this.candidature.value();
    const p = this.profil.hasValue() ? this.profil.value() : null;
    const out: { ton: Ton; texte: string }[] = [];
    if (c.statutKyc !== 'APPROUVEE') {
      out.push({
        ton: c.kycExigee ? 'erreur' : 'attention',
        texte: c.kycExigee
          ? "La vérification d'identité est exigée et n'est pas approuvée pour ce candidat."
          : "L'identité de ce candidat n'a pas été vérifiée (vérification non exigée actuellement).",
      });
    }
    if (p?.profil.suspendu) out.push({ ton: 'erreur', texte: 'Ce compte est suspendu.' });
    if (p && !p.biographie && !p.activite.publications && !p.activite.produits) {
      out.push({ ton: 'attention', texte: 'Profil peu renseigné : ni présentation, ni publication, ni produit.' });
    }
    return out;
  });

  protected motif(code: string): string {
    return MOTIFS_KYC[code] ?? code;
  }

  protected experience(c: CandidatureMentor): string {
    if (c.anneesExperience == null) return '—';
    return `${c.anneesExperience} an${c.anneesExperience > 1 ? 's' : ''}`;
  }

  protected async decider(statut: 'ACCEPTE' | 'REFUSE'): Promise<void> {
    if (!this.candidature.hasValue()) return;
    const c = this.candidature.value();
    const identiteNonVerifiee = c.statutKyc !== 'APPROUVEE';
    const reponse = await this.confirmation.demander(
      statut === 'ACCEPTE'
        ? {
            titre: `Faire de ${c.artisanNom} un mentor ?`,
            message:
              'Il pourra publier des formations et des statuts visibles par ses abonnés.' +
              (identiteNonVerifiee ? " Attention : son identité n'est pas vérifiée." : ''),
            confirmer: 'Accepter',
            notification: c.artisanNom,
          }
        : {
            titre: `Refuser la candidature de ${c.artisanNom} ?`,
            message: 'Le motif est enregistré avec la candidature et communiqué à l’artisan.',
            confirmer: 'Refuser',
            danger: true,
            champ: { libelle: 'Motif du refus', obligatoire: true },
            notification: c.artisanNom,
          },
    );
    if (!reponse.ok) return;
    this.enCours.set(true);
    this.api.deciderCandidature(c.id, statut, reponse.texte, reponse.notification).subscribe({
      next: (maj) => {
        this.enCours.set(false);
        this.candidature.value.set(maj);
        this.toast.succes(statut === 'ACCEPTE' ? `${c.artisanNom} est désormais mentor.` : 'Candidature refusée.');
        this.notifications.rafraichir();
        this.profil.reload();
      },
      error: (e) => {
        this.enCours.set(false);
        this.toast.erreur(messageApi(e));
      },
    });
  }
}
