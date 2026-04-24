import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, take, map, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ApiResponse } from "../../models/api/api-response";
import { ProvinciaResponse } from "../../models/location/provincia-response";
import { CantonResponse } from "../../models/location/canton-response";
import { DistritoResponse } from "../../models/location/distrito-response";

@Injectable({ providedIn: 'root' })
export class LocationService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ubicacion`;

  readonly loading = signal(false);

  /**
   * Get all provinces
   * @returns An observable of ProvinciaResponse[]
   */
  public getProvincias(): Observable<ProvinciaResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<ProvinciaResponse[]>>(
        `${this.baseUrl}/provincias`, 
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

   /**
   * Get all cantons by province id
   * @param idProvincia - The id of the province
   * @returns An observable of CantonResponse[]
   */
   public getCantonesByProvinciaId(idProvincia: number): Observable<CantonResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CantonResponse[]>>(
        `${this.baseUrl}/cantones`, 
        { params: { idProvincia } }
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }

   /**
   * Get all districts by canton id
   * @param idCanton - The id of the canton
   * @returns An observable of DistritoResponse[]
   */
   public getDistritosByCantonId(idCanton: number): Observable<DistritoResponse[]> {
    this.loading.set(true);
    return this.http.get<ApiResponse<DistritoResponse[]>>(
        `${this.baseUrl}/distritos`, 
        { params: { idCanton } }
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }
}
