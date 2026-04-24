import {
  Component,
  OnInit,
  inject,
  signal,
  input,
  numberAttribute,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin, of } from 'rxjs';
import { CampsitesService } from '../../core/services/http/campsites.service';
import { LocationService } from '../../core/services/http/location.service';
import { AuthService } from '../../core/services/http/auth.service';
import { FavoritesService } from '../../core/services/http/favorites.services';
import { TripsService } from '../../core/services/http/trips.service';
import { CampsiteResponse } from '../../core/models/campsites/campsite-response';
import { FavoriteResponse } from '../../core/models/favorites/favorite-response';
import { TripResponse } from '../../core/models/trips/trip-response';
import { UbicacionCatalog } from '../../core/models/location/ubicacion-catalog';

@Component({
  selector: 'cp-camping-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './camping-detail.component.html',
  styleUrl: './camping-detail.component.scss',
})
export class CampingDetailComponent implements OnInit {
  private readonly campsiteService = inject(CampsitesService);
  private readonly locationService  = inject(LocationService);
  readonly auth = inject(AuthService);
  private readonly favorites       = inject(FavoritesService);
  private readonly trips           = inject(TripsService);
  private readonly router          = inject(Router);
  private readonly toast           = inject(ToastService);

  readonly id = input.required({ transform: numberAttribute });

  readonly campsite        = signal<CampsiteResponse | null>(null);
  readonly catalog         = signal<UbicacionCatalog | null>(null);
  readonly detailLoading   = signal(true);
  readonly isFavorite      = signal(false);
  readonly favoriteBusy    = signal(false);
  readonly activeImageIdx  = signal(0);

  readonly addToTripOpen   = signal(false);
  readonly tripChoices     = signal<TripResponse[]>([]);
  readonly selectedTripId  = signal<number | null>(null);
  readonly addToTripBusy   = signal(false);

  readonly mapsUrl = computed(() => {
    const c = this.campsite();
    if (!c) {
      return '';
    }
    return `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
  });

  readonly heroImage = computed(() => {
    const c = this.campsite();
    if (!c?.images?.length) {
      return null;
    }
    const i = Math.min(this.activeImageIdx(), c.images.length - 1);
    return this.imageSrc(c.images[i].imageBase64);
  });

  readonly availableTrips = computed(() => {
    const cid = this.id();
    return this.tripChoices().filter(
      (t) => !(t.campSiteSummaries ?? []).some((s) => s.id === cid)
    );
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.detailLoading.set(true);
    const campsiteId = this.id();

    const favs$ = this.auth.isLoggedIn()
      ? this.favorites.getAll()
      : of<FavoriteResponse[]>([]);

    forkJoin({
      site: this.campsiteService.getbyId(campsiteId),
      cat: this.locationService.loadUbicacionCatalog(),
      favs: favs$,
    }).subscribe({
      next: ({ site, cat, favs }) => {
        this.catalog.set(cat);
        if (!site) {
          this.campsite.set(null);
          this.toast.warning('No se encontró este camping o ya no está disponible.');
          this.detailLoading.set(false);
          return;
        }
        this.campsite.set({ ...site, images: site.images ?? [] });
        this.activeImageIdx.set(0);
        this.isFavorite.set(favs.some((f) => f.campSiteId === campsiteId));
        this.detailLoading.set(false);
      },
      error: () => {
        this.campsite.set(null);
        this.detailLoading.set(false);
      },
    });
  }

  imageSrc(base64: string): string {
    if (!base64) {
      return '';
    }
    if (base64.startsWith('data:')) {
      return base64;
    }
    return `data:image/jpeg;base64,${base64}`;
  }

  goLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  selectThumb(index: number): void {
    this.activeImageIdx.set(index);
  }

  provinciaName(id: number): string {
    return (
      this.catalog()?.provincias.find((p) => p.idProvincia === id)
        ?.descripcion ?? ''
    );
  }

  cantonName(id: number): string {
    return (
      this.catalog()?.cantones.find((c) => c.idCanton === id)?.descripcion ?? ''
    );
  }

  distritoName(id: number): string {
    return (
      this.catalog()?.distritos.find((d) => d.idDistrito === id)?.descripcion ??
      ''
    );
  }

  formatLocation(c: CampsiteResponse): string {
    const p = this.provinciaName(c.idProvincia);
    const can = this.cantonName(c.idCanton);
    const dis = this.distritoName(c.idDistrito);
    return [dis, can, p].filter(Boolean).join(' · ') || '—';
  }

  onFavoriteClick(): void {
    if (!this.auth.isLoggedIn()) {
      this.goLogin();
      return;
    }
    if (this.favoriteBusy()) {
      return;
    }
    const uid = this.id();
    this.favoriteBusy.set(true);
    if (this.isFavorite()) {
      this.favorites.delete(uid).subscribe({
        next: (ok) => {
          this.favoriteBusy.set(false);
          if (ok) {
            this.isFavorite.set(false);
          }
        },
        error: () => this.favoriteBusy.set(false),
      });
    } else {
      this.favorites.create(uid).subscribe({
        next: (ok) => {
          this.favoriteBusy.set(false);
          if (ok) {
            this.isFavorite.set(true);
          }
        },
        error: () => this.favoriteBusy.set(false),
      });
    }
  }

  openAddToTrip(): void {
    if (!this.auth.isLoggedIn()) {
      this.goLogin();
      return;
    }
    this.addToTripOpen.set(true);
    this.selectedTripId.set(null);
    this.trips.getAll().subscribe({
      next: (data) => {
        this.tripChoices.set(
          (data ?? []).map((t) => ({
            ...t,
            campsiteSummaries: t.campSiteSummaries ?? [],
          }))
        );
      },
    });
  }

  closeAddToTrip(): void {
    this.addToTripOpen.set(false);
  }

  onSelectTrip(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedTripId.set(
      v === '' || Number.isNaN(+v) ? null : Number(v)
    );
  }

  addCampsiteToSelectedTrip(): void {
    const tripId = this.selectedTripId();
    if (tripId == null) {
      this.toast.warning('Elige un viaje.');
      return;
    }
    this.addToTripBusy.set(true);
    this.trips.addCampsite(tripId, this.id()).subscribe({
      next: (ok) => {
        this.addToTripBusy.set(false);
        if (ok) this.addToTripOpen.set(false);
      },
      error: () => this.addToTripBusy.set(false),
    });
  }
}
