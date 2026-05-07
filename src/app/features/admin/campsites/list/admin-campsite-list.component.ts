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
import { CampsitesService } from '../../../../core/services/http/campsites.service';
import { CampsiteResponse } from '../../../../core/models/campsites/campsite-response';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'cp-admin-campsite-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-campsite-list.component.html',
  styleUrl: './admin-campsite-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCampsiteListComponent implements OnInit {
  private readonly api = inject(CampsitesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authz = inject(AuthorizationService);

  readonly rows = signal<CampsiteResponse[]>([]);

  get canCreate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.CampsiteCreate);
  }

  get canUpdate(): boolean {
    return this.authz.hasPermission(PERMISSIONS.CampsiteUpdate);
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: (list) => this.rows.set(list),
      error: () => this.toast.danger('No se pudieron cargar los campings.'),
    });
  }

  create(): void {
    void this.router.navigate(['/admin/campsites/new']);
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/campsites', id]);
  }

  remove(row: CampsiteResponse): void {
    if (!confirm(`¿Eliminar «${row.name}»?`)) {
      return;
    }
    this.api.delete(row.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.toast.success('Camping eliminado.');
          this.reload();
        }
      },
      error: () => this.toast.danger('No se pudo eliminar el camping.'),
    });
  }

  locationSummary(r: CampsiteResponse): string {
    return `P${r.idProvincia} · C${r.idCanton} · D${r.idDistrito}`;
  }
}
