import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api/api-response';
import { RolePermissionsRequest } from '../../models/roles/role-permissions-request';
import { RoleResponse } from '../../models/roles/role-response';
import { RoleUpsertRequest } from '../../models/roles/role-upsert-request';
import { finalize, map, Observable, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  readonly loading = signal(false);

  getAll(): Observable<RoleResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<RoleResponse[]>>(this.baseUrl).pipe(
      take(1),
      map((r) => r.data ?? []),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
    );
  }

  getById(id: number): Observable<RoleResponse | null> {
    this.loading.set(true);
    return this.http.get<ApiResponse<RoleResponse>>(`${this.baseUrl}/${id}`).pipe(
      take(1),
      map((r) => this.normalizeRole(r.data)),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
    );
  }

  private normalizeRole(data: RoleResponse | null): RoleResponse | null {
    if (!data) {
      return null;
    }
    if (data.permissionIds?.length) {
      return data;
    }
    const nested = data.permissions;
    if (nested?.length) {
      return { ...data, permissionIds: nested.map((p) => p.id) };
    }
    return data;
  }

  create(body: RoleUpsertRequest): Observable<number | null> {
    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(this.baseUrl, body).pipe(
      take(1),
      map((r) => (r.success && r.data ? r.data.id : null)),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
    );
  }

  update(id: number, body: RoleUpsertRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${id}`, body).pipe(
      take(1),
      map((r) => r.success),
        finalize(() => {
          setTimeout(() => this.loading.set(false), 0);
        }),
    );
  }

  replacePermissions(id: number, body: RolePermissionsRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http
      .put<ApiResponse<void>>(`${this.baseUrl}/${id}/permissions`, body)
      .pipe(
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
