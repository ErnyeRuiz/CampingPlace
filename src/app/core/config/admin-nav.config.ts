import { PERMISSIONS, PermissionKey } from '../constants/permissions';

export interface AdminNavItem {
  /** Clave Transloco, p. ej. `admin.nav.roles`. */
  labelKey: string;
  routerLink: string;
  /** Solo rol SuperUser (sesión o JWT). */
  superUserOnly?: boolean;
  /** Cualquiera de estos permisos muestra el ítem (ignorado si `superUserOnly`). */
  permissions?: readonly PermissionKey[];
  iconClass: string;
}

/**
 * Menú admin filtrado por JWT; «Usuarios» solo para SuperUser.
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    labelKey: 'admin.nav.roles',
    routerLink: '/admin/roles',
    permissions: [PERMISSIONS.RoleCreate, PERMISSIONS.RoleUpdate],
    iconClass: 'fas fa-user-shield',
  },
  {
    labelKey: 'admin.nav.permissions',
    routerLink: '/admin/permissions',
    permissions: [PERMISSIONS.PermissionCreate, PERMISSIONS.PermissionUpdate],
    iconClass: 'fas fa-key',
  },
  {
    labelKey: 'admin.nav.campsites',
    routerLink: '/admin/campsites',
    permissions: [PERMISSIONS.CampsiteCreate, PERMISSIONS.CampsiteUpdate],
    iconClass: 'fas fa-campground',
  },
  {
    labelKey: 'admin.nav.users',
    routerLink: '/admin/users',
    superUserOnly: true,
    iconClass: 'fas fa-users',
  },
];
