export interface RoleResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  /** Si el API lo incluye en GET por id o en listados enriquecidos. */
  permissionIds?: number[];
  /** Forma alternativa que algunos APIs devuelven. */
  permissions?: { id: number }[];
}
