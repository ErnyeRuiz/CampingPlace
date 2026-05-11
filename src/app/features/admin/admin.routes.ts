import { Routes } from '@angular/router';
import { PERMISSIONS } from '../../core/constants/permissions';
import { permissionGuard } from '../../core/guards/permission.guard';

const roleListPerms = [PERMISSIONS.RoleCreate, PERMISSIONS.RoleUpdate];
const permListPerms = [PERMISSIONS.PermissionCreate, PERMISSIONS.PermissionUpdate];
const campsiteListPerms = [PERMISSIONS.CampsiteCreate, PERMISSIONS.CampsiteUpdate];

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./admin-entry-redirect.component').then((m) => m.AdminEntryRedirectComponent),
  },
  {
    path: 'roles',
    canActivate: [permissionGuard],
    data: { permissions: roleListPerms },
    loadComponent: () =>
      import('./roles/list/admin-role-list.component').then((m) => m.AdminRoleListComponent),
  },
  {
    path: 'roles/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.RoleCreate] },
    loadComponent: () =>
      import('./roles/manage/admin-role-form.component').then((m) => m.AdminRoleFormComponent),
  },
  {
    path: 'roles/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.RoleUpdate] },
    loadComponent: () =>
      import('./roles/manage/admin-role-form.component').then((m) => m.AdminRoleFormComponent),
  },
  {
    path: 'permissions',
    canActivate: [permissionGuard],
    data: { permissions: permListPerms },
    loadComponent: () =>
      import('./permissions/list/admin-permission-list.component').then(
        (m) => m.AdminPermissionListComponent,
      ),
  },
  {
    path: 'permissions/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PermissionCreate] },
    loadComponent: () =>
      import('./permissions/manage/admin-permission-form.component').then(
        (m) => m.AdminPermissionFormComponent,
      ),
  },
  {
    path: 'permissions/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PermissionUpdate] },
    loadComponent: () =>
      import('./permissions/manage/admin-permission-form.component').then(
        (m) => m.AdminPermissionFormComponent,
      ),
  },
  {
    path: 'campsites',
    canActivate: [permissionGuard],
    data: { permissions: campsiteListPerms },
    loadComponent: () =>
      import('./campsites/list/admin-campsite-list.component').then(
        (m) => m.AdminCampsiteListComponent,
      ),
  },
  {
    path: 'campsites/new',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CampsiteCreate] },
    loadComponent: () =>
      import('./campsites/manage/admin-campsite-form.component').then(
        (m) => m.AdminCampsiteFormComponent,
      ),
  },
  {
    path: 'campsites/:id',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CampsiteUpdate] },
    loadComponent: () =>
      import('./campsites/manage/admin-campsite-form.component').then(
        (m) => m.AdminCampsiteFormComponent,
      ),
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: { superUserOnly: true },
    loadComponent: () =>
      import('./users/list/admin-users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'users/:id',
    canActivate: [permissionGuard],
    data: { superUserOnly: true },
    loadComponent: () =>
      import('./users/manage/admin-user-form.component').then((m) => m.AdminUserFormComponent),
  },
];
