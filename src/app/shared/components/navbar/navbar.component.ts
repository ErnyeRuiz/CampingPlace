import { Component, HostListener, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  label: string;
  routerLink: string;
  routerLinkActive: string;
  routerLinkActiveOptions: { exact: boolean };
  class: string;
}

@Component({
  selector: 'cp-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {

  protected readonly authService  = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private  readonly router       = inject(Router);

  protected readonly items: NavItem[] = [
    {
      label: 'Inicio',
      routerLink: '/campings',
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-home mr-1',
    },
    {
      label: 'Explorar',
      routerLink: '/campings',
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: false },
      class: 'fas fa-list mr-1',
    },
    {
      label: 'Mapa',
      routerLink: '/map',
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-map-marked-alt mr-1',
    },
  ];

  readonly scrolled  = signal(false);
  readonly menuOpen  = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 80);
    if (window.scrollY > 80) this.menuOpen.set(false);
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu():  void { this.menuOpen.set(false); }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/campings']);
  }
}
