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
import { PermissionResponse } from '../../../../core/models/permissions/permission-response';
import { PermissionsService } from '../../../../core/services/http/permissions.service';
import { RolesService } from '../../../../core/services/http/roles.service';
import { ToastService } from '../../../../core/services/toast.service';


@Component({
  selector: 'cp-admin-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-role-form.component.html',
  styleUrl: './admin-role-form.component.scss',
})
export class AdminRoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rolesApi = inject(RolesService);
  private readonly permissionsApi = inject(PermissionsService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authz = inject(AuthorizationService);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
  });

  roleId: number | null = null;
  allPermissions: PermissionResponse[] = [];
  selectedPermissionIds = new Set<number>();

  get canMutatePermissions(): boolean {
    return (
      this.roleId !== null && this.authz.hasPermission(PERMISSIONS.RoleUpdate)
    );
  }

  get canSubmit(): boolean {
    if (this.roleId === null) {
      return this.authz.hasPermission(PERMISSIONS.RoleCreate);
    }
    return this.authz.hasPermission(PERMISSIONS.RoleUpdate);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam === null) {
      if (!this.authz.hasPermission(PERMISSIONS.RoleCreate)) {
        void this.router.navigate([APP_HOME_PATH]);
        return;
      }
      this.roleId = null;
    } else {
      if (!this.authz.hasPermission(PERMISSIONS.RoleUpdate)) {
        void this.router.navigate([APP_HOME_PATH]);
        return;
      }

      const id = Number(idParam);
      if (Number.isNaN(id)) {
        void this.router.navigate(['/admin/roles']);
        return;
      }

      this.roleId = id;
      this.rolesApi.getById(id).subscribe({
        next: (role) => {
          if (!role) {
            this.toast.danger('Rol no encontrado.');
            void this.router.navigate(['/admin/roles']);
            return;
          }
          this.form.patchValue({
            name: role.name,
            description: role.description ?? '',
          });
          const ids = role.permissionIds ?? [];
          this.selectedPermissionIds = new Set(ids);
        },
        error: () => {
          void this.router.navigate(['/admin/roles']);
        },
      });
    }

    this.permissionsApi.getAll().subscribe({
      next: (list) => {
        this.allPermissions = list;
        this.cdr.markForCheck();
      },
    });
  }

  togglePermission(id: number): void {
    if (!this.canMutatePermissions) {
      return;
    }
    if (this.selectedPermissionIds.has(id)) {
      this.selectedPermissionIds.delete(id);
    } else {
      this.selectedPermissionIds.add(id);
    }
  }

  isChecked(id: number): boolean {
    return this.selectedPermissionIds.has(id);
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
    const { name, description } = this.form.getRawValue();
    const body = {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
    };

    if (this.roleId === null) {
      this.rolesApi.create(body).subscribe({
        next: (newId) => {
          if (newId === null) {
            return;
          }
          const canEditAfter = this.authz.hasPermission(PERMISSIONS.RoleUpdate);
          void this.router.navigate(
            canEditAfter ? ['/admin/roles', newId] : ['/admin/roles'],
          );
        },
      });
      return;
    }

    this.rolesApi
      .update(this.roleId, body, { suppressSuccessToast: true })
      .subscribe({
      next: (ok) => {
        if (!ok) {
          return;
        }
        const ids = [...this.selectedPermissionIds];
        this.rolesApi.replacePermissions(this.roleId!, { permissionIds: ids }).subscribe({
          next: () => {
            void this.router.navigate(['/admin/roles']);
          },
          error: () => {
            void this.router.navigate(['/admin/roles']);
          },
        });
      },
    });
  }
}
