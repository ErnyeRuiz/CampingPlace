export type RegisterRole = 'customer' | 'admin';

export class RegisterRequest {
  constructor(
    public name: string,
    public email: string,
    public password: string,
    public role: RegisterRole,
  ) {}
}
