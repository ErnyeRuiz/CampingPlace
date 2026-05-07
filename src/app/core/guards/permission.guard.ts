import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/http/auth.service';

/**
 * Comprueba `route.data['permissions']` (array de strings).
 * Los roles administrador (`Admin`, `Administrator`, etc.) pueden todo dentro del panel.
 */
export const permissionGuard: CanActivateFn = (route): boolean | UrlTree => {
  const auth = inject(AuthService);
  const authz = inject(AuthorizationService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: router.url },
    });
  }

  const required = route.data['permissions'] as string[] | undefined;
  if (!required?.length) {
    return true;
  }

  if (authz.isAdminRole() || authz.hasAnyPermission(required)) {
    return true;
  }

  const fallback = authz.firstAccessibleAdminPath();
  return fallback ? router.parseUrl(fallback) : router.createUrlTree(['/campings']);
};
