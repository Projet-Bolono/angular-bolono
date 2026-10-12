import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_ADMIN } from '../../core/api/ressources';
import { messageApi } from '../../core/auth/http';
import type { Page } from '../../core/models/common.model';
import { ToastService } from '../../core/notifications/toast.service';
import { dateHeure } from '../../core/utils/format';
import { Icon } from '../../shared/icons/icon';
import {
  BarreChargement,
  ConfirmationService,
  EntetePage,
  EtatVide,
  Squelette,
} from '../../shared/components/ui';

export interface AvisAdmin {
  id: number;
  formationId: number;
  formationTitre: string;
  auteurNom: string;
  auteurEmail: string;
  note: number;
  commentaire: string | null;
  date: string;
  masque: boolean;
  motifMasquage: string | null;
}

const BASE = `${API_ADMIN}/avis`;

/**
 * « Avis des formations » : les notes et commentaires des apprenants, les
 * plus récents d'abord. L'équipe masque un avis déplacé (motif envoyé à son
 * auteur) : il disparaît de la fiche et ne compte plus dans la note.
 */
@Component({
  selector: 'app-avis',
  imports: [RouterLink, EntetePage, Icon, BarreChargement, EtatVide, Squelette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-entete-page titre="Avis des formations"> </app-entete-page>

    <div class="onglets mb-4 sm:w-fit" role="tablist">
      @for (o of [false, true]; track o) {
        <button
          class="onglet"
          [class.onglet-actif]="masques() === o"
          role="tab"
          [attr.aria-selected]="masques() === o"
          (click)="masques.set(o)"
        >
          {{ o ? 'Masqués' : 'Publiés' }}
        </button>
      }
    </div>

    <div class="card relative p-4 sm:p-5">
      <app-barre-chargement [actif]="avis.isLoading()" />
      @if (avis.error()) {
        <app-etat-vide icone="warning" titre="Chargement impossible" [message]="erreur(avis.error())">
          <button class="btn-accent btn-sm mt-2" (click)="avis.reload()">Réessayer</button>
        </app-etat-vide>
      } @else if (avis.value(); as page) {
        @if (page.content.length) {
          <ul class="divide-y divide-line">
            @for (a of page.content; track a.id) {
              <li class="flex flex-wrap items-start justify-between gap-3 py-4">
                <div class="min-w-0 max-w-2xl">
                  <p class="font-semibold">
                    <span class="text-ochre" [attr.aria-label]="a.note + ' sur 5'">{{ etoiles(a.note) }}</span>
                    ·
                    <a class="link-accent" [routerLink]="['/formations', a.formationId]">{{
                      a.formationTitre
                    }}</a>
                  </p>
                  @if (a.commentaire) {
                    <p class="mt-1 text-sm">« {{ a.commentaire }} »</p>
                  }
                  <p class="mt-1 text-xs text-muted-strong">
                    {{ a.auteurNom }} · {{ a.auteurEmail }} · {{ dateHeure(a.date) }}
                  </p>
                  @if (a.masque) {
                    <p class="text-xs text-error">Masqué : {{ a.motifMasquage }}</p>
                  }
                </div>
                <button
                  class="btn-outline btn-sm"
                  [disabled]="enCours() === a.id"
                  (click)="basculer(a)"
                >
                  <app-icon [name]="a.masque ? 'eye' : 'eye-slash'" [size]="15" />
                  {{ a.masque ? 'Rétablir' : 'Masquer' }}
                </button>
              </li>
            }
          </ul>
        } @else {
          <app-etat-vide
            icone="star"
            [titre]="masques() ? 'Aucun avis masqué' : 'Aucun avis'"
            message="Les avis des apprenants apparaîtront ici."
          />
        }
      } @else {
        <app-squelette [hauteur]="240" />
      }
    </div>
  `,
})
export class AvisPage {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly dateHeure = dateHeure;

  protected readonly masques = signal(false);
  protected readonly enCours = signal<number | null>(null);
  protected readonly avis = httpResource<Page<AvisAdmin>>(() => ({
    url: BASE,
    params: { masques: this.masques(), size: 100 },
  }));

  protected etoiles(note: number): string {
    return '★'.repeat(note) + '☆'.repeat(5 - note);
  }

  protected erreur(e: unknown): string {
    return messageApi(e);
  }

  protected async basculer(a: AvisAdmin): Promise<void> {
    let motif: string | null = null;
    if (!a.masque) {
      const { ok, texte } = await this.confirmation.demander({
        titre: "Masquer l'avis ?",
        message: `Il disparaîtra de « ${a.formationTitre} » et ne comptera plus dans sa note. ${a.auteurNom} sera prévenu du motif.`,
        confirmer: 'Masquer',
        danger: true,
        champ: { libelle: 'Motif', obligatoire: true },
      });
      if (!ok) return;
      motif = texte;
    }
    this.enCours.set(a.id);
    this.http.patch<AvisAdmin>(`${BASE}/${a.id}/masquage`, { masque: !a.masque, motif }).subscribe({
      next: () => {
        this.enCours.set(null);
        this.toast.succes(a.masque ? 'Avis rétabli.' : 'Avis masqué.');
        this.avis.reload();
      },
      error: (e) => {
        this.enCours.set(null);
        this.toast.erreur(messageApi(e));
      },
    });
  }
}
