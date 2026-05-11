import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, take, map, finalize } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ApiResponse } from "../../models/api/api-response";
import { CampsiteStatsResponse } from "../../models/dashboard/campsite-stats-response";

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  readonly loading = signal(false);

  /**
   * Get stats of campsites
   * @param provinciaId - The id of the province
   * @param cantonId - The id of the canton
   * @param distritoId - The id of the district
   * @returns An observable of CampsiteStatsResponse | null
   */
  public getStats(
    provinciaId?: number, 
    cantonId?: number, 
    distritoId?: number
  ): Observable<CampsiteStatsResponse | null> {
    this.loading.set(true);
    let params = new HttpParams();
    if (provinciaId != null) params = params.set('idProvincia', provinciaId);
    if (cantonId != null)    params = params.set('idCanton', cantonId);
    if (distritoId != null)  params = params.set('idDistrito', distritoId);

    return this.http.get<ApiResponse<CampsiteStatsResponse>>(
        `${this.baseUrl}/camp-site-stats`,
        { params }
    ).pipe(
        take(1),
        map((response) =>
          response.success ? response.data : null,
        ),
        finalize(() => {
        setTimeout(() => this.loading.set(false), 0);
      })
    );
  }
}