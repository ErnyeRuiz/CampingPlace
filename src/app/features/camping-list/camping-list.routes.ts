import { Routes } from '@angular/router';

export const CAMPING_LIST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./camping-list.component').then(m => m.CampingListComponent)
  }
];
