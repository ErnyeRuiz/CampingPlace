import { HttpContextToken } from '@angular/common/http';

/** Evita segundo intento de refresh+reintento ante 401 (anti-bucle). */
export const isSecondAuthAttempt = new HttpContextToken<boolean>(() => false);
