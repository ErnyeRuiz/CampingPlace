import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Camping, CampingFilter, PagedResult } from '../../models';

@Injectable({ providedIn: 'root' })
export class CampingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campings`;

  readonly loading = signal(false);

  getAll(filter: CampingFilter): Observable<PagedResult<Camping>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);

    if (filter.province) params = params.set('province', filter.province);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);
    if (filter.minRating != null) params = params.set('minRating', filter.minRating);

    return this.http.get<PagedResult<Camping>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Camping> {
    return this.http.get<Camping>(`${this.baseUrl}/${id}`);
  }
}
