/**
 * Permisos en claims del JWT (mismos nombres que emite el API).
 */
export const APP_HOME_PATH = '/campings';

export const PERMISSIONS = {
  CampsiteCreate: 'campsite.create',
  CampsiteUpdate: 'campsite.update',
  CampsiteDelete: 'campsite.delete',
  RoleCreate: 'role.create',
  RoleUpdate: 'role.update',
  PermissionCreate: 'permission.create',
  PermissionUpdate: 'permission.update',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Cualquiera de estos permite entrar al área /admin (el rol SuperUser entra sin permisos en JWT). */
export const ADMIN_SECTION_PERMISSIONS: readonly PermissionKey[] = [
  PERMISSIONS.CampsiteCreate,
  PERMISSIONS.CampsiteUpdate,
  PERMISSIONS.CampsiteDelete,
  PERMISSIONS.RoleCreate,
  PERMISSIONS.RoleUpdate,
  PERMISSIONS.PermissionCreate,
  PERMISSIONS.PermissionUpdate,
];
