import { PERMISSIONS, PermissionKey } from '../constants/permissions';

export interface AdminNavItem {
  label: string;
  routerLink: string;
  /** Mostrar ítem solo si el usuario tiene alguno de estos permisos (o rol admin vía AuthorizationService). */
  permissions: readonly PermissionKey[];
  iconClass: string;
}

/**
 * Menú declarativo del panel admin: sin tabla en BD; se filtra por permisos del JWT (+ fallback de rol).
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    label: 'Roles',
    routerLink: '/admin/roles',
    permissions: [PERMISSIONS.RolesManage],
    iconClass: 'fas fa-user-shield',
  },
  {
    label: 'Permisos',
    routerLink: '/admin/permissions',
    permissions: [PERMISSIONS.PermissionsManage],
    iconClass: 'fas fa-key',
  },
  {
    label: 'Campings',
    routerLink: '/admin/campsites',
    permissions: [PERMISSIONS.CampsitesManage],
    iconClass: 'fas fa-campground',
  },
  {
    label: 'Usuarios',
    routerLink: '/admin/users',
    permissions: [PERMISSIONS.UsersRead],
    iconClass: 'fas fa-users',
  },
];
