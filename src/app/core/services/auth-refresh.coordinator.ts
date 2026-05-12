import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  finalize,
  mergeMap,
  of,
  shareReplay,
  take,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api/api-response';
import { LoginResponse } from '../models/auth/login-response';

/**
 * Una sola petición POST /auth/refresh en vuelo (comparte el resultado entre 401 concurrentes).
 * Usa {@link HttpBackend} para no pasar por interceptores.
 */
@Injectable({ providedIn: 'root' })
export class AuthRefreshCoordinator {
  private readonly backend = inject(HttpBackend);
  private inFlight: Observable<LoginResponse> | null = null;

  refresh(refreshToken: string): Observable<LoginResponse> {
    if (!this.inFlight) {
      const url = `${environment.apiUrl}/auth/refresh`;
      const client = new HttpClient(this.backend);
      this.inFlight = client
        .post<ApiResponse<LoginResponse>>(url, { refreshToken })
        .pipe(
          take(1),
          mergeMap((res) => {
            if (!res?.success || !res.data?.token || !res.data?.refreshToken) {
              return throwError(
                () =>
                  new HttpErrorResponse({
                    status: 401,
                    error: res,
                  }),
              );
            }
            return of(res.data);
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
          finalize(() => {
            this.inFlight = null;
          }),
        );
    }
    return this.inFlight;
  }
}
