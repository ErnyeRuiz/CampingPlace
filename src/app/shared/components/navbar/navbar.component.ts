import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { AppBranding } from '../../../core/branding/app-branding';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/http/auth.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { APP_HOME_PATH } from '../../../core/constants/permissions';

interface NavItem {
  labelKey: string;
  routerLink: string;
  fragment?: string;
  routerLinkActive: string;
  routerLinkActiveOptions: { exact: boolean };
  class: string;
}

@Component({
  selector: 'cp-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {

  /** Listado público principal; marca + Nav Inicio/Explorar. */
  protected readonly appHomePath = APP_HOME_PATH;

  protected readonly authService  = inject(AuthService);
  protected readonly authz        = inject(AuthorizationService);
  protected readonly themeService = inject(ThemeService);
  protected readonly languageService = inject(LanguageService);
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

  /** Wordmark: hero o fondo oscuro → marca clara; tarjeta clara → marca oscura. */
  readonly brandLogoSrc = computed(() => {
    if (this.transparentAtTop()) {
      return AppBranding.wordmarkOnDarkBg;
    }
    return this.themeService.isDark()
      ? AppBranding.wordmarkOnDarkBg
      : AppBranding.wordmarkOnLightBg;
  });

  /** Whether the navbar is transparent at the top of the page */
  readonly transparentAtTop = computed(() => {
    if (this.scrolled() || this.menuOpen()) {
      return false;
    }
    if (this.themeService.isDark()) {
      return true;
    }
    return this.routePath() === APP_HOME_PATH;
  });

  /** Normalize the path by removing the query and hash */
  private static normalizePath(url: string): string {
    const noQuery = url.split('?')[0] ?? url;
    return (noQuery.split('#')[0] ?? noQuery) || '/';
  }

  protected readonly items: NavItem[] = [
    {
      labelKey: 'nav.home',
      routerLink: APP_HOME_PATH,
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-home mr-1',
    },
    {
      labelKey: 'nav.explore',
      routerLink: APP_HOME_PATH,
      fragment: 'explorar',
      routerLinkActive: 'active',
      routerLinkActiveOptions: { exact: false },
      class: 'fas fa-list mr-1',
    },
    // {
    //   labelKey: 'nav.map',
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
    this.closeMenu();
    this.authService.logout().subscribe(() => {
      void this.router.navigate([this.appHomePath], { replaceUrl: true });
    });
  }

  protected navItemTrackId(item: NavItem): string {
    return `${item.routerLink}_${item.fragment ?? ''}`;
  }
}
