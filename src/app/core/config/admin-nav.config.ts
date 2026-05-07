import { PERMISSIONS, PermissionKey } from '../constants/permissions';

export interface AdminNavItem {
  label: string;
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
    label: 'Roles',
    routerLink: '/admin/roles',
    permissions: [PERMISSIONS.RoleCreate, PERMISSIONS.RoleUpdate],
    iconClass: 'fas fa-user-shield',
  },
  {
    label: 'Permisos',
    routerLink: '/admin/permissions',
    permissions: [PERMISSIONS.PermissionCreate, PERMISSIONS.PermissionUpdate],
    iconClass: 'fas fa-key',
  },
  {
    label: 'Campings',
    routerLink: '/admin/campsites',
    permissions: [PERMISSIONS.CampsiteCreate, PERMISSIONS.CampsiteUpdate],
    iconClass: 'fas fa-campground',
  },
  {
    label: 'Usuarios',
    routerLink: '/admin/users',
    superUserOnly: true,
    iconClass: 'fas fa-users',
  },
];
