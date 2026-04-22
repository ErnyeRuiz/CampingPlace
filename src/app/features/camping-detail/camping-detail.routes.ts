import { Routes } from '@angular/router';

export const CAMPING_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./camping-detail.component').then(m => m.CampingDetailComponent)
  }
];
