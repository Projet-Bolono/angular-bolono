import type { Ton } from '../../shared/components/ui';
import type { StatutCandidature, StatutKyc } from './mentorship.model';

export const STATUTS_CANDIDATURE: Record<StatutCandidature, { libelle: string; ton: Ton }> = {
  EN_ATTENTE: { libelle: 'En attente', ton: 'attention' },
  ACCEPTE: { libelle: 'Acceptée', ton: 'succes' },
  REFUSE: { libelle: 'Refusée', ton: 'erreur' },
};

export const STATUTS_KYC: Record<StatutKyc, { libelle: string; ton: Ton }> = {
  EN_ATTENTE_ENVOI: { libelle: 'Identité : photos attendues', ton: 'neutre' },
  EN_TRAITEMENT: { libelle: 'Identité : analyse en cours', ton: 'info' },
  EN_REVUE: { libelle: 'Identité : examen manuel', ton: 'attention' },
  APPROUVEE: { libelle: 'Identité vérifiée', ton: 'succes' },
  REJETEE: { libelle: 'Identité refusée', ton: 'erreur' },
  A_REPRENDRE: { libelle: 'Identité : photos à reprendre', ton: 'attention' },
  EXPIREE: { libelle: 'Identité : session expirée', ton: 'neutre' },
  ANNULEE: { libelle: 'Identité : annulée', ton: 'neutre' },
};

/** Motifs renvoyés par le service KYC (mêmes codes que kyc-server, app/domain/enums.py). */
export const MOTIFS_KYC: Record<string, string> = {
  DOCUMENT_EXPIRED: 'Pièce expirée',
  DOCUMENT_UNREADABLE: 'Pièce illisible',
  DOCUMENT_NOT_FOUND: 'Pièce introuvable sur la photo',
  DOCUMENT_TYPE_MISMATCH: 'Type de pièce incorrect',
  MRZ_INVALID: 'Bande de lecture (MRZ) invalide',
  DATA_MISMATCH: 'Données incohérentes',
  FACE_NOT_FOUND: 'Visage introuvable',
  FACE_MISMATCH: 'Le visage ne correspond pas à la pièce',
  HELD_DOCUMENT_NOT_VISIBLE: 'Pièce tenue non visible sur le selfie',
  POOR_QUALITY: 'Photos de qualité insuffisante',
  LIVENESS_FAILED: 'Présence non confirmée',
  SUSPECTED_FRAUD: 'Fraude suspectée',
  DUPLICATE_IDENTITY: 'Identité déjà utilisée par un autre compte',
  UNDERAGE: 'Personne mineure',
  TECHNICAL_ERROR: 'Erreur technique',
  MANUAL_DECISION: 'Décision de l’équipe de vérification',
};
