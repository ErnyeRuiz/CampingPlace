import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import { AuthorizationService } from '../../../../core/services/authorization.service';
import { RolesService } from '../../../../core/services/http/roles.service';
import { RoleResponse } from '../../../../core/models/roles/role-response';

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
  private readonly authz = inject(AuthorizationService);

  readonly rows = signal<RoleResponse[]>([]);

  get canCreate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.RoleCreate);
  }

  get canUpdate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.RoleUpdate);
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.rolesApi.getAll().subscribe({
      next: (list) => this.rows.set(list),
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
          this.reload();
        }
      },
    });
  }
}
