import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { finalize, map, Observable, take } from "rxjs";
import { environment } from "../../../../environments/environment";
import { LoginRequest } from "../../models/auth/login-request";
import { ApiResponse } from "../../models/api/api-response";
import { RegisterRequest } from "../../models/auth/register-request";
import { LoginResponse } from "../../models/auth/login-response";

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly loading = signal(false);

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
   * Login a user
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
        finalize(() => this.loading.set(false))
    );
  }
}
