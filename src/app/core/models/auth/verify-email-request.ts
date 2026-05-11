export class VerifyEmailRequest {
  constructor(
    public userId: number,
    public code: string,
  ) {}
}
