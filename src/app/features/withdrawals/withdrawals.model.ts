export type StatutRetrait = 'DEMANDEE' | 'VERSEE' | 'REJETEE' | 'ANNULEE';

export type StatutVerification =
  | 'EN_ATTENTE_ENVOI'
  | 'EN_TRAITEMENT'
  | 'EN_REVUE'
  | 'APPROUVEE'
  | 'REJETEE'
  | 'A_REPRENDRE'
  | 'EXPIREE'
  | 'ANNULEE';

/** Demande de retrait d'un mentor : toute sa part disponible, vers son compte figé à la demande. */
export interface RetraitAdmin {
  reference: string;
  mentorId: number;
  mentorNom: string;
  mentorTelephone: string | null;
  /** Dernière vérification d'identité du mentor (null : jamais vérifiée). */
  identite: StatutVerification | null;
  montant: number;
  nombreVentes: number;
  operateur: 'ORANGE_MONEY' | 'WAVE';
  numero: string;
  titulaire: string;
  /** Dernière modification du compte de versement. */
  compteModifieLe: string | null;
  statut: StatutRetrait;
  dateDemande: string;
  dateTraitement: string | null;
  traitePar: string | null;
  referenceOperation: string | null;
  motifRejet: string | null;
}

export interface VenteCouverte {
  reference: string;
  titreContenu: string;
  acheteurNom: string;
  montant: number;
  montantMentor: number;
  datePaiement: string;
}

export interface DetailRetrait {
  demande: RetraitAdmin;
  ventes: VenteCouverte[];
}

export interface SyntheseRetraits {
  demandesEnAttente: number;
  montantDemande: number;
  montantVerse: number;
  /** Parts des mentors pas encore demandées (en libération ou disponibles). */
  partsNonDemandees: number;
}

export interface ReglesRetrait {
  delaiLiberationJours: number;
  montantMinimum: number;
  delaiCompteHeures: number;
}
