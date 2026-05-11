/** Keys used with {@link LocalStorageService} and direct reads (e.g. interceptors). */
export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'cp_token',
  AUTH_USER: 'cp_user',
  PROVINCIAS: 'cp_provincias',
  CANTONES: 'cp_cantones',
  DISTRITOS: 'cp_distritos',
} as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];
