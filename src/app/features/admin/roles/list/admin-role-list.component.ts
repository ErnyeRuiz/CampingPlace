import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolesService } from '../../../../core/services/http/roles.service';
import { RoleResponse } from '../../../../core/models/roles/role-response';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'cp-admin-role-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-role-list.component.html',
  styleUrl: './admin-role-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoleListComponent implements OnInit {
  private readonly rolesApi = inject(RolesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rows = signal<RoleResponse[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.rolesApi.getAll().subscribe({
      next: (list) => this.rows.set(list),
      error: () => this.toast.danger('No se pudieron cargar los roles.'),
    });
  }

  create(): void {
    void this.router.navigate(['/admin/roles/new']);
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/roles', id]);
  }

  remove(row: RoleResponse): void {
    if (!confirm(`¿Eliminar el rol «${row.name}»?`)) {
      return;
    }
    this.rolesApi.delete(row.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.toast.success('Rol eliminado.');
          this.reload();
        }
      },
      error: () => this.toast.danger('No se pudo eliminar el rol.'),
    });
  }
}
