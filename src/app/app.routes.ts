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
      import('./features/camping-list/camping-list.routes').then(m => m.CAMPING_LIST_ROUTES)
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
    path: '**',
    redirectTo: 'campings'
  }
];
