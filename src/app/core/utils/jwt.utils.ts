/** Decodifica `exp` del JWT sin validar firma (solo UX / ventana de renovación). */
export function getJwtExpSeconds(jwt: string): number | null {
  if (!jwt?.includes('.')) {
    return null;
  }
  const [, payloadB64] = jwt.split('.');
  if (!payloadB64) {
    return null;
  }
  try {
    const json = atob(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
    ).replace(/\0/g, '');
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
