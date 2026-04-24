import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, take, map, finalize, forkJoin, of, tap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { LOCAL_STORAGE_KEYS } from "../../constants/local-storage.keys";
import { ApiResponse } from "../../models/api/api-response";
import { ProvinciaResponse } from "../../models/location/provincia-response";
import { CantonResponse } from "../../models/location/canton-response";
import { DistritoResponse } from "../../models/location/distrito-response";
import { UbicacionCatalog } from "../../models/location/ubicacion-catalog";
import { LocalStorageService } from "../local-storage.service";

@Injectable({ providedIn: 'root' })
export class LocationService {

  private readonly http = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);
  private readonly baseUrl = `${environment.apiUrl}/ubicacion`;

  readonly loading = signal(false);

  /**
   * Provincias, cantones y distritos: lee localStorage; si falta alguno, carga del API y persiste.
   */
  public loadUbicacionCatalog(): Observable<UbicacionCatalog> {
    const cached = this.readUbicacionCatalogFromStorage();
    if (cached) {
      return of(cached);
    }

    this.loading.set(true);
    return forkJoin({
      provincias: this.fetchProvincias(),
      cantones: this.fetchCantones(),
      distritos: this.fetchDistritos(),
    }).pipe(
      tap((catalog) => this.persistUbicacionCatalog(catalog)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Read the ubicacion catalog from storage
   * @returns An UbicacionCatalog | null
   */
  private readUbicacionCatalogFromStorage(): UbicacionCatalog | null {
    const provincias = this.storage.getJson<ProvinciaResponse[]>(LOCAL_STORAGE_KEYS.PROVINCIAS);
    const cantones = this.storage.getJson<CantonResponse[]>(LOCAL_STORAGE_KEYS.CANTONES);
    const distritos = this.storage.getJson<DistritoResponse[]>(LOCAL_STORAGE_KEYS.DISTRITOS);
    if (provincias !== null && cantones !== null && distritos !== null) {
      return { provincias, cantones, distritos };
    }
    return null;
  }

  /**
   * Persist the ubicacion catalog to storage
   * @param catalog - The ubicacion catalog
   */
  private persistUbicacionCatalog(catalog: UbicacionCatalog): void {
    this.storage.setJson(LOCAL_STORAGE_KEYS.PROVINCIAS, catalog.provincias);
    this.storage.setJson(LOCAL_STORAGE_KEYS.CANTONES, catalog.cantones);
    this.storage.setJson(LOCAL_STORAGE_KEYS.DISTRITOS, catalog.distritos);
  }

  /**
   * Fetch the provinces from the API
   * @returns An observable of ProvinciaResponse[]
   */
  private fetchProvincias(): Observable<ProvinciaResponse[]> {
    return this.http.get<ApiResponse<ProvinciaResponse[]>>(
      `${this.baseUrl}/provincias`,
    ).pipe(
      take(1),
      map(response => response.data ?? []),
    );
  }

  /**
   * Fetch the cantons from the API
   * @returns An observable of CantonResponse[]
   */
  private fetchCantones(): Observable<CantonResponse[]> {
    return this.http.get<ApiResponse<CantonResponse[]>>(
      `${this.baseUrl}/cantones`,
    ).pipe(
      take(1),
      map(response => response.data ?? []),
    );
  }

  /**
   * Fetch the districts from the API
   * @returns An observable of DistritoResponse[]
   */
  private fetchDistritos(): Observable<DistritoResponse[]> {
    return this.http.get<ApiResponse<DistritoResponse[]>>(
      `${this.baseUrl}/distritos`,
    ).pipe(
      take(1),
      map(response => response.data ?? []),
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
        `${this.baseUrl}/provincias/${idProvincia}/cantones`
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
        `${this.baseUrl}/cantones/${idCanton}/distritos`
    ).pipe(
        take(1), 
        map(response => response.data ?? []),
        finalize(() => this.loading.set(false))
    );
  }
}
