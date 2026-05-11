export class ResetPasswordRequest {
  constructor(
    public email: string,
    public code: string,
    public newPassword: string,
  ) {}
}
