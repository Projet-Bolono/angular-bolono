export type StatutAchat = 'EN_ATTENTE' | 'PAYE' | 'ANNULE' | 'REMBOURSE';

/** Achat d'une vidéo ou d'une formation entière par un apprenant. */
export interface AchatAdmin {
  reference: string;
  acheteurNom: string;
  acheteurTelephone: string | null;
  mentorNom: string;
  formationId: number;
  formationTitre: string;
  titreContenu: string;
  formationEntiere: boolean;
  montant: number;
  commission: number;
  montantMentor: number;
  modePaiement: 'ORANGE_MONEY' | 'WAVE';
  statut: StatutAchat;
  dateCreation: string;
  datePaiement: string | null;
  referenceOperation: string | null;
  confirmePar: string | null;
  /** Part du mentor envoyée (retrait versé). */
  dateVersement: string | null;
  /** Demande de retrait qui couvre la vente (null : pas encore demandée). */
  referenceRetrait: string | null;
  dateRemboursement: string | null;
  motifRemboursement: string | null;
}

export interface SyntheseVentes {
  enAttente: number;
  payees: number;
  chiffreAffaires: number;
  commissions: number;
  aVerser: number;
  commissionPourcent: number;
}
