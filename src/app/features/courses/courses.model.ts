import type { Personne } from '../../core/models/common.model';

export interface FormationStat {
  id: number;
  titre: string;
  categorie: string;
  niveau: string | null;
  miniature: string | null;
  auteur: string | null;
  modules: number;
  apprenants: number;
  termines: number;
  tauxCompletion: number;
  dateCreation: string | null;
}

export interface QuizResume {
  id: number;
  titre: string;
  questions: number;
  scoreMinimum: number;
  badge: string | null;
  tentatives: number;
  reussites: number;
}

export type ModeTarification = 'GRATUITE' | 'FORMATION_ENTIERE' | 'PAR_VIDEO';

export interface ModuleAdmin {
  id: number;
  titre: string;
  description: string | null;
  urlVideo: string;
  dureeSecondes: number;
  ordre: number;
  disponibleHorsLigne: boolean;
  termines: number;
  quiz: QuizResume | null;
  /** Prix fixé par le mentor (FCFA), en « vidéo par vidéo » seulement. */
  prix: number | null;
  /** Réservée aux acheteurs (vendue seule ou avec la formation). */
  payante: boolean;
  /** Vidéo offerte d'une formation vendue entière. */
  apercuGratuit: boolean;
}

export interface FormationDetailAdmin {
  id: number;
  titre: string;
  description: string | null;
  categorie: string;
  niveau: string | null;
  miniatureUrl: string | null;
  auteur: Personne | null;
  dateCreation: string | null;
  dureeTotaleSecondes: number;
  apprenants: number;
  termines: number;
  tauxCompletion: number;
  modules: ModuleAdmin[];
  /** Brouillon du mentor, pas encore au catalogue. */
  brouillon: boolean;
  /** Retirée du catalogue par l'équipe (les acheteurs gardent l'accès). */
  retiree: boolean;
  /** Mode de vente choisi par le mentor dans l'app. */
  modeTarification: ModeTarification;
  prixFormation: number | null;
  /** Achats payés (vidéos ou formation entière). */
  ventes: number;
}

export interface FormationRequest {
  titre: string;
  description: string | null;
  categorie: string;
  niveau: string | null;
  miniatureUrl: string | null;
  auteurId: number | null;
}

export interface ModuleRequest {
  titre: string;
  description: string | null;
  urlVideo: string;
  dureeSecondes: number;
  disponibleHorsLigne: boolean;
}

export type TypeQuestion = 'CHOIX_UNIQUE' | 'CHOIX_MULTIPLE' | 'VRAI_FAUX';

export interface ReponseQuiz {
  id?: number | null;
  texte: string;
  estCorrecte: boolean;
  explication?: string | null;
}

export interface QuestionQuiz {
  id?: number | null;
  intitule: string;
  explication: string | null;
  points: number;
  type: TypeQuestion;
  reponses: ReponseQuiz[];
}

export interface QuizAdmin {
  id: number;
  titre: string;
  description: string | null;
  scoreMinimum: number;
  dureeMinutes: number | null;
  nbTentativesMax: number | null;
  estObligatoire: boolean;
  badgeId: number | null;
  tentatives: number;
  questionsModifiables: boolean;
  questions: QuestionQuiz[];
}
