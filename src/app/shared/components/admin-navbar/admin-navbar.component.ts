import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { AuthorizationService } from '../../../core/services/authorization.service';

@Component({
  selector: 'cp-admin-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss',
})
export class AdminNavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly authz = inject(AuthorizationService);
  private readonly router = inject(Router);

  protected visibleItems() {
    return this.authz.visibleAdminNavItems();
  }

  goPublic(): void {
    void this.router.navigateByUrl('/campings');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/campings');
  }
}
