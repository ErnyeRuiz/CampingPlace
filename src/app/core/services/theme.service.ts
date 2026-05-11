import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'cp_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(dark);
    this.applyTheme(dark);
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.applyTheme(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
