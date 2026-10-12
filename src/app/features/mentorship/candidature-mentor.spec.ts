import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CandidatureMentorPage } from './candidature-mentor';
import { MentoratPage } from './mentorat';
import type { CandidatureMentor } from './mentorship.model';

const CANDIDATURE: CandidatureMentor = {
  id: 7,
  artisanId: 42,
  artisanNom: 'Awa Traoré',
  artisanEmail: 'awa@bolono.ml',
  artisanTelephone: '+223 70 00 00 00',
  specialite: 'Teinture',
  adresseAtelier: 'Bamako, Hippodrome',
  photoUrl: null,
  dateCandidature: '2026-10-01T10:00:00',
  statut: 'EN_ATTENTE',
  dateDecision: null,
  motifRefus: null,
  domaineExpertise: 'Bogolan',
  motivation: 'Transmettre le bogolan aux jeunes.',
  lienGroupeWhatsapp: null,
  anneesExperience: 12,
  adminDecideurNom: null,
  statutKyc: 'REJETEE',
  motifsKyc: ['DOCUMENT_EXPIRED'],
  dateKyc: '2026-10-02T09:00:00',
  kycExigee: true,
};

const PROFIL = {
  profil: {
    id: 42,
    nom: 'Awa Traoré',
    email: 'awa@bolono.ml',
    telephone: '+223 70 00 00 00',
    photoUrl: null,
    role: 'ARTISAN',
    mentor: false,
    specialite: 'Teinture',
    ville: 'Bamako',
    dateInscription: '2026-01-01T10:00:00',
    suspendu: false,
    boutiqueId: null,
  },
  commune: null,
  biographie: 'Teinturière depuis 2014.',
  adresseAtelier: 'Hippodrome',
  lienWhatsapp: null,
  domaineExpertise: 'Bogolan',
  motifSuspension: null,
  dateSuspension: null,
  profilDeBase: 'ARTISAN',
  candidatureMentor: 'EN_ATTENTE',
  activite: {
    publications: 5,
    produits: 3,
    commandes: 0,
    totalDepense: 0,
    formationsPubliees: 0,
    formationsSuivies: 2,
    abonnes: 18,
  },
  boutique: null,
};

let http: HttpTestingController;

/** Répond aux requêtes en attente selon leur adresse, sur plusieurs passes. */
async function repondre(f: ComponentFixture<unknown>): Promise<string[]> {
  const urls: string[] = [];
  for (let passe = 0; passe < 4; passe++) {
    f.detectChanges();
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    for (const r of http.match(() => true)) {
      const url = r.request.url;
      urls.push(url);
      if (url.endsWith('/candidatures-mentor/7')) r.flush(CANDIDATURE);
      else if (url.endsWith('/utilisateurs/42')) r.flush(PROFIL);
      else r.flush({ content: [CANDIDATURE], totalElements: 1, totalPages: 1, number: 0, size: 12 });
    }
    // Pas de whenStable : la requête du profil part après la réponse et resterait en attente.
    await new Promise((r) => setTimeout(r, 0));
  }
  f.detectChanges();
  return urls;
}

function monter<T>(type: Type<T>): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  http = TestBed.inject(HttpTestingController);
  return TestBed.createComponent(type);
}

describe('Candidatures de mentorat', () => {
  it("la liste n'affiche plus de boutons de décision : chaque carte mène au détail", async () => {
    const f = monter(MentoratPage);
    await repondre(f as ComponentFixture<unknown>);
    const el = f.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('button')].some((b) => /Accepter|Refuser/.test(b.textContent ?? ''))).toBe(false);
    const lien = el.querySelector('a[href="/mentorat/7"]');
    expect(lien?.textContent).toContain('Voir la candidature');
  });

  it('la page de détail montre candidature, identité, profil, activité et la décision', async () => {
    const f = monter(CandidatureMentorPage);
    f.componentRef.setInput('id', '7');
    const urls = await repondre(f as ComponentFixture<unknown>);
    expect(urls.some((u) => u.endsWith('/api/users/admin/candidatures-mentor/7'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/api/admin/utilisateurs/42'))).toBe(true);

    const texte = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Transmettre le bogolan aux jeunes.');
    expect(texte).toContain('12 ans');
    expect(texte).toContain('Identité refusée');
    expect(texte).toContain('Pièce expirée');
    expect(texte).toContain("La vérification d'identité est exigée");
    expect(texte).toContain('Teinturière depuis 2014.');
    expect(texte).toContain('18');
    const boutons = [...(f.nativeElement as HTMLElement).querySelectorAll('button')].map((b) => b.textContent?.trim());
    expect(boutons).toContain('Accepter la candidature');
    expect(boutons).toContain('Refuser');
  });
});
