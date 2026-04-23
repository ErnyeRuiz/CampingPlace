import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, take, map, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ApiResponse } from "../../models/api/api-response";
import { FavoriteResponse } from "../../models/favorites/favotire-response";

@Injectable({ providedIn: 'root' })
export class FavoritesService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/favorites`;

  readonly loading = signal(false);

  /**
   * Get all favorites
   * @returns An observable of FavoriteResponse[]
   */
  public getAll(): Observable<FavoriteResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<FavoriteResponse[]>>(
        `${this.baseUrl}`
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Create a favorite
   * @param campsiteId - The id of the campsite
   * @returns An observable of boolean
   */
  public create(campsiteId: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(
        `${this.baseUrl}/${campsiteId}`,
        null,
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Delete a favorite
   * @param campsiteId - The id of the campsite
   * @returns An observable of boolean
   */
  public delete(campsiteId: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/${campsiteId}`
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }
}