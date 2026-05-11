import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { pairwise, startWith } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CampingFilter } from '../../core/models';
import { CampsitesService } from '../../core/services/http/campsites.service';
import { CampsiteResponse } from '../../core/models/campsites/campsite-response';
import { LocationService } from '../../core/services/http/location.service';
import { ProvinciaResponse } from '../../core/models/location/provincia-response';
import { CantonResponse } from '../../core/models/location/canton-response';
import { DistritoResponse } from '../../core/models/location/distrito-response';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/http/auth.service';
import { FavoritesService } from '../../core/services/http/favorites.services';
import { FavoriteResponse } from '../../core/models/favorites/favorite-response';
import { DashboardService } from '../../core/services/http/dashboard.service';
import { AppBranding, injectThemedMarkUrl } from '../../core/branding/app-branding';

@Component({
  selector: 'cp-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly campsiteService = inject(CampsitesService);
  private readonly dashboardService = inject(DashboardService);
  private readonly locationService = inject(LocationService);
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly themedMarkUrl = injectThemedMarkUrl();
  readonly heroBrandUrl = AppBranding.wordmarkOnDarkBg;

  readonly campites = signal<CampsiteResponse[]>([]);
  /** Evita mostrar “vacío” antes de que termine la primera carga (sin UI de loading local). */
  readonly initialLoadDone = signal(false);
  readonly totalCount = signal(0);
  /** Promedio global desde el API (getStats). */
  readonly averageRating = signal<number | null>(null);
  /** Campsite ids marked as favorite (session). */
  readonly favoriteCampsiteIds = signal<ReadonlySet<number>>(new Set());

  readonly filter = signal<CampingFilter>({ page: 1, pageSize: 12 });

  readonly isEmpty = computed(
    () => this.initialLoadDone() && this.campites().length === 0,
  );

  readonly provincias = signal<ProvinciaResponse[]>([]);
  readonly cantones = signal<CantonResponse[]>([]);
  readonly distritos = signal<DistritoResponse[]>([]);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(null as NavigationEnd | null),
        pairwise(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([prev, curr]) => {
        if (!curr || !prev) {
          return;
        }
        const to = HomeComponent.normalizePath(curr.urlAfterRedirects);
        const from = HomeComponent.normalizePath(prev.urlAfterRedirects);
        if (to !== '/campings' || from === '/campings') {
          return;
        }
        this.refreshFavoriteIds();
      });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private static normalizePath(url: string): string {
    const noQuery = url.split('?')[0] ?? url;
    const p = (noQuery.split('#')[0] ?? noQuery).replace(/\/$/, '') || '/';
    return p;
  }

  /** Al volver al listado desde detalle u otra ruta, actualizar corazones. */
  private refreshFavoriteIds(): void {
    if (!this.auth.isLoggedIn()) {
      this.favoriteCampsiteIds.set(new Set());
      return;
    }
    this.favorites.getAll().subscribe({
      next: (favs) => {
        this.favoriteCampsiteIds.set(
          new Set((favs ?? []).map((f) => f.campSiteId)),
        );
      },
    });
  }

  private loadData(): void {
    forkJoin({
      ubicacion: this.locationService.loadUbicacionCatalog(),
      campsites: this.campsiteService.getAll(),
      stats: this.dashboardService.getStats().pipe(
        catchError(() => of(null)),
      ),
      favs: this.auth.isLoggedIn()
        ? this.favorites.getAll()
        : of<FavoriteResponse[]>([]),
    }).subscribe({
      next: ({ ubicacion, campsites, stats, favs }) => {
        this.provincias.set(ubicacion.provincias);
        this.cantones.set(ubicacion.cantones);
        this.distritos.set(ubicacion.distritos);
        this.campites.set(campsites);
        this.totalCount.set(stats?.totalCount ?? campsites.length);
        this.averageRating.set(stats?.averageRating ?? null);
        this.favoriteCampsiteIds.set(
          new Set((favs ?? []).map((f) => f.campSiteId)),
        );
        this.initialLoadDone.set(true);
      },
      error: () => this.initialLoadDone.set(true),
    });
  }

  protected readonly getImageFromBase64 = (base64: string): string => {
    return `data:image/jpeg;base64,${base64}`;
  }

  protected readonly getProvinciaName = (id: number): string => {
    return this.provincias().find(provincia => provincia.idProvincia === id)?.descripcion ?? '';
  }

  protected readonly getCantonName = (id: number): string => {
    return this.cantones().find(canton => canton.idCanton === id)?.descripcion ?? '';
  }

  protected readonly getDistritoName = (id: number): string => {
    return this.distritos().find(distrito => distrito.idDistrito === id)?.descripcion ?? '';
  }

}
