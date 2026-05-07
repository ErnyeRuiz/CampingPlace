import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal, computed } from "@angular/core";
import { finalize, map, Observable, take, tap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { LoginRequest } from "../../models/auth/login-request";
import { ApiResponse } from "../../models/api/api-response";
import { RegisterRequest } from "../../models/auth/register-request";
import { LoginResponse } from "../../models/auth/login-response";
import { LocalStorageService } from "../local-storage.service";

@Injectable({ providedIn: 'root' })
export class AuthService {
    
  private readonly http = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);
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
   * @returns An observable of boolean
   */
  public register(request: RegisterRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(
        `${this.baseUrl}/register`, 
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
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
            this.storage.saveAuthSession(data);
            this._currentUser.set(data);
          }
        }),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Logout a user, remove the JWT token and the current user signal
   */
  public logout(): void {
    this.storage.clearAuthSession();
    this._currentUser.set(null);
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

  /**
   * Load the stored user from local storage
   * @returns The stored user or null
   */
  private loadStoredUser(): LoginResponse | null {
    return this.storage.getStoredAuthUser();
  }
}
