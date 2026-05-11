export interface LoginResponse {
    userId: number;
    name: string;
    email: string;
    /** Presente en respuesta del API; opcional en sesiones antiguas en localStorage. */
    roleName?: string | null;
    token: string;
}