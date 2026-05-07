import { Routes } from '@angular/router';
import { PERMISSIONS } from '../../core/constants/permissions';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
  {
    path: 'roles',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.RolesManage] },
    loadComponent: () =>
      import('./roles/list/admin-role-list.component').then((m) => m.AdminRoleListComponent),
  },
  {
    path: 'roles/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.RolesManage] },
    loadComponent: () =>
      import('./roles/manage/admin-role-form.component').then((m) => m.AdminRoleFormComponent),
  },
  {
    path: 'roles/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.RolesManage] },
    loadComponent: () =>
      import('./roles/manage/admin-role-form.component').then((m) => m.AdminRoleFormComponent),
  },
  {
    path: 'permissions',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PermissionsManage] },
    loadComponent: () =>
      import('./permissions/list/admin-permission-list.component').then(
        (m) => m.AdminPermissionListComponent,
      ),
  },
  {
    path: 'permissions/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PermissionsManage] },
    loadComponent: () =>
      import('./permissions/manage/admin-permission-form.component').then(
        (m) => m.AdminPermissionFormComponent,
      ),
  },
  {
    path: 'permissions/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PermissionsManage] },
    loadComponent: () =>
      import('./permissions/manage/admin-permission-form.component').then(
        (m) => m.AdminPermissionFormComponent,
      ),
  },
  {
    path: 'campsites',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CampsitesManage] },
    loadComponent: () =>
      import('./campsites/list/admin-campsite-list.component').then(
        (m) => m.AdminCampsiteListComponent,
      ),
  },
  {
    path: 'campsites/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CampsitesManage] },
    loadComponent: () =>
      import('./campsites/manage/admin-campsite-form.component').then(
        (m) => m.AdminCampsiteFormComponent,
      ),
  },
  {
    path: 'campsites/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CampsitesManage] },
    loadComponent: () =>
      import('./campsites/manage/admin-campsite-form.component').then(
        (m) => m.AdminCampsiteFormComponent,
      ),
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.UsersRead] },
    loadComponent: () =>
      import('./users/list/admin-users.component').then((m) => m.AdminUsersComponent),
  },
];
