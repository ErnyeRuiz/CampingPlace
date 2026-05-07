import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { APP_HOME_PATH } from '../constants/permissions';
import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/http/auth.service';

/**
 * - `route.data['permissions']`: al menos uno requerido (salvo `adminRoleOnly`).
 * - `route.data['adminRoleOnly']`: solo rol administrador (JWT/sesión).
 * Sin acceso: redirección a {@link APP_HOME_PATH}.
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

  const adminRoleOnly = route.data['adminRoleOnly'] === true;
  if (adminRoleOnly) {
    return authz.isAdminRole() ? true : router.createUrlTree([APP_HOME_PATH]);
  }

  const required = route.data['permissions'] as string[] | undefined;
  if (!required?.length) {
    return true;
  }

  if (authz.hasAnyPermission(required)) {
    return true;
  }

  return router.createUrlTree([APP_HOME_PATH]);
};
