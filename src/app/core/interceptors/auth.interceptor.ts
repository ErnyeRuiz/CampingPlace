import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { isSecondAuthAttempt } from '../context/auth-http-context';
import { AuthService } from '../services/http/auth.service';
import { LocalStorageService } from '../services/local-storage.service';
import { AuthRefreshCoordinator } from '../services/auth-refresh.coordinator';

function skipBearerAuthorization(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/register') ||
    u.includes('/auth/refresh') ||
    u.includes('/auth/verify-email') ||
    u.includes('/auth/resend-verification') ||
    u.includes('/auth/forgot-password') ||
    u.includes('/auth/reset-password')
  );
}

function skipRefreshOn401(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/auth/refresh') ||
    u.includes('/auth/login') ||
    u.includes('/auth/logout')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(LocalStorageService);
  const auth = inject(AuthService);
  const coordinator = inject(AuthRefreshCoordinator);

  const token = storage.getAuthToken();
  const authReq =
    token && !skipBearerAuthorization(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      if (req.context.get(isSecondAuthAttempt)) {
        return throwError(() => err);
      }
      if (skipRefreshOn401(req.url)) {
        return throwError(() => err);
      }

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        auth.clearSessionAndRedirectToLogin();
        return throwError(() => err);
      }

      return coordinator.refresh(refreshToken).pipe(
        switchMap((data) => {
          auth.applySession(data);
          const retry = authReq.clone({
            setHeaders: { Authorization: `Bearer ${data.token}` },
            context: authReq.context.set(isSecondAuthAttempt, true),
          });
          return next(retry);
        }),
        catchError((refreshErr) => {
          auth.clearSessionAndRedirectToLogin();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
