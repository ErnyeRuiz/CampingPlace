/**
 * Nombres de rol de administrador de negocio (no SuperUser).
 * No otorgan bypass de permisos ni acceso al shell /admin por sí solos.
 */
export const ADMIN_ROLE_NAMES = ['Admin', 'Administrator'] as const;

/**
 * Debe coincidir exactamente con `roleName` en login y con el claim de rol del JWT que emite el API.
 */
export const SUPER_USER_ROLE_NAMES = ['SuperUser'] as const;

export function isAdminRoleName(name: string | null | undefined): boolean {
  if (name == null || typeof name !== 'string') {
    return false;
  }
  const n = name.trim();
  return (ADMIN_ROLE_NAMES as readonly string[]).includes(n);
}

export function isSuperUserRoleName(name: string | null | undefined): boolean {
  if (name == null || typeof name !== 'string') {
    return false;
  }
  const n = name.trim();
  return (SUPER_USER_ROLE_NAMES as readonly string[]).includes(n);
}
