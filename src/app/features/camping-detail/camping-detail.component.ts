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
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ToastService } from '../../core/services/toast.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { PERMISSIONS } from '../../core/constants/permissions';
import { catchError, forkJoin, of } from 'rxjs';
import { CampsitesService } from '../../core/services/http/campsites.service';
import { LocationService } from '../../core/services/http/location.service';
import { AuthService } from '../../core/services/http/auth.service';
import { FavoritesService } from '../../core/services/http/favorites.services';
import { TripsService } from '../../core/services/http/trips.service';
import { CampsiteResponse } from '../../core/models/campsites/campsite-response';
import { CampsiteReviewRequest } from '../../core/models/campsites/campsite-review-request';
import { CampsiteReviewResponse } from '../../core/models/campsites/campsite-review-response';
import { FavoriteResponse } from '../../core/models/favorites/favorite-response';
import { TripResponse } from '../../core/models/trips/trip-response';
import { UbicacionCatalog } from '../../core/models/location/ubicacion-catalog';
import { injectThemedMarkUrl } from '../../core/branding/app-branding';

const REVIEW_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'cp-camping-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './camping-detail.component.html',
  styleUrl: './camping-detail.component.scss',
})
export class CampingDetailComponent implements OnInit {
  private readonly campsiteService = inject(CampsitesService);
  private readonly locationService  = inject(LocationService);
  readonly auth = inject(AuthService);
  readonly authz = inject(AuthorizationService);
  private readonly favorites       = inject(FavoritesService);
  private readonly trips           = inject(TripsService);
  private readonly router          = inject(Router);
  private readonly toast           = inject(ToastService);
  private readonly fb              = inject(FormBuilder);
  private readonly transloco       = inject(TranslocoService);

  readonly themedMarkUrl = injectThemedMarkUrl();

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

  readonly reviews             = signal<CampsiteReviewResponse[]>([]);
  readonly reviewSubmitBusy    = signal(false);
  /** Panel «añadir opinión» cerrado por defecto para no saturar la vista. */
  readonly reviewComposerOpen = signal(false);
  readonly reviewStarHover    = signal<number | null>(null);
  readonly editingReviewId    = signal<number | null>(null);
  readonly editReviewStarHover = signal<number | null>(null);
  readonly reviewRowBusyId    = signal<number | null>(null);

