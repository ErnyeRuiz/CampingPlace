/**
 * Permisos esperados en claims del JWT (deben coincidir con los nombres en la BD del API).
 * El menú admin se filtra con estos mismos valores.
 */
export const PERMISSIONS = {
  RolesManage: 'Roles.Manage',
  PermissionsManage: 'Permissions.Manage',
  CampsitesManage: 'Campsites.Manage',
  UsersRead: 'Users.Read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Cualquiera de estos permite entrar al área /admin (junto con el rol administrador). */
export const ADMIN_SECTION_PERMISSIONS: readonly PermissionKey[] = [
  PERMISSIONS.RolesManage,
  PERMISSIONS.PermissionsManage,
  PERMISSIONS.CampsitesManage,
  PERMISSIONS.UsersRead,
];
