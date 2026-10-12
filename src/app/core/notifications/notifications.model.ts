export interface Notifications {
  candidaturesEnAttente: number;
  publicationsSignalees: number;
  /** Ventes sécurisées : paiements à rapprocher, litiges à trancher, fonds à rendre ou à verser. */
  paiementsAConfirmer: number;
  litigesEnCours: number;
  remboursementsAEffectuer: number;
  versementsAEffectuer: number;
  /** Formations : retraits demandés par les mentors, à traiter. */
  retraitsADemander: number;
}

/** Événement temps réel du back-office (canal /topic/admin.evenements). */
export interface EvenementAdmin {
  type: 'CANDIDATURE_MENTOR' | 'SIGNALEMENT' | 'PRODUIT' | 'COMMANDE' | 'PAIEMENT' | 'RETRAIT';
  message: string;
  date: string;
}
