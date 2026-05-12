import { DOCUMENT } from '@angular/common';
import { afterNextRender, inject, Injectable } from '@angular/core';
import { AuthService } from './http/auth.service';
import { LocalStorageService } from './local-storage.service';
import { getJwtExpSeconds } from '../utils/jwt.utils';

const PROACTIVE_MARGIN_SEC = 5 * 60;

@Injectable({ providedIn: 'root' })
export class SessionRenewalService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(LocalStorageService);

  constructor() {
    afterNextRender(() => {
      this.maybeProactiveRefresh();
      this.document.defaultView?.addEventListener('visibilitychange', () => {
        if (this.document.visibilityState === 'visible') {
          this.maybeProactiveRefresh();
        }
      });
    });
  }

  /** Renueva el JWT si está caducado o próximo a caducar (PWA / retorno al primer plano). */
  maybeProactiveRefresh(): void {
    if (!this.auth.isLoggedIn()) {
      return;
    }
    if (!this.storage.getRefreshToken()) {
      return;
    }
    const token = this.storage.getAuthToken();
    const exp = getJwtExpSeconds(token ?? '');
    const nowSec = Date.now() / 1000;
    if (
      exp != null &&
      !Number.isNaN(exp) &&
      exp > nowSec + PROACTIVE_MARGIN_SEC
    ) {
      return;
    }
    this.auth.refreshWithStoredRefreshToken().subscribe();
  }
}
