import { Component, OnInit, inject, signal, input, numberAttribute, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { TripsService } from '../../../core/services/http/trips.service';
import { LocationService } from '../../../core/services/http/location.service';
import { CampsitesService } from '../../../core/services/http/campsites.service';
import { TripResponse } from '../../../core/models/trips/trip-response';
import { UbicacionCatalog } from '../../../core/models/location/ubicacion-catalog';
import { CampsiteSummary } from '../../../core/models/campsites/campsite-summary';
import { CampsiteResponse } from '../../../core/models/campsites/campsite-response';

@Component({
  selector: 'cp-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.scss',
})
export class TripDetailComponent implements OnInit {
  private readonly trips    = inject(TripsService);
  private readonly location = inject(LocationService);
  private readonly sites    = inject(CampsitesService);
  private readonly toast    = inject(ToastService);

  /** Route param: `trips/:id` */
  readonly id = input.required({ transform: numberAttribute });

  readonly trip    = signal<TripResponse | null>(null);
  readonly catalog = signal<UbicacionCatalog | null>(null);
  /** All campsites for the add dropdown */
  readonly allCampsites = signal<CampsiteResponse[]>([]);
  /** Selected campsite id to add */
  readonly selectedAddId = signal<number | null>(null);
  /** Show add row */
  readonly addOpen  = signal(false);
  /** Confirm remove for campsite id */
  readonly removeConfirmCampsiteId = signal<number | null>(null);

  readonly takenIds = computed(() => {
    const t = this.trip();
    if (!t?.campSiteSummaries?.length) {
      return new Set<number>();
    }
    return new Set(t.campSiteSummaries.map((c) => c.id));
  });

  readonly availableCampsites = computed(() => {
    const set = this.takenIds();
    return this.allCampsites().filter((c) => !set.has(c.id));
  });

  readonly imgFallback =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect fill="#e9ecef" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-size="14" font-family="sans-serif">Camping</text></svg>',
    );

  ngOnInit(): void {
    this.location.loadUbicacionCatalog().subscribe({
      next: (c) => this.catalog.set(c),
      error: () => { /* list may still work without names */ },
    });
    this.sites.getAll().subscribe({
      next: (data) => this.allCampsites.set(data ?? []),
      error: () => { /* add dropdown empty */ },
    });
    this.loadTrip();
  }

  loadTrip(): void {
    this.trips.getById(this.id()).subscribe({
      next: (t) => {
        if (t) {
          this.trip.set({
            ...t,
            campSiteSummaries: t.campSiteSummaries ?? [],
            startDate: this.coerceDate(t.startDate as Date & string),
            endDate:   this.coerceDate(t.endDate as Date & string),
          });
        } else {
          this.trip.set(null);
        }
      },
      error: () => this.trip.set(null),
    });
  }

  private coerceDate(d: Date | string): Date {
    if (d instanceof Date) {
      return d;
    }
    return new Date(d);
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

  getImageSrc(raw: string | null | undefined): string {
    if (!raw) return this.imgFallback;
    if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
    return `data:image/jpeg;base64,${raw}`;
  }

  onCampsiteImgError(ev: Event): void {
    const el = ev.target;
    if (el instanceof HTMLImageElement) {
      el.src = this.imgFallback;
    }
  }

  onSelectCampsiteToAdd(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.selectedAddId.set(v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  }

  startAdd(): void {
    this.addOpen.set(true);
    this.selectedAddId.set(null);
  }

  cancelAdd(): void {
    this.addOpen.set(false);
    this.selectedAddId.set(null);
  }

  addSelected(): void {
    const siteId = this.selectedAddId();
    if (siteId == null) {
      this.toast.warning('Selecciona un camping para agregar.');
      return;
    }
    this.trips.addCampsite(this.id(), siteId).subscribe({
      next: (ok) => {
        if (ok) {
          this.addOpen.set(false);
          this.selectedAddId.set(null);
          this.loadTrip();
        }
      },
    });
  }

  askRemoveCampsite(campsiteId: number): void {
    this.removeConfirmCampsiteId.set(campsiteId);
  }

  cancelRemoveCampsite(): void {
    this.removeConfirmCampsiteId.set(null);
  }

  doRemoveCampsite(campsiteId: number): void {
    this.trips.removeCampsite(this.id(), campsiteId).subscribe({
      next: (ok) => {
        this.removeConfirmCampsiteId.set(null);
        if (ok) this.loadTrip();
      },
      error: () => this.removeConfirmCampsiteId.set(null),
    });
  }

  protected readonly getImageFromBase64 = (base64: string): string => {
    return `data:image/jpeg;base64,${base64}`;
  }
}
