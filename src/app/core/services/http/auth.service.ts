import { HttpClient, HttpContext } from "@angular/common/http";
import { Injectable, inject, signal, computed } from "@angular/core";
import { Router } from "@angular/router";
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  take,
  tap,
} from "rxjs";
import { environment } from "../../../../environments/environment";
import { LoginRequest } from "../../models/auth/login-request";
import { ApiResponse } from "../../models/api/api-response";
import { RegisterRequest } from "../../models/auth/register-request";
import { ForgotPasswordRequest } from "../../models/auth/forgot-password-request";
import { ResetPasswordRequest } from "../../models/auth/reset-password-request";
import { VerifyEmailRequest } from "../../models/auth/verify-email-request";
import { LoginResponse } from "../../models/auth/login-response";
import { LocalStorageService } from "../local-storage.service";
import { AuthRefreshCoordinator } from "../auth-refresh.coordinator";
import { suppressHttpErrorFeedback } from "../../context/http-feedback-context";

@Injectable({ providedIn: 'root' })
export class AuthService {
    
  private readonly http = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);
  private readonly coordinator  = inject(AuthRefreshCoordinator);
  private readonly router        = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly loading = signal(false);

  private readonly _currentUser = signal<LoginResponse | null>(
    this.loadStoredUser()
  );

  readonly currentUser   = this._currentUser.asReadonly();
  readonly isLoggedIn    = computed(() => !!this._currentUser());

  /**
   * Register a new user
   * @param request - The request body
   * @returns success flag and optional new user id when successful
   */
  public register(request: RegisterRequest): Observable<{
    success: boolean;
    userId?: number;
  }> {
    this.loading.set(true);
    return this.http
      .post<ApiResponse<{ id: number }>>(`${this.baseUrl}/register`, request)
      .pipe(
        take(1),
        map((response) => ({
          success: response.success,
          userId: response.success ? response.data?.id : undefined,
        })),
        finalize(() => this.loading.set(false)),
      );
  }

  /**
   * Confirm email with the code sent to the user's inbox.
   */
  public verifyEmail(request: VerifyEmailRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http
      .post<ApiResponse<unknown>>(`${this.baseUrl}/verify-email`, request)
      .pipe(
        take(1),
        map((response) => response.success),
        finalize(() => this.loading.set(false)),
      );
  }

  /**
   * Resend the email verification code to the user's inbox.
   * Does not toggle {@link loading}; callers should use a local busy state.
   */
  public resendVerification(email: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.baseUrl}/resend-verification`, {
        email,
      })
      .pipe(
        take(1),
        map((response) => response.success),
      );
  }

  /**
   * Request a password reset code by email
   * @param email - The user's email
   */
  public forgotPassword(email: string): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<unknown>>(
      `${this.baseUrl}/forgot-password`,
      new ForgotPasswordRequest(email),
    ).pipe(
      take(1),
      map((response) => response.success),
      finalize(() => this.loading.set(false)),
    );
  }

  /**
   * Reset password using code from the recovery email
   */
  public resetPassword(request: ResetPasswordRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<unknown>>(
      `${this.baseUrl}/reset-password`,
      request,
    ).pipe(
      take(1),
      map((response) => response.success),
      finalize(() => this.loading.set(false)),
    );
  }

  /**
   * Login a user, persist the JWT token and update the current user signal
   * @param request - The request body
   * @returns An observable of LoginResponse | null
   */
  public login(request: LoginRequest): Observable<LoginResponse | null> {
    this.loading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(
        `${this.baseUrl}/login`,
        request
    ).pipe(
        take(1),
        map(response => response.data),
        tap(data => {
          if (data?.token) {
            this.applySession(data);
          }
        }),
      finalize(() => this.loading.set(false)),
    );
  }

  /** Persiste tokens y perfil tras login o refresh exitoso. */
  public applySession(data: LoginResponse): void {
    if (!data?.token) {
      return;
    }
    this.storage.saveAuthSession(data);
    this._currentUser.set(data);
  }

  /**
   * Revoca refresh en servidor y borra sesión local (siempre, aunque falle la red).
   */
  public logout(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    const ctx = new HttpContext().set(suppressHttpErrorFeedback, true);
    if (!refreshToken) {
      this.clearLocalSession();
      return of(void 0);
    }
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.baseUrl}/logout`,
        { refreshToken },
        { context: ctx },
      )
      .pipe(
        take(1),
        map(() => void 0),
        catchError(() => of(void 0)),
        finalize(() => this.clearLocalSession()),
      );
  }

  /**
   * Renueva tokens con el refresh almacenado (cola única en {@link AuthRefreshCoordinator}).
   * Si falla, limpia sesión y navega a login.
   */
  public refreshWithStoredRefreshToken(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.clearSessionAndRedirectToLogin();
      return of(void 0);
    }
    return this.coordinator.refresh(refreshToken).pipe(
      tap((data) => this.applySession(data)),
      map(() => void 0),
      catchError(() => {
        this.clearSessionAndRedirectToLogin();
        return of(void 0);
      }),
    );
  }

  /** Limpia almacenamiento y envía a login (sesión inválida o refresh fallido). */
  public clearSessionAndRedirectToLogin(): void {
    this.clearLocalSession();
    void this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  /**
   * Merge profile fields into the persisted session (e.g. after PUT /users/me).
   * Keeps the existing JWT and updates localStorage + in-memory user.
   */
  public updateStoredProfile(
    updates: Partial<Pick<LoginResponse, 'name' | 'email' | 'roleName'>>,
  ): void {
    const cur = this._currentUser();
    if (!cur?.token) {
      return;
    }
    const next: LoginResponse = { ...cur, ...updates };
    this.storage.saveAuthSession(next);
    this._currentUser.set(next);
  }

  private clearLocalSession(): void {
    this.storage.clearAuthSession();
    this._currentUser.set(null);
  }

  private loadStoredUser(): LoginResponse | null {
    return this.storage.getStoredAuthUser();
  }
}
