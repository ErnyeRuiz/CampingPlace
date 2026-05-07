/**
 * Nombres de rol que permiten el shell /admin sin permisos JWT (solo sección Usuarios u otras `adminOnly`).
 * No sustituyen a los permisos granulares en roles/permisos/campings.
 */
export const ADMIN_ROLE_NAMES = ['Admin', 'Administrator'] as const;

export function isAdminRoleName(name: string | null | undefined): boolean {
  if (name == null || typeof name !== 'string') {
    return false;
  }
  const n = name.trim();
  return (ADMIN_ROLE_NAMES as readonly string[]).includes(n);
}
