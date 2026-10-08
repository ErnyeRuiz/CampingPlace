# CampingPlace

Aplicación web para encontrar y explorar lugares de camping en Costa Rica. Es el
frontend de **CampingCore**, mi API en .NET; desarrollado con asistencia de
Claude Code.

**Sitio:** https://camping-place.vercel.app

## Lo interesante

- **Standalone y signals.** Angular 21 sin NgModules; el estado reutilizable vive
  en servicios con `signal()` y `computed()`.
- **Carga por feature.** Admin, autenticación, listado y viaje se cargan bajo
  demanda con `loadChildren` y `loadComponent`.
- **Sesión sin sobresaltos.** Un interceptor funcional agrega el Bearer token y
  renueva la sesión antes de que venza; otro centraliza el feedback de errores
  HTTP.
- **Rutas protegidas.** Guards para la sesión y para la sección de admin
  (roles, permisos, usuarios y campings).
- **Bilingüe.** Español e inglés con Transloco, con selector de idioma.

## Stack

| Capa       | Tecnología                       |
| ---------- | -------------------------------- |
| Framework  | Angular 21                       |
| UI         | Angular Material 3 y Bootstrap 4 |
| i18n       | Transloco                        |
| Estilos    | SCSS                             |
| API        | .NET REST (CampingCore)          |
| Despliegue | Vercel                           |

## Arrancar

**Requisitos:** Node.js 22+ y npm 10+.

```bash
npm install
npm start        # http://localhost:4200
```

| Comando         | Qué hace                      |
| --------------- | ----------------------------- |
| `npm start`     | Servidor de desarrollo        |
| `npm run build` | Compila a `dist/CampingPlace` |
| `npm test`      | Corre los tests               |
| `npm run lint`  | Revisa el código con ESLint   |

La URL de la API se ajusta en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7061/api',
};
```

El build de producción la reemplaza por `environment.prod.ts`. La API solo
acepta peticiones desde el origen configurado en su `Frontend:BaseUrl` (CORS).

## Estructura

```
src/app/
├─ core/
│  ├─ guards/           auth, admin-section
│  ├─ interceptors/     Bearer token y feedback HTTP
│  ├─ models/           Tipos compartidos
│  └─ services/         Lógica y estado reutilizable
├─ layouts/             public-layout, admin-layout
├─ features/
│  ├─ admin/            Roles, permisos, usuarios, campsites (lazy)
│  ├─ auth/             Login, registro, recuperar contraseña (lazy)
│  ├─ home/             Listado de campings (lazy)
│  └─ camping-detail/, map-view/, trips/, profile/
└─ shared/components/   navbar, footer, toast, loader...
```

## Ramas

- `main`: producción. Lo que está publicado.
- `development`: trabajo diario. Cada push genera una URL de preview en Vercel.

## Licencia

MIT
