import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { CampsiteFormFields } from "../../models/campsites/campsite-request";
import { ApiResponse } from "../../models/api/api-response";
import { finalize, map, Observable, take } from "rxjs";
import { CampsiteResponse } from "../../models/campsites/campsite-response";
import { CampsiteReviewRequest } from "../../models/campsites/campsite-review-request";
import { CampsiteReviewResponse } from "../../models/campsites/campsite-review-response";

@Injectable({ providedIn: 'root' })
export class CampsitesService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campsites`;

  readonly loading = signal(false);

  /**
   * Create a campsite (multipart/form-data: scalars + optional images).
   */
  public create(fields: CampsiteFormFields, newImages: File[]): Observable<number | null> {
    const formData = new FormData();
    this.appendCampSiteFields(formData, fields);
    this.appendImageFiles(formData, newImages);

    this.loading.set(true);
    return this.http.post<ApiResponse<{ id: number }>>(
        `${this.baseUrl}`,
        formData
    ).pipe(
        take(1),
        map((response) =>
          response.success && response.data ? response.data.id : null,
        ),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

  /**
   * Update a campsite (multipart: scalars + imageIdsToKeep + new images).
   */
  public update(
    id: number,
    fields: CampsiteFormFields,
    imageIdsToKeep: readonly number[],
    newImages: File[],
  ): Observable<boolean> {
    const formData = new FormData();
    this.appendCampSiteFields(formData, fields);
    for (const imageId of imageIdsToKeep) {
      formData.append('imageIdsToKeep', String(imageId));
    }
    this.appendImageFiles(formData, newImages);

    this.loading.set(true);
    return this.http.put<ApiResponse<void>>(
        `${this.baseUrl}/${id}`,
        formData
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

  /**
   * Get all campsites
   * @returns An observable of CampsiteResponse[]
   */
  public getAll(): Observable<CampsiteResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CampsiteResponse[]>>(
        `${this.baseUrl}`
    ).pipe(
        take(1),
        map(response => response.data ?? []),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

   /**
   * Campings que el API expone para el usuario autenticado (p. ej. solo los propios para Admin; SuperUser según contrato del backend).
   * @returns An observable of CampsiteResponse[]
   */
   public getManaged(): Observable<CampsiteResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CampsiteResponse[]>>(
        `${this.baseUrl}/managed`
    ).pipe(
        take(1),
        map(response => response.data ?? []),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
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
        `${this.baseUrl}/${id}`
    ).pipe(
        take(1),
        map(response => response.data),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

  /**
   * Delete a campsite (el API valida permisos; la UI muestra eliminar junto a editar según `update.campsite`).
   * @param id - The id of the campsite
   * @returns An observable of boolean
   */
  public delete(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.http.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}`
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
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
        `${this.baseUrl}/${id}/reviews`,
        request
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
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
    const reviewsUrl = `${environment.apiUrl}/reviews`;
    return this.http.put<ApiResponse<void>>(
        `${reviewsUrl}/${id}`,
        request
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
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
        `${this.baseUrl}/${id}/reviews`
    ).pipe(
        take(1),
        map(response => response.data ?? []),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

  /**
   * Delete a review by id
   * @param id - The id of the review
   * @returns An observable of boolean
   */
  public deleteReviewById(id: number): Observable<boolean> {
    this.loading.set(true);
    const reviewsUrl = `${environment.apiUrl}/reviews`;
    return this.http.delete<ApiResponse<void>>(
        `${reviewsUrl}/${id}`,
    ).pipe(
        take(1),
        map(response => response.success),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }

  private appendCampSiteFields(formData: FormData, fields: CampsiteFormFields): void {
    formData.append('name', fields.name);
    formData.append('description', fields.description);
    formData.append('latitude', String(fields.latitude));
    formData.append('longitude', String(fields.longitude));
    formData.append('pricePerNight', String(fields.pricePerNight));
    formData.append('hasWater', String(fields.hasWater));
    formData.append('hasElectricity', String(fields.hasElectricity));
    formData.append('idProvincia', String(fields.idProvincia));
    formData.append('idCanton', String(fields.idCanton));
    formData.append('idDistrito', String(fields.idDistrito));
    formData.append('direccionExacta', fields.direccionExacta ?? '');
  }

  private appendImageFiles(formData: FormData, files: readonly File[]): void {
    for (const file of files) {
      formData.append('images', file, file.name);
    }
  }
}
