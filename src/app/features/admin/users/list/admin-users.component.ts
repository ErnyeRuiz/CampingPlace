import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserSystemResponse } from '../../../../core/models/user/user-system-response';
import { UserService } from '../../../../core/services/http/user.service';

@Component({
  selector: 'cp-admin-users',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(UserService);
  private readonly router = inject(Router);

  readonly rows = signal<UserSystemResponse[]>([]);

  readonly loading = this.api.loading;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: (list) => this.rows.set(list),
    });
  }

  edit(id: number): void {
    void this.router.navigate(['/admin/users', id]);
  }
}
