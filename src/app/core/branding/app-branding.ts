import { computed, inject, Signal } from '@angular/core';
import { ThemeService } from '../services/theme.service';

/**
 * Archivos en `public/branding` (URL absoluta desde la raíz del sitio).
 * Convención: “OnDarkBg” = marca clara sobre fondo oscuro; “OnLightBg” = marca oscura sobre fondo claro.
 */
export const AppBranding = {
  wordmarkOnDarkBg: '/branding/transparent_with_letters_light.png',
  wordmarkOnLightBg: '/branding/transparent_with_letters_dark.png',
  markOnDarkBg: '/branding/transparent_light.png',
  markOnLightBg: '/branding/transparent_dark.png',
} as const;

/** Isotipo (sin letras) en el panel izquierdo de login/registro y flujos auth: fondo oscuro. */
export const authHeroMarkUrl = AppBranding.markOnDarkBg;

/** Wordmark en pie oscuro del sitio. */
export const footerWordmarkUrl = AppBranding.wordmarkOnDarkBg;

export function injectAuthFormBrandLogoUrl(): Signal<string> {
  const theme = inject(ThemeService);
  return computed(() =>
    theme.isDark() ? AppBranding.wordmarkOnDarkBg : AppBranding.wordmarkOnLightBg,
  );
}

/** Isotipo para superficies de tarjeta (stats, placeholders) según tema. */
export function injectThemedMarkUrl(): Signal<string> {
  const theme = inject(ThemeService);
  return computed(() =>
    theme.isDark() ? AppBranding.markOnDarkBg : AppBranding.markOnLightBg,
  );
}
