import { Component, HostListener, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'cp-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  protected readonly items: { 
    label: string, 
    routerLink: string, 
    routerLinkActive: string, 
    icon: string, 
    routerLinkActiveOptions: { exact: boolean },
    class: string,
  }[] = [
    {
      label: 'Inicio',
      routerLink: '/campings',
      routerLinkActive: 'active',
      icon: 'fas fa-home',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-home mr-1',
    },
    {
      label: 'Explorar',
      routerLink: '/campings',
      routerLinkActive: 'active',
      icon: 'fas fa-list',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-list mr-1',
    },
    {
      label: 'Mapa',
      routerLink: '/map',
      routerLinkActive: 'active',
      icon: 'fas fa-map-marked-alt',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-map-marked-alt mr-1',
    },
    {
      label: 'Idioma',
      routerLink: '/idioma',
      routerLinkActive: 'active',
      icon: 'fas fa-language',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-language mr-1',
    },
    {
      label: 'Perfil',
      routerLink: '/perfil',
      routerLinkActive: 'active',
      icon: 'fas fa-user',
      routerLinkActiveOptions: { exact: true },
      class: 'fas fa-user mr-1',
    },
  ];
  
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 80);
    if (window.scrollY > 80) {
      this.menuOpen.set(false);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
