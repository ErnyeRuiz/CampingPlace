export interface UserSystemResponse {
    id: number;
    name: string;
    email: string;
    roleName: string;
    /** Si el API lo incluye en GET por id o listados. */
    roleId?: number;
    createdAt: Date;
    campsites: number;
    tripsAmount: number;
    favorites: number;
}