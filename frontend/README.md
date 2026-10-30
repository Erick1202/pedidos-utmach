# PedidosUTMACH — Frontend

Aplicación Angular 22 del proyecto PedidosUTMACH. Usa componentes standalone, signals, Router, HttpClient con interceptor JWT, guards por rol y Tailwind CSS v4.

## Requisitos

- Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`.
- Backend de PedidosUTMACH corriendo en `http://localhost:3000/api`.

## Comandos

```powershell
npm install
npm start
npm run build
npm test -- --watch=false
```

La aplicación se sirve en <http://localhost:4200>.

## Configuración

La URL de la API está en [`src/environments/environment.ts`](src/environments/environment.ts):

```ts
export const environment = {
  produccion: false,
  apiUrl: 'http://localhost:3000/api',
} as const;
```

## Estructura

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/          # sesión, almacenamiento del token, interceptor y guards
│   │   ├── http/          # mensajes de error de la API
│   │   └── models/        # Usuario, credenciales y respuestas
│   ├── features/
│   │   ├── auth/          # pantallas de login y registro
│   │   ├── menu/          # marcador de la fase 3
│   │   └── admin/         # marcador de la fase 5
│   ├── layout/            # navbar y contenedor de rutas protegidas
│   ├── app.config.ts
│   └── app.routes.ts
└── environments/
```

## Sesión

- El token y el usuario se guardan en `localStorage` bajo `pedidos_utmach_token` y `pedidos_utmach_usuario`.
- Al arrancar, la aplicación valida el token contra `GET /api/auth/perfil`.
- El interceptor agrega `Authorization: Bearer <token>` solo a las peticiones de la API.
- `/menu` requiere sesión; `/admin` requiere rol `admin`.
- Al cerrar sesión se limpia el almacenamiento y se vuelve a `/login`.

## Usuarios de prueba

| Rol           | Correo                        | Contraseña       |
| ------------- | ----------------------------- | ---------------- |
| Administrador | `admin@utmachala.edu.ec`      | `Admin123*`      |
| Estudiante    | `ana.torres@utmachala.edu.ec` | `Estudiante123*` |

Las credenciales también aparecen en la pantalla de login para facilitar la evaluación.
