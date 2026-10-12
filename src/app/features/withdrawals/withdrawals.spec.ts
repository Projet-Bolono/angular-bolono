import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WithdrawalsService } from './withdrawals.service';
import { CourseSalesService } from '../course-sales/course-sales.service';

describe('Retraits des mentors et remboursements', () => {
  let retraits: WithdrawalsService;
  let ventes: CourseSalesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    retraits = TestBed.inject(WithdrawalsService);
    ventes = TestBed.inject(CourseSalesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("marque un retrait envoyé avec la référence de l'opération", () => {
    retraits.verser('RT-ABCD2345', 'OM778899').subscribe();
    const req = http.expectOne('http://localhost:8080/api/admin/retraits/RT-ABCD2345/verser');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ referenceOperation: 'OM778899' });
    req.flush({});
  });

  it('refuse un retrait avec son motif', () => {
    retraits.rejeter('RT-ABCD2345', 'Titulaire différent').subscribe();
    const req = http.expectOne('http://localhost:8080/api/admin/retraits/RT-ABCD2345/rejeter');
    expect(req.request.body).toEqual({ motif: 'Titulaire différent' });
    req.flush({});
  });

  it('enregistre les critères de retrait', () => {
    const regles = { delaiLiberationJours: 7, montantMinimum: 5000, delaiCompteHeures: 72 };
    retraits.enregistrerRegles(regles).subscribe();
    const req = http.expectOne('http://localhost:8080/api/admin/retraits/regles');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(regles);
    req.flush(regles);
  });

  it("rembourse un achat avec la référence de l'opération et le motif", () => {
    ventes.rembourser('AC-XYZ23456', 'OM-RB-1', 'Vidéo illisible').subscribe();
    const req = http.expectOne(
      'http://localhost:8080/api/admin/achats-contenus/AC-XYZ23456/rembourser',
    );
    expect(req.request.body).toEqual({ referenceOperation: 'OM-RB-1', motif: 'Vidéo illisible' });
    req.flush({});
  });
});
