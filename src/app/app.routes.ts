import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'campings',
    pathMatch: 'full'
  },
  {
    path: 'campings',
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES)
  },
  {
    path: 'campings/:id',
    loadChildren: () =>
      import('./features/camping-detail/camping-detail.routes').then(m => m.CAMPING_DETAIL_ROUTES)
  },
  {
    path: 'map',
    loadChildren: () =>
      import('./features/map-view/map-view.routes').then(m => m.MAP_VIEW_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'campings'
  }
];
