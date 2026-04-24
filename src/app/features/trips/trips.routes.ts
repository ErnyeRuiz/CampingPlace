import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./trips-list/trips-list.component').then(m => m.TripsListComponent)
  },
  {
    path: ':id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./trip-detail/trip-detail.component').then(m => m.TripDetailComponent)
  }
];
