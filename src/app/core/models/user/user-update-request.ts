export interface UserUpdateRequest {
    name: string;
    email: string;
    roleId: number;
    password: string | null;
}