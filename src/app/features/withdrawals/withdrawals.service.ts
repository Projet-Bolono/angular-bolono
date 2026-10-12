import type { ReglesRetrait, RetraitAdmin } from './withdrawals.model';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ADMIN } from '../../core/api/api';

export const BASE_RETRAITS = `${API_ADMIN}/retraits`;

/** Accès aux opérations de la fonctionnalité retraits des mentors. */
@Injectable({ providedIn: 'root' })
export class WithdrawalsService {
  private readonly http = inject(HttpClient);

  verser(reference: string, referenceOperation: string): Observable<RetraitAdmin> {
    return this.http.post<RetraitAdmin>(`${BASE_RETRAITS}/${reference}/verser`, {
      referenceOperation,
    });
  }

  rejeter(reference: string, motif: string): Observable<RetraitAdmin> {
    return this.http.post<RetraitAdmin>(`${BASE_RETRAITS}/${reference}/rejeter`, { motif });
  }

  enregistrerRegles(regles: ReglesRetrait): Observable<ReglesRetrait> {
    return this.http.put<ReglesRetrait>(`${BASE_RETRAITS}/regles`, regles);
  }
}
