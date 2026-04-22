import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, take, map, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ApiResponse } from "../../models/api/api-response";
import { UserResponse } from "../../models/user/user-response";
import { UserRequest } from "../../models/user/user-request";

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly loading = signal(false);

  /**
   * Get user authenticated
   * @returns An observable of UserResponse | null
   */
  public getMe(): Observable<UserResponse | null> {
    this.loading.set(true);
    return this.http.get<ApiResponse<UserResponse>>(
        `${this.baseUrl}/users/me`
    ).pipe(
        take(1), 
        map(response => response.data),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Update user authenticated
   * @param request - The request body
   * @returns An observable of boolean
   */
  public updateMe(request: UserRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(
        `${this.baseUrl}/users/me`,
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }
}