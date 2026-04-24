/**
 * Safe redirect target for post-login: same-origin path only.
 */
export function isAppInternalPath(returnUrl: string): boolean {
  const u = returnUrl.trim();
  if (!u.startsWith('/')) {
    return false;
  }
  if (u.startsWith('//')) {
    return false;
  }
  if (u.includes('://') || u.includes('..')) {
    return false;
  }
  return true;
}
