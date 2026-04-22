# CampingPlace — Web App

Aplicación web para encontrar y explorar lugares de camping en Costa Rica. Parte del portafolio **CampingCore**.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (Standalone Components + Signals) |
| UI | Angular Material 3 |
| Mapas | @angular/google-maps |
| Estilos | SCSS |
| API | .NET 8 REST API |
| Linting | angular-eslint 21 |

## Arquitectura

```
src/app/
├── core/
│   ├── models/          # Interfaces TypeScript (Camping, CampingFilter, etc.)
│   ├── services/        # CampingService con Signals API
│   └── interceptors/    # authInterceptor (Bearer token)
├── features/
│   ├── camping-list/    # Listado con filtros — lazy loaded
│   ├── camping-detail/  # Detalle de lugar — lazy loaded
│   └── map-view/        # Vista de mapa con pins — lazy loaded
└── shared/
    ├── components/      # Componentes reutilizables
    ├── pipes/
    └── directives/
```

## Configuración local

### Requisitos

- Node 22+
- npm 10+

### Instalar dependencias

```bash
npm install
```

### Configurar API

Edita `src/environments/environment.ts` y actualiza la URL de la API:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  googleMapsApiKey: 'TU_CLAVE_AQUI'
};
```

La API .NET 8 se encuentra en: [CampingCore API](../../../API/)

### Iniciar servidor de desarrollo

```bash
npm start
```

Navega a `http://localhost:4200`.

### Build de producción

```bash
npm run build
```

## Rutas

| Ruta | Feature |
|---|---|
| `/campings` | Listado de lugares con filtros |
| `/campings/:id` | Detalle de un lugar |
| `/map` | Vista de mapa interactivo |

## Patrones Angular modernos usados

- **Standalone components** sin NgModules
- **Signals** (`signal()`, `computed()`) para estado reactivo en servicios y componentes
- **Lazy loading** de rutas por feature
- **`input.required()`** para pasar parámetros de ruta a componentes
- **`withComponentInputBinding()`** en el router para binding automático de params
- **`withViewTransitions()`** para animaciones de navegación
- **Functional interceptors** (`HttpInterceptorFn`)
