import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal, computed } from "@angular/core";
import { finalize, map, Observable, take, tap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { LoginRequest } from "../../models/auth/login-request";
import { ApiResponse } from "../../models/api/api-response";
import { RegisterRequest } from "../../models/auth/register-request";
import { LoginResponse } from "../../models/auth/login-response";

const TOKEN_KEY = 'cp_token';
const USER_KEY  = 'cp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    
  private readonly http = inject(HttpClient);
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
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data));
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  /**
   * Load the stored user from local storage
   * @returns The stored user or null
   */
  private loadStoredUser(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
