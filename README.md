# CampingPlace — Web App

Aplicación web para encontrar y explorar lugares de camping en Costa Rica. Parte del portafolio **CampingCore**.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Angular 21 (standalone components + signals) |
| UI | Angular Material 3, Bootstrap 4 |
| i18n | Transloco |
| Estilos | SCSS |
| API | .NET REST (CampingCore) |

## Arquitectura

```
src/app/
├── core/
│   ├── guards/           # auth, admin-section
│   ├── interceptors/     # Bearer token + feedback HTTP
│   ├── models/           # tipos compartidos
│   └── services/         # lógica y estado reutilizable
├── layouts/
│   ├── public-layout/
│   └── admin-layout/
├── features/
│   ├── admin/            # roles, permisos, usuarios, campsites (lazy)
│   ├── auth/             # login, registro (lazy)
│   ├── home/             # listado campings (lazy)
│   └── camping-detail/, map-view/, trips/, profile/, …
└── shared/components/    # navbar, footer, toast, loader, …
```

## Ejecución local

**Requisitos:** Node.js 22+, npm 10+.

```bash
npm install
npm start
```

Abre `http://localhost:4200/` (redirige a `/campings`).

Ajusta la URL de la API en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7061/api'
};
```

## Patrones Angular

- **Standalone components** sin NgModules
- **Signals** con `signal()` / `computed()` donde aplica
- **Lazy loading** por feature (`loadChildren`, `loadComponent`)
- **Interceptors funcionales** (`HttpInterceptorFn`)
- `withComponentInputBinding()`, `withViewTransitions()`, `withFetch()`

## Licencia

MIT