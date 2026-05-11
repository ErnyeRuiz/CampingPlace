import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { httpContextSuppressSuccessFeedback } from '../../context/http-feedback-context';
import { ApiResponse } from '../../models/api/api-response';
import { PermissionResponse } from '../../models/permissions/permission-response';
import { PermissionUpsertRequest } from '../../models/permissions/permission-upsert-request';
import { finalize, map, Observable, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/permissions`;

  readonly loading = signal(false);

  getAll(): Observable<PermissionResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<PermissionResponse[]>>(this.baseUrl).pipe(
      take(1),
      map((r) => r.data ?? []),
      finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      }),
    );
  }

  getById(id: number): Observable<PermissionResponse | null> {
    this.loading.set(true);
    return this.http
      .get<ApiResponse<PermissionResponse>>(`${this.baseUrl}/${id}`)
      .pipe(
        take(1),
        map((r) => r.data),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
      );
  }

  create(
    body: PermissionUpsertRequest,
    opts?: { suppressSuccessToast?: boolean },
  ): Observable<number | null> {
    this.loading.set(true);
    const httpOpts =
      opts?.suppressSuccessToast === true
        ? { context: httpContextSuppressSuccessFeedback() }
        : undefined;
    return this.http
      .post<ApiResponse<{ id: number }>>(this.baseUrl, body, httpOpts)
      .pipe(
        take(1),
        map((r) => (r.success && r.data ? r.data.id : null)),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
      );
  }

  update(
    id: number,
    body: PermissionUpsertRequest,
    opts?: { suppressSuccessToast?: boolean },
  ): Observable<boolean> {
    this.loading.set(true);
    const httpOpts =
      opts?.suppressSuccessToast === true
        ? { context: httpContextSuppressSuccessFeedback() }
        : undefined;
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/${id}`,
      body,
      httpOpts,
    ).pipe(
      take(1),
      map((r) => r.success),
      finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      }),
    );
  }

  delete(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      take(1),
      map((r) => r.success),
      finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      }),
    );
  }
}
