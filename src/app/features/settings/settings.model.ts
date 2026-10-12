/** Règles en vigueur, fixées dans la configuration du serveur (lecture seule). */
export interface ReglesVentes {
  delaiPaiementHeures: number;
  delaiAcceptationHeures: number;
  delaiExpeditionHeures: number;
  delaiConfirmationHeures: number;
  delaiInspectionHeures: number;
  commissionPourMille: number;
  maxEnAttenteParAcheteur: number;
  rappelAvantHeures: number;
}

// ── Plateforme ────────────────────────────────────────────────────────────

export type TypeCategorie = 'PRODUIT' | 'FORMATION' | 'PUBLICATION';

export interface CategorieAdmin {
  id: number;
  type: TypeCategorie;
  nom: string;
  icone: string | null;
  ordre: number;
  active: boolean;
  utilisations: number;
}

export type CleParametre =
  | 'CONTACT_EMAIL'
  | 'CONTACT_TELEPHONE'
  | 'CONTACT_WHATSAPP'
  | 'MESSAGE_ACCUEIL'
  | 'A_PROPOS'
  | 'CONDITIONS_UTILISATION'
  | 'POLITIQUE_CONFIDENTIALITE'
  | 'PAIEMENT_ORANGE_MONEY'
  | 'PAIEMENT_WAVE';

export interface ParametreAdmin {
  cle: CleParametre;
  libelle: string;
  description: string;
  format: 'TEXTE_COURT' | 'TEXTE_LONG' | 'EMAIL' | 'TELEPHONE';
  publique: boolean;
  valeur: string | null;
  dateModification: string | null;
}

/** Connexion au service de vérification d'identité (secrets jamais renvoyés en clair). */
export interface ConfigurationKyc {
  actif: boolean;
  urlApi: string | null;
  urlPublique: string | null;
  pays: string;
  cleApiDefinie: boolean;
  /** Partie publique de la clé, ex. « kyc_live_ab12cd34 ». */
  apercuCleApi: string | null;
  environnement: 'test' | 'live' | null;
  secretWebhookDefini: boolean;
  dateModification: string | null;
  modifiePar: string | null;
}

/** Clé d'API ou secret vides : valeur enregistrée conservée. */
/**
 * Mise à jour partielle : seuls les champs présents changent côté serveur.
 * `urlPublique: ''` efface l'URL publique.
 */
export interface ModifierConfigurationKyc {
  actif?: boolean;
  urlApi?: string;
  urlPublique?: string;
  pays?: string;
  cleApi?: string;
  secretWebhook?: string;
  supprimerSecretWebhook?: boolean;
}

export interface TestConnexionKyc {
  joignable: boolean;
  cleValide: boolean;
  environnement: 'test' | 'live' | null;
  message: string;
}
