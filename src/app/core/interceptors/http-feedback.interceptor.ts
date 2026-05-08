import { HttpInterceptorFn, HttpResponse, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError, finalize } from 'rxjs';
import { throwError } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { ApiResponse } from '../models/api/api-response';

function isMutation(req: HttpRequest<unknown>): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

/** Login errors handled in {@link LoginComponent} (UI + redirect); skip duplicate danger toast. */
function shouldSuppressLoginErrorToast(
  req: HttpRequest<unknown>,
  error: HttpErrorResponse,
): boolean {
  if (req.method !== 'POST' || !req.url.includes('/auth/login')) {
    return false;
  }
  const errorCode = (error.error as { errorCode?: string } | null)?.errorCode;
  return (
    errorCode === 'User.EmailNotVerified' ||
    errorCode === 'User.AdminAccountNotReady'
  );
}

export const httpFeedbackInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const toast   = inject(ToastService);

  loading.increment();

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const body = event.body as ApiResponse<unknown> | null;
        if (body && typeof body === 'object' && 'success' in body) {
          if (!body.success && body.message) {
            toast.danger(body.message);
          } else if (body.success && body.message && isMutation(req)) {
            toast.success(body.message);
          }
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (!shouldSuppressLoginErrorToast(req, error)) {
        const apiMsg = (error.error as ApiResponse<unknown> | null)?.message;
        toast.danger(apiMsg ?? 'Error de conexión. Intenta de nuevo.');
      }
      return throwError(() => error);
    }),
    finalize(() => loading.decrement())
  );
};
