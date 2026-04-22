import { Routes } from '@angular/router';

export const MAP_VIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./map-view.component').then(m => m.MapViewComponent)
  }
];
