# CampingPlace — Web App

Aplicación web para encontrar y explorar lugares de camping en Costa Rica. Parte del portafolio **CampingCore**.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 21 (standalone components + signals donde aplica) |
| UI | Angular Material 3, Bootstrap 4 |
| i18n | Transloco (`public/i18n/`) |
| Estilos | SCSS |
| API | .NET REST (CampingCore) |
| Linting | angular-eslint 21 |

## Arquitectura

```
src/app/
├── core/
│   ├── guards/           # auth, admin-section
│   ├── interceptors/     # Bearer token + feedback HTTP
│   ├── i18n/             # TranslocoHttpLoader
│   ├── models/           # tipos compartidos
│   └── services/         # lógica y estado reutilizable
├── layouts/
│   ├── public-layout/    # shell público
│   └── admin-layout/    # shell administración
├── features/
│   ├── admin/           # gestión roles, permisos, usuarios, campsites (lazy)
│   ├── auth/            # login, registro (lazy)
│   ├── home/            # listado campings (lazy)
│   ├── camping-detail/, map-view/, trips/, profile, etc.
├── shared/components/    # navbar, admin-navbar, footer, toast, loader, …
├── app.routes.ts
└── app.config.ts
public/
├── i18n/                 # es.json, en.json
└── manifest.webmanifest  # PWA liviana
```

## Requisitos

- Node.js 22+
- npm 10+

## Configuración local

### Dependencias

```bash
npm install
```

### API (desarrollo)

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7061/api'
};
```

La compilación **producción** reemplaza este archivo por `src/environments/environment.prod.ts` (ver `angular.json` → `fileReplacements`). Ajusta ahí la URL pública HTTPS de la API antes de desplegar.

La API CampingCore suele vivir junto al monorepo, por ejemplo: [CampingCore API](../../../API/)

### Servidor de desarrollo

```bash
npm start
```

Abre `http://localhost:4200/` (la raíz redirige a `/campings`).

### Build de producción

```bash
npm run build
```

La configuración por defecto del proyecto es **production**. La salida queda en `dist/CampingPlace/browser` (SPA estático). El hosting debe resolver rutas profundas con **fallback a `index.html`** y el backend debe exponer **CORS** para el origen público del front.

## Rutas públicas principales

| Ruta | Descripción |
|------|-------------|
| `/campings` | Listado / home |
| `/campings/:id` | Detalle de un lugar |
| `/map` | Vista de mapa (pendiente de integración; sin widget embebido) |
| `/auth/login`, `/auth/register` | Autenticación |
| `/trips`, `/trips/:id` | Viajes |
| `/profile` | Perfil (requiere sesión) |
| `/forgot-password`, `/reset-password`, `/verify-email` | Flujos de cuenta |

## Administración

| Ruta | Descripción |
|------|-------------|
| `/admin/...` | Panel (roles, permisos, usuarios, campsites). Requiere sesión y permisos de administración. |

## Scripts npm

| Comando | Uso |
|---------|-----|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build producción → `dist/CampingPlace/browser` |
| `npm run watch` | Build development en modo watch |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run lint` | ESLint Angular |

## Patrones Angular usados

- **Standalone components** sin NgModules
- **Signals** donde el estado encaja bien con `signal()` / `computed()`
- **Lazy loading** por feature (`loadChildren`, `loadComponent`)
- **`withComponentInputBinding()`** en el router para parámetros de ruta como inputs
- **`withViewTransitions()`** para transiciones entre vistas
- **`withFetch()`** en `provideHttpClient` para peticiones HTTP
- **Interceptors funcionales** (`HttpInterceptorFn`)
