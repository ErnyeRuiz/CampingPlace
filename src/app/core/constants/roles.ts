/**
 * Nombres de rol que en el API cuentan como administrador del panel
 * (fallback si el JWT no trae claims de permiso con los nombres esperados).
 */
export const ADMIN_ROLE_NAMES = ['Admin', 'Administrator'] as const;

export function isAdminRoleName(name: string | null | undefined): boolean {
  if (name == null || typeof name !== 'string') {
    return false;
  }
  const n = name.trim();
  return (ADMIN_ROLE_NAMES as readonly string[]).includes(n);
}
