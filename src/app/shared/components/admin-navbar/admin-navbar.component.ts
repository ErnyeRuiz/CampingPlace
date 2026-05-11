import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { ThemeService } from '../../../core/services/theme.service';

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
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  /** Menú colapsable en vista estrecha (sin depender del JS de Bootstrap). */
  protected readonly menuOpen = signal(false);

  protected visibleItems() {
    return this.authz.visibleAdminNavItems();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocKey(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') {
      return;
    }
    this.closeMenu();
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  goPublic(): void {
    this.closeMenu();
    void this.router.navigateByUrl('/campings');
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
    void this.router.navigateByUrl('/campings');
  }
}
