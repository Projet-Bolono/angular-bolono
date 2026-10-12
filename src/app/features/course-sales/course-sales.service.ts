import type { AchatAdmin } from './course-sales.model';
import type { OptionsNotification } from '../../core/models/common.model';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ADMIN } from '../../core/api/api';
import { paramsNotification } from '../../core/api/api-params';

const BASE = `${API_ADMIN}/achats-contenus`;

/** Accès aux opérations de la fonctionnalité ventes de formations. */
@Injectable({ providedIn: 'root' })
export class CourseSalesService {
  private readonly http = inject(HttpClient);

  confirmer(
    reference: string,
    montantRecu: number,
    referenceOperation: string,
  ): Observable<AchatAdmin> {
    return this.http.post<AchatAdmin>(`${BASE}/${reference}/confirmer`, {
      montantRecu,
      referenceOperation,
    });
  }

  refuser(reference: string, notification?: OptionsNotification): Observable<AchatAdmin> {
    return this.http.post<AchatAdmin>(`${BASE}/${reference}/refuser`, null, {
      params: paramsNotification(notification),
    });
  }

  rembourser(reference: string, referenceOperation: string, motif: string): Observable<AchatAdmin> {
    return this.http.post<AchatAdmin>(`${BASE}/${reference}/rembourser`, {
      referenceOperation,
      motif,
    });
  }

  enregistrerCommission(pourcent: number): Observable<{ pourcent: number }> {
    return this.http.put<{ pourcent: number }>(`${BASE}/commission`, { pourcent });
  }
}
