import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import { AuthorizationService } from '../../../../core/services/authorization.service';
import { PermissionsService } from '../../../../core/services/http/permissions.service';
import { PermissionResponse } from '../../../../core/models/permissions/permission-response';

@Component({
  selector: 'cp-admin-permission-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './admin-permission-list.component.html',
  styleUrl: './admin-permission-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPermissionListComponent implements OnInit {
  private readonly api = inject(PermissionsService);
  private readonly router = inject(Router);
  private readonly authz = inject(AuthorizationService);
  private readonly transloco = inject(TranslocoService);

  readonly rows = signal<PermissionResponse[]>([]);

  get canCreate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.PermissionCreate);
  }

  get canUpdate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.PermissionUpdate);
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: (list) => this.rows.set(list),
    });
  }

  create(): void {
    void this.router.navigate(['/admin/permissions/new']);
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/permissions', id]);
  }

  remove(row: PermissionResponse): void {
    if (!confirm(this.transloco.translate('adminApp.permissions.confirmDelete', { name: row.name }))) {
      return;
    }
    this.api.delete(row.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.reload();
        }
      },
    });
  }
}
