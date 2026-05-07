export interface UserResponse {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    roleName?: string | null;
}