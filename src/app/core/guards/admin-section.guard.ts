import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { APP_HOME_PATH } from '../constants/permissions';
import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/http/auth.service';

/** Permite entrar al shell /admin si hay sesión y rol/permisos de administración. */
export const adminSectionGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const authz = inject(AuthorizationService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: router.url },
    });
  }
  if (!authz.hasAdminSectionAccess()) {
    return router.createUrlTree([APP_HOME_PATH]);
  }
  return true;
};
