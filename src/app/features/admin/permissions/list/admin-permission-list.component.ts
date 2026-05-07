import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionsService } from '../../../../core/services/http/permissions.service';
import { PermissionResponse } from '../../../../core/models/permissions/permission-response';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'cp-admin-permission-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-permission-list.component.html',
  styleUrl: './admin-permission-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPermissionListComponent implements OnInit {
  private readonly api = inject(PermissionsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rows = signal<PermissionResponse[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: (list) => this.rows.set(list),
      error: () => this.toast.danger('No se pudieron cargar los permisos.'),
    });
  }

  create(): void {
    void this.router.navigate(['/admin/permissions/new']);
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/permissions', id]);
  }

  remove(row: PermissionResponse): void {
    if (!confirm(`¿Eliminar el permiso «${row.name}»?`)) {
      return;
    }
    this.api.delete(row.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.toast.success('Permiso eliminado.');
          this.reload();
        }
      },
      error: () => this.toast.danger('No se pudo eliminar el permiso.'),
    });
  }
}
