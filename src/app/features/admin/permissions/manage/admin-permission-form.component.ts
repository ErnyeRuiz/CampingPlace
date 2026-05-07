import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

  ngOnInit(): void {
    this.rolesApi.getAll().subscribe({
      next: (list) => {
        this.roles = list;
        this.cdr.markForCheck();
      },
      error: () => this.toast.danger('No se pudieron cargar los roles.'),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.permissionId = null;
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
        this.toast.danger('Error al cargar el permiso.');
        void this.router.navigate(['/admin/permissions']);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: raw.name.trim(),
      description: raw.description.trim() ? raw.description.trim() : null,
    };
    const assignRoleId = raw.assignToRoleId;

    if (this.permissionId === null) {
      this.permissionsApi.create(body).subscribe({
        next: (newId) => {
          if (newId === null) {
            return;
          }
          this.afterSaveOptionalAssign(newId, assignRoleId, true);
        },
        error: () => this.toast.danger('No se pudo crear el permiso.'),
      });
      return;
    }

    this.permissionsApi.update(this.permissionId, body).subscribe({
      next: (ok) => {
        if (!ok) {
          return;
        }
        this.afterSaveOptionalAssign(this.permissionId!, assignRoleId, false);
      },
      error: () => this.toast.danger('No se pudo actualizar el permiso.'),
    });
  }

  private afterSaveOptionalAssign(
    permissionId: number,
    roleId: number | null,
    isNew: boolean,
  ): void {
    if (roleId === null || roleId <= 0) {
      this.toast.success(isNew ? 'Permiso creado.' : 'Permiso actualizado.');
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
            next: (ok) => {
              if (ok) {
                this.toast.success(
                  isNew
                    ? 'Permiso creado y asignado al rol.'
                    : 'Permiso actualizado y asignado al rol.',
                );
              } else {
                this.toast.danger('Guardado, pero no se pudo asignar al rol.');
              }
              void this.router.navigate(['/admin/permissions']);
            },
            error: () => {
              this.toast.danger('Guardado, pero error al asignar al rol.');
              void this.router.navigate(['/admin/permissions']);
            },
          });
      },
      error: () => {
        this.toast.danger('No se pudo cargar el rol para asignar permisos.');
        void this.router.navigate(['/admin/permissions']);
      },
    });
  }
}
