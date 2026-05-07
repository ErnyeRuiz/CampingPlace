import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
  });

  roleId: number | null = null;
  allPermissions: PermissionResponse[] = [];
  selectedPermissionIds = new Set<number>();

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.permissionsApi.getAll().subscribe({
      next: (list) => {
        this.allPermissions = list;
        this.cdr.markForCheck();
      },
      error: () => this.toast.danger('No se pudieron cargar los permisos.'),
    });

    if (idParam === null) {
      this.roleId = null;
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
        this.toast.danger('Error al cargar el rol.');
        void this.router.navigate(['/admin/roles']);
      },
    });
  }

  togglePermission(id: number): void {
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
          this.toast.success('Rol creado. Asigna permisos en la siguiente pantalla.');
          void this.router.navigate(['/admin/roles', newId]);
        },
        error: () => this.toast.danger('No se pudo crear el rol.'),
      });
      return;
    }

    this.rolesApi.update(this.roleId, body).subscribe({
      next: (ok) => {
        if (!ok) {
          return;
        }
        const ids = [...this.selectedPermissionIds];
        this.rolesApi.replacePermissions(this.roleId!, { permissionIds: ids }).subscribe({
          next: (okPerm) => {
            if (okPerm) {
              this.toast.success('Rol y permisos actualizados.');
            } else {
              this.toast.danger('Rol guardado; permisos no se actualizaron.');
            }
            void this.router.navigate(['/admin/roles']);
          },
          error: () => this.toast.danger('Rol guardado; error al actualizar permisos.'),
        });
      },
      error: () => this.toast.danger('No se pudo actualizar el rol.'),
    });
  }
}
