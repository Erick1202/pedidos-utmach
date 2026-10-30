# Plan técnico 002 — Autenticación y roles

**Issue:** #3
**Rama:** `002-autenticacion`

## Objetivo

Implementar registro, login, perfil y autorización por rol en el backend, y las pantallas de acceso con guards e interceptor en Angular, respetando los usuarios y hashes existentes. El resultado debe permitir que el administrador y Ana Torres inicien sesión con sus credenciales reales.

## Backend

### 1. Contrato de la API

Todas las rutas llevan el prefijo `/api/auth`.

| Método | Ruta | Autenticación | Cuerpo | Respuesta |
| --- | --- | --- | --- | --- |
| `POST` | `/registro` | Pública | `{ nombre, email, password }` | `201 { token, usuario }` |
| `POST` | `/login` | Pública | `{ email, password }` | `200 { token, usuario }` |
| `GET` | `/perfil` | Bearer JWT | — | `200 { usuario }` |

`usuario` es siempre público:

```json
{
  "_id": "64a100000000000000000001",
  "nombre": "Ana Torres",
  "email": "ana.torres@utmachala.edu.ec",
  "rol": "estudiante",
  "creadoEn": "2026-10-02T14:00:00.000Z"
}
```

### 2. Validación con zod

- `nombre`: string recortado, mínimo 3, máximo 100.
- `email`: string recortado, formato de correo, transformado a minúsculas.
- `password`: string de 8 a 72 caracteres (bcrypt usa como máximo 72 bytes).
- Los esquemas son `.strict()`: enviar `rol`, `passwordHash` o campos desconocidos devuelve `400`.
- Login: correo válido y contraseña no vacía; **no** se recorta la contraseña.

Los errores de zod se traducen con el middleware de la fase 1 (`400`, `Datos inválidos`).

### 3. Persistencia

- Colección `usuarios` con el validador existente.
- Registro: `_id: new ObjectId()`, `passwordHash: await bcrypt.hash(password, 10)`, `rol: "estudiante"`, `creadoEn: new Date()`.
- Antes de insertar se busca el correo para responder `409` sin gastar el hash; si hay una carrera, el índice `ux_email` produce `11000` y el middleware central lo traduce igual.
- Login: `findOne({ email })` y `bcrypt.compare`. Si falla cualquiera de los dos, `ErrorAplicacion(401, "Correo o contraseña incorrectos")`.
- Perfil: `findOne({ _id: new ObjectId(id) })`; si el usuario ya no existe, `401 "La sesión ya no es válida"`.

### 4. JWT

```ts
jwt.sign(
  { _id: usuario._id.toHexString(), nombre: usuario.nombre, rol: usuario.rol },
  jwtSecret,
  { algorithm: "HS256", expiresIn: 8 * 60 * 60 }
);
```

- El secreto **no** se importa dentro de la app: `crearApp(db, { jwtSecret })` lo recibe.
- `server.ts` pasa `entorno.JWT_SECRET`.
- Las pruebas pasan un secreto propio, sin leer `.env`.
- La verificación valida firma y algoritmo; además, un esquema zod comprueba que el payload tenga `_id`, `nombre` y rol válido. Cualquier fallo produce `401 "Token inválido o expirado"`.

### 5. Middlewares

- `crearAutenticacion(jwtSecret)`: exige `Authorization: Bearer <token>`, valida el JWT y deja `req.usuario = { _id, nombre, rol }`.
- `autorizarPorRol(...roles)`: responde `401` si no hay usuario y `403 "No tienes permisos para realizar esta acción"` si el rol no está permitido. En esta fase se prueba con una ruta de prueba; las rutas reales de admin llegan en las fases 3 a 6.
- Se declara `Express.Request.usuario` en `src/types/express.d.ts`.

### 6. Estructura

```text
backend/src/
├── middleware/
│   ├── autenticacion.ts          # crearAutenticacion + autorizarPorRol
│   └── ...
├── modules/auth/
│   ├── auth.routes.ts            # POST /registro, POST /login, GET /perfil
│   ├── auth.schemas.ts           # zod
│   └── auth.service.ts           # hash, login, token, perfil
├── types/
│   └── express.d.ts              # req.usuario
└── app.ts                        # crearApp(db, { jwtSecret })
```

`app.ts` agrega `app.use("/api/auth", crearRutasAuth(db, jwtSecret))`. La ruta de salud no cambia.

### 7. Respuestas de error nuevas

| Situación | HTTP | Mensaje |
| --- | --- | --- |
| Credenciales incorrectas | 401 | `Correo o contraseña incorrectos` |
| Token ausente | 401 | `Token de autenticación requerido` |
| Token inválido o expirado | 401 | `Token inválido o expirado` |
| Usuario del token ya no existe | 401 | `La sesión ya no es válida` |
| Rol no autorizado | 403 | `No tienes permisos para realizar esta acción` |

### 8. Pruebas del backend

Se amplía el helper existente con un `SECRETO_PRUEBAS` y se agrega `tests/auth.test.ts`:

