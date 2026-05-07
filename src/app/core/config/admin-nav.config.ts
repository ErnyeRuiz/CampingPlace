import { PERMISSIONS, PermissionKey } from '../constants/permissions';

export interface AdminNavItem {
  label: string;
  routerLink: string;
  /** Solo usuarios con rol administrador (JWT/sesión). */
  adminOnly?: boolean;
  /** Cualquiera de estos permisos muestra el ítem (ignorado si `adminOnly`). */
  permissions?: readonly PermissionKey[];
  iconClass: string;
}

/**
 * Menú admin filtrado por JWT; «Usuarios» solo para rol administrador.
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
    adminOnly: true,
    iconClass: 'fas fa-users',
  },
];
