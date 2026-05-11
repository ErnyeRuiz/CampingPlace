/**
 * Decodifica el payload de un JWT sin verificar firma (solo para UX / guards; el API valida).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const payload = parts[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Claim de rol que emite ASP.NET Core en JWT. */
const CLAIM_ROLE_MS =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function addPermissionValues(value: unknown, into: Set<string>): void {
  if (typeof value === 'string' && value.length > 0) {
    into.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.length > 0) {
        into.add(item);
      }
    }
  }
}

/**
 * Extrae nombres de permiso reconocidos del payload (varias convenciones de claims).
 */
export function permissionsFromPayload(payload: Record<string, unknown> | null): string[] {
  if (!payload) {
    return [];
  }
  const into = new Set<string>();
  addPermissionValues(payload['permission'], into);
  addPermissionValues(payload['Permission'], into);
  addPermissionValues(payload['permissions'], into);
  addPermissionValues(payload['Permissions'], into);

  for (const [key, val] of Object.entries(payload)) {
    if (key.length > 0 && /permission/i.test(key) && !/^(nbf|exp|iat|aud|iss)$/i.test(key)) {
      addPermissionValues(val, into);
    }
  }
  return [...into];
}

/** Roles del token (claim Microsoft + variantes cortas). */
export function rolesFromPayload(payload: Record<string, unknown> | null): string[] {
  if (!payload) {
    return [];
  }
  const into = new Set<string>();
  addPermissionValues(payload[CLAIM_ROLE_MS], into);
  addPermissionValues(payload['role'], into);
  addPermissionValues(payload['Role'], into);
  return [...into];
}
