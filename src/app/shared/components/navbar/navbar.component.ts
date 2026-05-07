import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/http/auth.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  label: string;
  routerLink: string;
  fragment?: string;
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
  protected readonly authz        = inject(AuthorizationService);
  protected readonly themeService = inject(ThemeService);
  private  readonly router        = inject(Router);

  /**
   * Ruta actual sin query/hash. Hace falta como signal para que `transparentAtTop` se recalcule
   * al navegar (Router.url por sí solo no dispara change detection en el computed).
   */
  private readonly routePath = signal(NavbarComponent.normalizePath(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.routePath.set(NavbarComponent.normalizePath(this.router.url)));
  }

  /** Whether the navbar is transparent at the top of the page */
  readonly transparentAtTop = computed(() => {
    if (this.scrolled() || this.menuOpen()) {
      return false;
    }
    if (this.themeService.isDark()) {
      return true;
    }
    return this.routePath() === '/campings';
  });

  /** Normalize the path by removing the query and hash */
  private static normalizePath(url: string): string {
    const noQuery = url.split('?')[0] ?? url;
    return (noQuery.split('#')[0] ?? noQuery) || '/';
  }

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
      fragment: 'explorar',
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: false },
      class: 'fas fa-list mr-1',
    },
    // {
    //   label: 'Mapa',
    //   routerLink: '/map',
    //   routerLinkActive: 'active',
    //   routerLinkActiveOptions: { exact: true },
    //   class: 'fas fa-map-marked-alt mr-1',
    // },
  ];

  readonly scrolled  = signal(false);
  readonly menuOpen  = signal(false);

  /** Pasado este píxel de scroll la barra pasa a sólida (mejor legibilidad al salir del hero). */
  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 80);
    if (window.scrollY > 80) this.menuOpen.set(false);
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu():  void { 
    this.menuOpen.set(false); 
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/campings']);
  }
}
