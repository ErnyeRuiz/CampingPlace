import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../../core/services/http/user.service';
import { AuthService } from '../../core/services/http/auth.service';
import { TripsService } from '../../core/services/http/trips.service';
import { FavoritesService } from '../../core/services/http/favorites.services';
import { LocationService } from '../../core/services/http/location.service';
import { UserResponse } from '../../core/models/user/user-response';
import { UserRequest } from '../../core/models/user/user-request';
import { TripResponse } from '../../core/models/trips/trip-response';
import { FavoriteResponse } from '../../core/models/favorites/favorite-response';
import { UbicacionCatalog } from '../../core/models/location/ubicacion-catalog';
import { CampsiteSummary } from '../../core/models/campsites/campsite-summary';

const TRIPS_PREVIEW_LIMIT = 5;

@Component({
  selector: 'cp-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly user     = inject(UserService);
  private readonly auth     = inject(AuthService);
  private readonly trips    = inject(TripsService);
  private readonly favorites = inject(FavoritesService);
  private readonly location = inject(LocationService);
  private readonly fb       = inject(FormBuilder);
  private readonly toast    = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly profile       = signal<UserResponse | null>(null);
  readonly tripsList     = signal<TripResponse[]>([]);
  readonly tripsPreview  = signal<TripResponse[]>([]);
  readonly favoritesList = signal<FavoriteResponse[]>([]);
  readonly catalog       = signal<UbicacionCatalog | null>(null);

  readonly imgFallback =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect fill="#e9ecef" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-size="14" font-family="sans-serif">Camping</text></svg>',
    );

  readonly profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    forkJoin({
      me: this.user.getMe().pipe(catchError(() => of(null))),
      trips: this.trips.getAll().pipe(catchError(() => of([] as TripResponse[]))),
      favs: this.favorites.getAll().pipe(
        catchError(() => of([] as FavoriteResponse[])),
      ),
      cat: this.location.loadUbicacionCatalog().pipe(
        catchError(() => of(null as UbicacionCatalog | null)),
      ),
    }).subscribe({
      next: ({ me, trips, favs, cat }) => {
        this.catalog.set(cat);
        if (!me) {
          return;
        }
        this.profile.set({
          ...me,
          createdAt: this.coerceDate(me.createdAt as Date & string),
        });
        this.profileForm.patchValue({ name: me.name });
        this.auth.updateStoredProfile({
          roleName: me.roleName ?? null,
        });

        const tripRows = (trips ?? []).map((t) => ({
          ...t,
          campsiteSummaries: t.campSiteSummaries ?? [],
          startDate: this.coerceDate(t.startDate as Date & string),
          endDate: this.coerceDate(t.endDate as Date & string),
        }));

        this.tripsList.set(tripRows);
        this.tripsPreview.set(tripRows.slice(0, TRIPS_PREVIEW_LIMIT));
        this.favoritesList.set(favs ?? []);
      },
    });
  }

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const name = (this.profileForm.getRawValue().name ?? '').trim();
    this.user.updateMe(new UserRequest(name)).subscribe({
      next: (ok) => {
        if (ok) {
          this.auth.updateStoredProfile({ name });
          const p = this.profile();
          if (p) this.profile.set({ ...p, name });
          this.toast.success(this.transloco.translate('toast.profileUpdated'));
        }
      },
    });
  }

  shortDescription(text: string | null | undefined): string {
    const s = text?.trim() ?? '';
    if (s.length <= 120) {
      return s;
    }
    return s.slice(0, 120) + '…';
  }

  locationLine(c: CampsiteSummary): string {
    const cat = this.catalog();
    if (!cat) {
      return '—';
    }
    const p = cat.provincias.find((x) => x.idProvincia === c.idProvincia)
      ?.descripcion;
    const k = cat.cantones.find((x) => x.idCanton === c.idCanton)?.descripcion;
    const d = cat.distritos.find((x) => x.idDistrito === c.idDistrito)
      ?.descripcion;
    const parts = [d, k, p].filter(Boolean) as string[];
    return parts.length ? parts.join(' · ') : '—';
  }

  campsiteImageSrc(raw: string | null | undefined): string {
    return raw ?? '';
  }

  onCampsiteImgError(ev: Event): void {
    const el = ev.target;
    if (el instanceof HTMLImageElement) {
      el.src = this.imgFallback;
    }
  }

  /**
   * Coerce a date to a Date object
   * @param d - The date to coerce
   * @returns A Date object
   */
  private coerceDate(d: Date | string): Date {
    if (d instanceof Date) {
      return d;
    }
    return new Date(d);
  }
}
