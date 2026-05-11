import {
  HttpInterceptorFn,
  HttpResponse,
  HttpErrorResponse,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError, finalize } from 'rxjs';
import { throwError } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { ApiResponse } from '../models/api/api-response';
import { suppressHttpSuccessFeedback } from '../context/http-feedback-context';

function isMutation(req: HttpRequest<unknown>): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

/** Prioriza texto no vacío de la API; si viene vacío o ausente devuelve `null`. */
function normalizeUserFacingMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/** Extrae mensaje de envelope u otros fragmentos típicos (p. ej. ProblemDetails `detail`). */
function extractMessageFromUnknown(body: unknown): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') {
    return normalizeUserFacingMessage(body);
  }
  if (typeof body === 'object' && !(body instanceof Blob)) {
    const rec = body as Record<string, unknown>;
    return (
      normalizeUserFacingMessage(rec['message']) ??
      normalizeUserFacingMessage(rec['detail']) ??
      normalizeUserFacingMessage(rec['title']) ??
      null
    );
  }
  return null;
}

function friendlyHttpFallback(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No pudimos conectar. Revisá tu conexión e intentá de nuevo.';
  }
  if (err.status >= 400 && err.status < 500) {
    return 'No pudimos completar la solicitud.';
  }
  if (err.status >= 500) {
    return 'El servidor respondió con un error. Probá más tarde.';
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

function envelopeFailureFallback(req: HttpRequest<unknown>): string {
  return isMutation(req)
    ? 'No pudimos completar la acción. Intentá de nuevo.'
    : 'No pudimos cargar la información. Intentá de nuevo.';
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
          if (!body.success) {
            const apiMsg =
              normalizeUserFacingMessage(body.message)
              ?? extractMessageFromUnknown(body);
            toast.danger(apiMsg ?? envelopeFailureFallback(req));
          } else if (
            body.success &&
            isMutation(req) &&
            !req.context.get(suppressHttpSuccessFeedback)
          ) {
            const okMsg = normalizeUserFacingMessage(body.message);
            if (okMsg) {
              toast.success(okMsg);
            }
          }
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (!shouldSuppressLoginErrorToast(req, error)) {
        const apiMsg =
          normalizeUserFacingMessage(
            (error.error as ApiResponse<unknown> | null)?.message,
          ) ?? extractMessageFromUnknown(error.error);
        toast.danger(apiMsg ?? friendlyHttpFallback(error));
      }
      return throwError(() => error);
    }),
    finalize(() => loading.decrement()),
  );
};
