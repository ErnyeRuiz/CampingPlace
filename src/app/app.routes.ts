import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminSectionGuard } from './core/guards/admin-section.guard';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminSectionGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'campings',
        pathMatch: 'full',
      },
      {
        path: 'campings',
        loadChildren: () =>
          import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'campings/:id',
        loadChildren: () =>
          import('./features/camping-detail/camping-detail.routes').then(
            (m) => m.CAMPING_DETAIL_ROUTES,
          ),
      },
      {
        path: 'map',
        loadChildren: () =>
          import('./features/map-view/map-view.routes').then((m) => m.MAP_VIEW_ROUTES),
      },
      {
        path: 'auth',
        loadChildren: () =>
          import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
      {
        path: 'trips',
        loadChildren: () =>
          import('./features/trips/trips.routes').then((m) => m.TRIPS_ROUTES),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
      },
      {
        path: '**',
        redirectTo: 'campings',
      },
    ],
  },
];
