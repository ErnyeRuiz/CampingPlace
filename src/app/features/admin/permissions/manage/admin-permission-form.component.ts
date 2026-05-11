import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { APP_HOME_PATH, PERMISSIONS } from '../../../../core/constants/permissions';
import { AuthorizationService } from '../../../../core/services/authorization.service';
import { PermissionsService } from '../../../../core/services/http/permissions.service';
import { RolesService } from '../../../../core/services/http/roles.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RoleResponse } from '../../../../core/models/roles/role-response';

@Component({
  selector: 'cp-admin-permission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-permission-form.component.html',
  styleUrl: './admin-permission-form.component.scss',
})
export class AdminPermissionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissionsApi = inject(PermissionsService);
  private readonly rolesApi = inject(RolesService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authz = inject(AuthorizationService);

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(200),
    ]),
    description: this.fb.nonNullable.control(''),
    assignToRoleId: this.fb.control<number | null>(null),
  });

  permissionId: number | null = null;
  roles: RoleResponse[] = [];

  get canAssignToRole(): boolean {
    return this.authz.hasPermission(PERMISSIONS.RoleUpdate);
  }

  get canSubmit(): boolean {
    if (this.permissionId === null) {
      return this.authz.hasPermission(PERMISSIONS.PermissionCreate);
    }
    return this.authz.hasPermission(PERMISSIONS.PermissionUpdate);
  }

  ngOnInit(): void {
    this.rolesApi.getAll().subscribe({
      next: (list) => {
        this.roles = list;
        this.cdr.markForCheck();
      },
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      if (!this.authz.hasPermission(PERMISSIONS.PermissionCreate)) {
        void this.router.navigate([APP_HOME_PATH]);
        return;
      }
      this.permissionId = null;
      return;
    }

    if (!this.authz.hasPermission(PERMISSIONS.PermissionUpdate)) {
      void this.router.navigate([APP_HOME_PATH]);
      return;
    }

    const id = Number(idParam);
    if (Number.isNaN(id)) {
      void this.router.navigate(['/admin/permissions']);
      return;
    }

    this.permissionId = id;
    this.permissionsApi.getById(id).subscribe({
      next: (row) => {
        if (!row) {
          this.toast.danger('Permiso no encontrado.');
          void this.router.navigate(['/admin/permissions']);
          return;
        }
        this.form.patchValue({
          name: row.name,
          description: row.description ?? '',
        });
      },
      error: () => {
        void this.router.navigate(['/admin/permissions']);
      },
    });
  }

  submit(): void {
    if (!this.canSubmit) {
      void this.router.navigate([APP_HOME_PATH]);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: raw.name.trim(),
      description: raw.description.trim() ? raw.description.trim() : null,
    };
    const assignRoleId = this.canAssignToRole ? raw.assignToRoleId : null;
    const willAssignRole =
      assignRoleId != null && Number(assignRoleId) > 0;

    if (this.permissionId === null) {
      this.permissionsApi
        .create(
          body,
          willAssignRole ? { suppressSuccessToast: true } : undefined,
        )
        .subscribe({
          next: (newId) => {
            if (newId === null) {
              return;
            }
            this.afterSaveOptionalAssign(newId, assignRoleId);
          },
        });
      return;
    }

    this.permissionsApi
      .update(
        this.permissionId,
        body,
        willAssignRole ? { suppressSuccessToast: true } : undefined,
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            return;
          }
          this.afterSaveOptionalAssign(this.permissionId!, assignRoleId);
        },
      });
  }

  private afterSaveOptionalAssign(
    permissionId: number,
    roleId: number | null,
  ): void {
    if (roleId === null || roleId <= 0) {
      void this.router.navigate(['/admin/permissions']);
      return;
    }

    this.rolesApi.getById(roleId).subscribe({
      next: (role) => {
        if (!role) {
          this.toast.danger('Rol no encontrado para asignación.');
          void this.router.navigate(['/admin/permissions']);
          return;
        }
        const existing = new Set(role.permissionIds ?? []);
        existing.add(permissionId);
        this.rolesApi
          .replacePermissions(roleId, { permissionIds: [...existing] })
          .subscribe({
            next: () => {
              void this.router.navigate(['/admin/permissions']);
            },
            error: () => {
              void this.router.navigate(['/admin/permissions']);
            },
          });
      },
      error: () => {
        void this.router.navigate(['/admin/permissions']);
      },
    });
  }
}
