import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type OkrValidationResult = {
  ok: boolean;
  issues: Array<{ code: string; message: string }>;
  summary: string;
};

@Injectable({ providedIn: 'root' })
export class OkrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/okr`;

  validateDraft(draft: string): Observable<OkrValidationResult> {
    return this.http.post<OkrValidationResult>(`${this.baseUrl}/validate`, { draft });
  }
}
