import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, take, map, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ApiResponse } from "../../models/api/api-response";
import { TripResponse } from "../../models/trips/trip-response";
import { TripRequest } from "../../models/trips/trip-request";

@Injectable({ providedIn: 'root' })
export class TripsService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trips`;

  readonly loading = signal(false);

  /**
   * Get all trips of user authenticated
   * @returns An observable of TripResponse[]
   */
  public getAll(): Observable<TripResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<TripResponse[]>>(
        `${this.baseUrl}`
    ).pipe(
        take(1),
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get a trip by id
   * @param id - The id of the trip
   * @returns An observable of TripResponse | null
   */
  public getById(id: number): Observable<TripResponse | null> {
    this.loading.set(true);
    return this.http.get<ApiResponse<TripResponse>>(
        `${this.baseUrl}/${id}`
    ).pipe(
        take(1),
        map(response => response.data),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * @returns The new trip id, or null if creation failed.
   */
  public create(request: TripRequest): Observable<number | null> {
    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(
        `${this.baseUrl}`,
        request
    ).pipe(
        take(1),
        map((response) => {
          if (!response.success || response.data == null) {
            return null;
          }
          return response.data.id;
        }),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Update a trip
   * @param id - The id of the trip
   * @param request - The request body
   * @returns An observable of boolean
   */
  public update(id: number, request: TripRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(
        `${this.baseUrl}/${id}`,
        request
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Delete a trip
   * @param id - The id of the trip
   * @returns An observable of boolean
   */
  public delete(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}`
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Add a campsite to a trip
   * @param id - The id of the trip
   * @param campsiteId - The id of the campsite
   * @returns An observable of boolean
   */
  public addCampsite(id: number, campsiteId: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<void>>(
        `${this.baseUrl}/${id}/campsites/${campsiteId}`,
        null
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Remove a campsite from a trip
   * @param id - The id of the trip
   * @param campsiteId - The id of the campsite
   * @returns An observable of boolean
   */
  public removeCampsite(id: number, campsiteId: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}/campsites/${campsiteId}`
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }
}
