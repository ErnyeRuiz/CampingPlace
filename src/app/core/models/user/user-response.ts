export interface UserResponse {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    roleName?: string | null;
}


export interface UserSystemResponse extends UserResponse {
    rolId: number;
}