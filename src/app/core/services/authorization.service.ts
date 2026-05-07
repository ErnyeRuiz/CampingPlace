import { Injectable, inject } from '@angular/core';
import { ADMIN_NAV_ITEMS } from '../config/admin-nav.config';
import { ADMIN_SECTION_PERMISSIONS } from '../constants/permissions';
import { isAdminRoleName } from '../constants/roles';
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

  /** Roles presentes en el JWT (p. ej. claim de Microsoft). */
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
    return this.permissionSet().has(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    if (permissions.length === 0) {
      return true;
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

  /**
   * True si el usuario es administrador del panel por nombre de rol
   * (sesión o JWT), sin depender de permisos granulares.
   */
  isAdminRole(): boolean {
    if (isAdminRoleName(this.storedRoleName())) {
      return true;
    }
    return this.rolesFromToken().some((r) => isAdminRoleName(r));
  }

  /**
   * Acceso al shell /admin: rol administrador o al menos un permiso de sección.
   */
  hasAdminSectionAccess(): boolean {
    if (this.isAdminRole()) {
      return true;
    }
    return this.hasAnyPermission(ADMIN_SECTION_PERMISSIONS);
  }

  visibleAdminNavItems(): typeof ADMIN_NAV_ITEMS {
    if (this.isAdminRole()) {
      return [...ADMIN_NAV_ITEMS];
    }
    return ADMIN_NAV_ITEMS.filter((item) => this.hasAnyPermission(item.permissions));
  }

  /**
   * Primer path admin permitido para redirecciones (p. ej. falta de permiso en ruta hija).
   */
  firstAccessibleAdminPath(): string | null {
    const items = this.visibleAdminNavItems();
    return items[0]?.routerLink ?? null;
  }
}