  readonly reviewForm = this.fb.nonNullable.group({
    rating: [
      5,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    comment: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly editReviewForm = this.fb.nonNullable.group({
    rating: [
      5,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    comment: ['', [Validators.required, Validators.minLength(10)]],
  });

  /**
   * Si el usuario está en espera entre opiniones en este camping, fecha en la que podrá opinar de nuevo.
   */
  readonly nextReviewEligibleAt = computed(() => {
    const uid = this.auth.currentUser()?.userId;
    if (uid == null) {
      return null;
    }
    const mine = this.reviews().filter((r) => r.userId === uid);
    if (!mine.length) {
      return null;
    }
    const latest = mine.reduce((best, r) =>
      this.reviewCreatedAt(r).getTime() > this.reviewCreatedAt(best).getTime()
        ? r
        : best,
    );
    const eligible = new Date(
      this.reviewCreatedAt(latest).getTime() + REVIEW_COOLDOWN_MS,
    );
    return Date.now() >= eligible.getTime() ? null : eligible;
  });

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

    const reviewRows$ = this.campsiteService.getReviewsById(campsiteId).pipe(
      catchError(() => of<CampsiteReviewResponse[]>([])),
    );

    forkJoin({
      site: this.campsiteService.getbyId(campsiteId),
      cat: this.locationService.loadUbicacionCatalog(),
      favs: favs$,
      reviewRows: reviewRows$,
    }).subscribe({
      next: ({ site, cat, favs, reviewRows }) => {
        this.catalog.set(cat);
        this.reviews.set(this.sortReviewsDesc(reviewRows));
        if (!site) {
          this.campsite.set(null);
          this.toast.warning(this.transloco.translate('campingDetail.toastNotFound'));
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
        this.reviews.set([]);
        this.detailLoading.set(false);
      },
    });
  }

  reviewCreatedAt(r: CampsiteReviewResponse): Date {
    const d = r.createdAt;
    return d instanceof Date ? d : new Date(d);
  }

  toggleReviewComposer(): void {
    this.reviewComposerOpen.update((open) => !open);
    if (!this.reviewComposerOpen()) {
      this.reviewStarHover.set(null);
    }
  }

  /** Valor mostrado en el selector de estrellas (hover preview o valor del formulario). */
  reviewPickerRating(): number {
    const hover = this.reviewStarHover();
    if (hover != null) {
      return hover;
    }
    return this.reviewForm.controls.rating.value;
  }

  setReviewRating(star: number): void {
    this.reviewForm.patchValue({ rating: star });
    this.reviewStarHover.set(null);
  }

  reviewRatingLabel(stars: number): string {
    const rounded = Math.min(5, Math.max(1, Math.round(Number(stars))));
    const key =
      rounded === 1
        ? 'campingDetail.reviewRatingStars.1'
        : rounded === 2
          ? 'campingDetail.reviewRatingStars.2'
          : rounded === 3
            ? 'campingDetail.reviewRatingStars.3'
            : rounded === 4
              ? 'campingDetail.reviewRatingStars.4'
              : 'campingDetail.reviewRatingStars.5';
    return this.transloco.translate(key);
  }

  reviewAuthorDisplay(r: CampsiteReviewResponse): string {
    const name = r.userName?.trim();
    return name?.length ? name : this.transloco.translate('campingDetail.anonymousUser');
  }

  canEditReview(r: CampsiteReviewResponse): boolean {
    const uid = this.auth.currentUser()?.userId;
    return uid != null && r.userId === uid;
  }

  canDeleteReview(r: CampsiteReviewResponse): boolean {
    const uid = this.auth.currentUser()?.userId;
    if (uid != null && r.userId === uid) {
      return true;
    }
    return this.authz.hasPermission(PERMISSIONS.ReviewDelete);
  }

  reviewRowActionsDisabled(): boolean {
    return this.reviewRowBusyId() !== null;
  }

  editReviewPickerRating(): number {
    const hover = this.editReviewStarHover();
    if (hover != null) {
      return hover;
    }
    return this.editReviewForm.controls.rating.value;
  }

  setEditReviewRating(star: number): void {
    this.editReviewForm.patchValue({ rating: star });
    this.editReviewStarHover.set(null);
  }

  startEditReview(r: CampsiteReviewResponse): void {
    if (!this.canEditReview(r) || this.reviewRowActionsDisabled()) {
      return;
    }
    this.editingReviewId.set(r.id);
    this.editReviewForm.patchValue({
      rating: r.rating,
      comment: r.comment,
    });
    this.editReviewStarHover.set(null);
  }

  cancelEditReview(): void {
    this.editingReviewId.set(null);
    this.editReviewStarHover.set(null);
  }

  submitEditReview(): void {
    const reviewId = this.editingReviewId();
    if (reviewId == null || !this.auth.isLoggedIn()) {
      return;
    }
    if (this.editReviewForm.invalid) {
      this.editReviewForm.markAllAsTouched();
      return;
    }
    const raw = this.editReviewForm.getRawValue();
    const rating = Math.round(Number(raw.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.editReviewForm.markAllAsTouched();
      return;
    }
    const comment = raw.comment.trim();
    this.reviewRowBusyId.set(reviewId);
    this.campsiteService
      .updateReview(reviewId, new CampsiteReviewRequest(rating, comment))
      .subscribe({
        next: (ok) => {
          this.reviewRowBusyId.set(null);
          if (!ok) {
            return;
          }
          this.cancelEditReview();
          this.refreshReviewsAndSite();
        },
        error: () => this.reviewRowBusyId.set(null),
      });
  }

  confirmDeleteReview(r: CampsiteReviewResponse): void {
    if (!this.canDeleteReview(r) || this.reviewRowActionsDisabled()) {
      return;
    }
    const msg = this.transloco.translate('campingDetail.confirmDeleteReview');
    if (!confirm(msg)) {
      return;
    }
    this.reviewRowBusyId.set(r.id);
    this.campsiteService.deleteReviewById(r.id).subscribe({
      next: (ok) => {
        this.reviewRowBusyId.set(null);
        if (!ok) {
          return;
        }
        if (this.editingReviewId() === r.id) {
          this.cancelEditReview();
        }
        this.refreshReviewsAndSite();
      },
      error: () => this.reviewRowBusyId.set(null),
    });
  }

  private refreshReviewsAndSite(done?: () => void): void {
    const campsiteId = this.id();
    forkJoin({
      reviewRows: this.campsiteService.getReviewsById(campsiteId).pipe(
        catchError(() => of<CampsiteReviewResponse[]>([])),
      ),
      site: this.campsiteService.getbyId(campsiteId),
    }).subscribe({
      next: ({ reviewRows, site }) => {
        this.reviews.set(this.sortReviewsDesc(reviewRows));
        if (site) {
          this.campsite.set({ ...site, images: site.images ?? [] });
        }
        done?.();
      },
      error: () => done?.(),
    });
  }

  private sortReviewsDesc(rows: CampsiteReviewResponse[]): CampsiteReviewResponse[] {
    return [...rows].sort(
      (a, b) =>
        this.reviewCreatedAt(b).getTime() - this.reviewCreatedAt(a).getTime(),
    );
  }

  submitReview(): void {
    if (!this.auth.isLoggedIn()) {
      this.goLogin();
      return;
    }
    if (this.nextReviewEligibleAt() != null || this.reviewSubmitBusy()) {
      return;
    }
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const raw = this.reviewForm.getRawValue();
    const rating = Math.round(Number(raw.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const comment = raw.comment.trim();
    this.reviewSubmitBusy.set(true);
    const campsiteId = this.id();
    this.campsiteService
      .createReview(
        campsiteId,
        new CampsiteReviewRequest(rating, comment),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.reviewSubmitBusy.set(false);
            return;
          }
          this.refreshReviewsAndSite(() => {
            this.reviewForm.reset({
              rating: 5,
              comment: '',
            });
            this.reviewComposerOpen.set(false);
            this.reviewStarHover.set(null);
            this.reviewSubmitBusy.set(false);
          });
        },
        error: () => this.reviewSubmitBusy.set(false),
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
      this.toast.warning(this.transloco.translate('campingDetail.toastPickTrip'));
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
