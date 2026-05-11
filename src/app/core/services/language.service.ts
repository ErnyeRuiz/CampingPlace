import { Injectable, DestroyRef, computed, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService, getBrowserLang } from '@jsverse/transloco';

const LANG_KEY = 'cp_lang';

export type UiLang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly transloco = inject(TranslocoService);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  readonly lang = signal<UiLang>('es');

  readonly isSpanish = computed(() => this.lang() === 'es');
  readonly isEnglish = computed(() => this.lang() === 'en');

  constructor() {
    this.applyLang(this.resolveInitialLang(), false);

    this.transloco
      .selectTranslate<string>('seo.metaDescription')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((description) => {
        if (!description?.trim()) {
          return;
        }
        this.meta.updateTag({ name: 'description', content: description });
      });
  }

  /** Idioma guardado en localStorage → idioma del navegador (`en`/`es`) → español por defecto. */
  private resolveInitialLang(): UiLang {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') {
      return saved;
    }
    const browser = getBrowserLang() ?? '';
    const primary = browser.split('-')[0]?.toLowerCase();
    return primary === 'en' ? 'en' : 'es';
  }

  setLang(lang: UiLang): void {
    if (this.lang() === lang) {
      return;
    }
    this.applyLang(lang, true);
  }

  private applyLang(lang: UiLang, persist: boolean): void {
    this.lang.set(lang);
    this.transloco.setActiveLang(lang);
    document.documentElement.setAttribute('lang', lang);
    if (persist) {
      localStorage.setItem(LANG_KEY, lang);
    }
  }
}
