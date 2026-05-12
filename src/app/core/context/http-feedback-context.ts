import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Cuando es `true`, el interceptor de feedback no muestra toast de éxito para esa petición
 * (p. ej. mutación previa encadenada a otra donde sí debe verse el resultado final).
 */
export const suppressHttpSuccessFeedback = new HttpContextToken<boolean>(
  () => false,
);

/** Cuando es `true`, no se muestra toast de error (p. ej. logout en segundo plano). */
export const suppressHttpErrorFeedback = new HttpContextToken<boolean>(
  () => false,
);

export function httpContextSuppressSuccessFeedback(): HttpContext {
  return new HttpContext().set(suppressHttpSuccessFeedback, true);
}
