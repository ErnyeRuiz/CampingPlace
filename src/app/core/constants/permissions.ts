/**
 * Permisos en claims del JWT (mismos nombres que emite el API).
 */
export const APP_HOME_PATH = '/campings';

export const PERMISSIONS = {
  CampsiteCreate: 'create.campsite',
  CampsiteUpdate: 'update.campsite',
  RoleCreate: 'create.role',
  RoleUpdate: 'update.role',
  PermissionCreate: 'create.permission',
  PermissionUpdate: 'update.permission',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Cualquiera de estos permite entrar al área /admin (junto con el rol administrador). */
export const ADMIN_SECTION_PERMISSIONS: readonly PermissionKey[] = [
  PERMISSIONS.CampsiteCreate,
  PERMISSIONS.CampsiteUpdate,
  PERMISSIONS.RoleCreate,
  PERMISSIONS.RoleUpdate,
  PERMISSIONS.PermissionCreate,
  PERMISSIONS.PermissionUpdate,
];
