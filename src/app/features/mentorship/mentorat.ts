import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  linkedSignal,
  signal,
} from '@angular/core';
import { STATUTS_CANDIDATURE, STATUTS_KYC } from './mentorship.labels';
import { environment } from '../../../environments/environment';
import { derniereValeur, rechargerEnDirect, sansVides } from '../../core/api/ressources';
import { dateCourte, dateHeure } from '../../core/utils/format';
import { messageApi } from '../../core/auth/http';
import type { CandidatureMentor, StatutCandidature } from './mentorship.model';
import type { Page } from '../../core/models/common.model';
import { Icon } from '../../shared/icons/icon';
import { RouterLink } from '@angular/router';
import { Avatar, Badge, EtatVide, Pagination, Squelette, EntetePage } from '../../shared/components/ui';

@Component({
  selector: 'app-mentorat',
  imports: [RouterLink, EntetePage, Icon, Avatar, Badge, EtatVide, Pagination, Squelette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentorat.html',
})
export class MentoratPage {
  protected readonly dateCourte = dateCourte;
  protected readonly dateHeure = dateHeure;
  protected readonly statuts = STATUTS_CANDIDATURE;
  protected readonly statutsKyc = STATUTS_KYC;
  protected readonly onglets: { valeur: StatutCandidature | ''; libelle: string }[] = [
    { valeur: 'EN_ATTENTE', libelle: 'En attente' },
    { valeur: 'ACCEPTE', libelle: 'Acceptées' },
    { valeur: 'REFUSE', libelle: 'Refusées' },
    { valeur: '', libelle: 'Toutes' },
  ];

  protected readonly statut = signal<StatutCandidature | ''>('EN_ATTENTE');
  /** Revient à la première page quand le filtre change. */
  protected readonly numero = linkedSignal(() => {
    this.statut();
    return 0;
  });
  protected readonly liste = httpResource<Page<CandidatureMentor>>(() => ({
    url: `${environment.apiUrl}/api/users/admin/candidatures-mentor`,
    params: sansVides({ statut: this.statut(), page: this.numero(), size: 12 }),
  }));
  /** Page affichée : la précédente reste visible pendant le chargement suivant. */
  protected readonly page = derniereValeur(this.liste);
  protected readonly erreur = computed(() => messageApi(this.liste.error()));

  constructor() {
    rechargerEnDirect(this.liste);
  }

  protected filtrer(statut: StatutCandidature | ''): void {
    this.statut.set(statut);
  }
}
