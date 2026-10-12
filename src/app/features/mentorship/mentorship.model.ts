export type StatutCandidature = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';

/** Statut de la dernière vérification d'identité du candidat. */
export type StatutKyc =
  | 'EN_ATTENTE_ENVOI'
  | 'EN_TRAITEMENT'
  | 'EN_REVUE'
  | 'APPROUVEE'
  | 'REJETEE'
  | 'A_REPRENDRE'
  | 'EXPIREE'
  | 'ANNULEE';

export interface CandidatureMentor {
  id: number;
  artisanId: number;
  artisanNom: string;
  artisanEmail: string | null;
  artisanTelephone: string | null;
  specialite: string | null;
  adresseAtelier: string | null;
  photoUrl: string | null;
  dateCandidature: string;
  statut: StatutCandidature;
  dateDecision: string | null;
  motifRefus: string | null;
  domaineExpertise: string | null;
  motivation: string | null;
  lienGroupeWhatsapp: string | null;
  anneesExperience: number | null;
  adminDecideurNom: string | null;
  /** `null` : vérification jamais commencée. */
  statutKyc: StatutKyc | null;
  /** Codes renvoyés par le service KYC (voir MOTIFS_KYC). */
  motifsKyc: string[];
  dateKyc: string | null;
  /** La configuration actuelle exige-t-elle une identité vérifiée ? */
  kycExigee: boolean;
}
