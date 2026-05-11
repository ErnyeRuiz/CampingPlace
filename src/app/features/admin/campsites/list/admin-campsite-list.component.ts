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
import { CampsitesService } from '../../../../core/services/http/campsites.service';
import { CampsiteResponse } from '../../../../core/models/campsites/campsite-response';

@Component({
  selector: 'cp-admin-campsite-list',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './admin-campsite-list.component.html',
  styleUrl: './admin-campsite-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCampsiteListComponent implements OnInit {
  private readonly api = inject(CampsitesService);
  private readonly router = inject(Router);
  private readonly authz = inject(AuthorizationService);
  private readonly transloco = inject(TranslocoService);

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
    this.api.getManaged().subscribe({
      next: (list) => this.rows.set(list),
    });
  }

  create(): void {
    void this.router.navigate(['/admin/campsites/new']);
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/campsites', id]);
  }

  remove(row: CampsiteResponse): void {
    if (!confirm(this.transloco.translate('adminApp.campsites.confirmDelete', { name: row.name }))) {
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

  locationSummary(r: CampsiteResponse): string {
    return `P${r.idProvincia} · C${r.idCanton} · D${r.idDistrito}`;
  }
}