1. Registro exitoso: `201`, correo en minúsculas, rol forzado, hash bcrypt verificable, sin `passwordHash` en la respuesta.
2. Correo duplicado: `409` exacto.
3. Cuerpo inválido y campo `rol`: `400` con detalles.
4. Login del admin y de Ana con los hashes reales del script: `200`, token decodificable con `_id`, `nombre`, `rol` y `exp` ~8 h.
5. Contraseña incorrecta y correo inexistente: `401` con el mismo mensaje.
6. Perfil con token: `200` sin `passwordHash`.
7. Perfil sin token, con token inválido y con token expirado: `401`.
8. `autorizarPorRol("admin")`: estudiante recibe `403`; admin pasa.

Se actualizan `salud.test.ts` y `errores.test.ts` para el nuevo parámetro `crearApp(db, { jwtSecret })`.

## Frontend

### 9. Creación del proyecto Angular

Se genera el workspace dentro de `frontend/` con Angular CLI 22.2.3:

```powershell
npx @angular/cli@22.2.3 new pedidos-utmach --directory frontend --routing --style tailwind --ssr=false --test-runner vitest --skip-git --package-manager npm --ai-config none --defaults
```

- Componentes standalone (predeterminado en Angular 22).
- Tailwind CSS v4 con `@tailwindcss/postcss`, configurado por el CLI.
- Vitest como runner de pruebas.
- Sin SSR y sin repositorio Git anidado.

### 10. Estructura del frontend

```text
frontend/src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts          # login, registro, perfil, logout
│   │   │   ├── token-storage.service.ts # localStorage
│   │   │   ├── auth.interceptor.ts      # Bearer
│   │   │   └── auth.guard.ts / admin.guard.ts
│   │   └── models/usuario.ts
│   ├── features/
│   │   ├── auth/login/login.ts + .html + .css
│   │   ├── auth/registro/registro.ts + .html + .css
│   │   ├── menu/menu.ts                  # marcador de la fase 3
│   │   └── admin/admin.ts                # marcador de la fase 5
│   ├── layout/layout.ts + .html          # navbar + router-outlet
│   ├── app.ts / app.html / app.css
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/environment.ts
└── styles.css
```

### 11. Sesión y seguridad en el cliente

- `TokenStorageService` usa las claves `pedidos_utmach_token` y `pedidos_utmach_usuario`.
- `AuthService` expone `usuario`, `autenticado`, `esAdmin` como signals y `login`, `registrar`, `cerrarSesion`, `restaurarSesion`.
- `provideAppInitializer` ejecuta `restaurarSesion()` antes de activar rutas: si hay token, llama a `/auth/perfil`; si falla, limpia la sesión.
- `authInterceptor` lee el token del almacenamiento y agrega `Authorization: Bearer`; no usa `AuthService`, evitando dependencias circulares con `HttpClient`.
- `authGuard` exige sesión; `adminGuard` exige rol `admin` y redirige a `/menu` si es estudiante.
- El interceptor no adjunta el token a las llamadas de login/registro si no existe.

### 12. Rutas

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/login` | Login | Pública |
| `/registro` | Registro | Pública |
| `/menu` | Marcador de menú | `authGuard` |
| `/admin` | Marcador de admin | `authGuard` + `adminGuard` |
| `/` y `**` | Redirección a `/menu` | — |

`/menu` y `/admin` viven dentro de un `Layout` con navbar, nombre del usuario, rol y botón «Cerrar sesión».

### 13. Experiencia de usuario

- Diseño mobile-first: fondo azul UTMACH, tarjeta blanca, logo tipográfico y acentos amarillos.
- Formularios reactivos con validaciones en español, `aria` y estados de carga.
- Mensajes de error de la API visibles en un bloque de alerta.
- Credenciales de prueba visibles en el login para facilitar la evaluación.
- Después del login: `admin → /admin`, `estudiante → /menu`. Después del registro: sesión automática y `/menu`.
- Navbar con enlaces «Menú», «Administración» (solo admin), nombre, rol y cierre de sesión.

### 14. Pruebas y compilación del frontend

- `npm run build` debe generar el bundle de producción.
- `npm test -- --watch=false` debe pasar con la prueba base del componente raíz (ajustada a la nueva plantilla) y, si aporta, una prueba del almacenamiento del token.
- La verificación funcional se hace con el backend real y los usuarios existentes: login de admin y de Ana, recarga de la página, cierre de sesión y acceso denegado a `/admin` con rol estudiante.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Dependencia circular `HttpClient → interceptor → AuthService`. | El interceptor usa `TokenStorageService`, que no depende de `HttpClient`. |
| El guard se ejecuta antes de restaurar la sesión. | `provideAppInitializer` espera a `restaurarSesion()`. |
| Los hashes existentes no son compatibles. | Se usa `bcryptjs` con coste 10 y se prueba el login real de admin y Ana. |
| El token queda en el historial o logs. | No se imprime; solo se guarda en `localStorage`. |
| Angular 22 exige Node 24.15+ o 22.22.3+. | El equipo usa Node 24.21 y el CI fijará Node 22 actualizado en la fase 7. |
| Tailwind no procesa las plantillas. | El CLI crea la configuración con `--style tailwind`; se verifica con `npm run build`. |
| El helper de pruebas toca la base local. | Sigue usando `mongodb-memory-server`; el secreto de pruebas es local a la suite. |

## Documentación de cierre

- `README.md`: estado de la fase 2 y notas de uso del frontend.
- `specs/README.md`: estado de la especificación 002.
- `docs/README.md`: sin cambios salvo que se agregue un documento específico.
- `tasks.md`: tareas marcadas y resultados de verificación.
