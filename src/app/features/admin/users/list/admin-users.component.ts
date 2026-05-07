import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserSystemResponse } from '../../../../core/models/user/user-system-response';
import { UserService } from '../../../../core/services/http/user.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'cp-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(UserService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rows = signal<UserSystemResponse[]>([]);

  readonly loading = this.api.loading;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: (list) => this.rows.set(list),
      error: () => this.toast.danger('No se pudieron cargar los usuarios.'),
    });
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/users', id]);
  }
}
