import { Injectable, inject } from '@angular/core';
import { ADMIN_NAV_ITEMS } from '../config/admin-nav.config';
import { ADMIN_SECTION_PERMISSIONS } from '../constants/permissions';
import { isAdminRoleName, isSuperUserRoleName } from '../constants/roles';
import { decodeJwtPayload, permissionsFromPayload, rolesFromPayload } from '../utils/jwt.util';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly storage = inject(LocalStorageService);

  /** Permisos del JWT actual (vacío si no hay token o no hay claims reconocidos). */
  permissionsFromToken(): string[] {
    const token = this.storage.getAuthToken();
    if (!token) {
      return [];
    }
    return permissionsFromPayload(decodeJwtPayload(token));
  }

  /** Roles presentes en el JWT */
  rolesFromToken(): string[] {
    const token = this.storage.getAuthToken();
    if (!token) {
      return [];
    }
    return rolesFromPayload(decodeJwtPayload(token));
  }

  private permissionSet(): Set<string> {
    return new Set(this.permissionsFromToken());
  }

  hasPermission(permission: string): boolean {
    if (this.isSuperUser()) {
      return true;
    }
    return this.permissionSet().has(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    if (this.isSuperUser()) {
      return true;
    }
    if (permissions.length === 0) {
      return false;
    }
    const set = this.permissionSet();
    return permissions.some((p) => set.has(p));
  }

  /** Rol almacenado en sesión (respuesta de login). */
  storedRoleName(): string | null {
    const u = this.storage.getStoredAuthUser();
    const r = u?.roleName;
    if (typeof r === 'string' && r.length > 0) {
      return r;
    }
    return null;
  }

  /** Rol SuperUser en sesión o JWT: bypass de comprobaciones de permiso en UI. */
  isSuperUser(): boolean {
    if (isSuperUserRoleName(this.storedRoleName())) {
      return true;
    }
    return this.rolesFromToken().some((r) => isSuperUserRoleName(r));
  }

  /**
   * True si el usuario es administrador de negocio por nombre de rol (sesión o JWT).
   */
  isAdminRole(): boolean {
    if (isAdminRoleName(this.storedRoleName())) {
      return true;
    }
    return this.rolesFromToken().some((r) => isAdminRoleName(r));
  }

  /**
   * Acceso al shell /admin: SuperUser o al menos un permiso de sección en el JWT.
   */
  hasAdminSectionAccess(): boolean {
    if (this.isSuperUser()) {
      return true;
    }
    return this.hasAnyPermission(ADMIN_SECTION_PERMISSIONS);
  }

  /**
   * Ítems del menú según permisos del JWT; «Usuarios» solo con rol SuperUser.
   */
  visibleAdminNavItems(): typeof ADMIN_NAV_ITEMS {
    if (this.isSuperUser()) {
      return [...ADMIN_NAV_ITEMS];
    }
    return ADMIN_NAV_ITEMS.filter((item) => {
      if (item.superUserOnly) {
        return false;
      }
      return this.hasAnyPermission(item.permissions ?? []);
    });
  }

  /**
   * Primer path admin permitido para redirecciones (p. ej. falta de permiso en ruta hija).
   */
  firstAccessibleAdminPath(): string | null {
    const items = this.visibleAdminNavItems();
    return items[0]?.routerLink ?? null;
  }
}
