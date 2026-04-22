import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { CampsiteRequest } from "../../models/campsites/campsite-request";
import { ApiResponse } from "../../models/api/api-response";
import { finalize, map, Observable, take } from "rxjs";
import { CampsiteResponse } from "../../models/campsites/campsite-response";
import { CampsiteReviewRequest } from "../../models/campsites/campsite-review-request";
import { CampsiteReviewResponse } from "../../models/campsites/campsite-review-response";

@Injectable({ providedIn: 'root' })
export class CampsitesService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly loading = signal(false);

  /**
   * Create a campsite
   * @param request - The request body
   * @returns An observable of boolean
   */
  public create(request: CampsiteRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(
        `${this.baseUrl}/campsites`, 
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Update a campsite
   * @param request - The request body
   * @returns An observable of boolean
   */
  public update(request: CampsiteRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(
        `${this.baseUrl}/campsites`, 
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get all campsites
   * @returns An observable of CampsiteResponse[]
   */
  public getAll(): Observable<CampsiteResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CampsiteResponse[]>>(
        `${this.baseUrl}/campsites`
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get a campsite by id
   * @param id - The id of the campsite
   * @returns An observable of CampsiteResponse
   */
  public getbyId(id: number): Observable<CampsiteResponse | null> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CampsiteResponse>>(
        `${this.baseUrl}/campsites/${id}`
    ).pipe(
        take(1), 
        map(response => response.data),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Delete a campsite
   * @param id - The id of the campsite
   * @returns An observable of boolean
   */
  public delete(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/campsites/${id}`
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Create a review for a campsite
   * @param id - The id of the campsite
   * @param request - The request body
   * @returns An observable of boolean
   */
  public createReview(id: number, request: CampsiteReviewRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.post<ApiResponse<void>>(
        `${this.baseUrl}/campsites/${id}/reviews`,
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Update a review for a campsite
   * @param id - The id of the review
   * @param request - The request body
   * @returns An observable of boolean
   */
  public updateReview(id: number, request: CampsiteReviewRequest): Observable<boolean> {
    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(
        `${this.baseUrl}/campsites/${id}/reviews`,
        request
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Get reviews by campsite id
   * @param id - The id of the campsite
   * @returns An observable of CampsiteReviewResponse[]
   */
  public getReviewsById(id: number): Observable<CampsiteReviewResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CampsiteReviewResponse[]>>(
        `${this.baseUrl}/campsites/${id}/reviews`
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

  /**
   * Delete a review by id
   * @param id - The id of the review
   * @returns An observable of boolean
   */
  public deleteReviewById(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/reviews/${id}`
    ).pipe(
        take(1), 
        map(response => response.success),
        finalize(() => this.loading.set(false))
    );
  }
}