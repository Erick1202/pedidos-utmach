# Especificación 002 — Autenticación y roles

**Issue:** #3
**Rama:** `002-autenticacion`
**Estado:** completada
**Depende de:** fase 1 (`001-backend-base`) y de los usuarios ya cargados en `pedidos_utmach`.

## Contexto

La base ya contiene un administrador y cinco estudiantes con contraseñas bcrypt `$2b$10`. Esta fase agrega el registro de estudiantes, el inicio de sesión con JWT, la consulta del perfil y la protección de rutas por rol, tanto en la API como en la aplicación Angular. No se implementan todavía el menú, el carrito ni los pedidos.

## Historias de usuario

### HU-A01 — Registro de estudiante

Como visitante, quiero crear una cuenta con mi nombre, correo y contraseña para poder pedir comida con anticipación.

### HU-A02 — Inicio de sesión

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder a las funciones de mi rol.

### HU-A03 — Sesión persistente y perfil

Como usuario autenticado, quiero que mi sesión se mantenga al recargar la página y poder consultar mis datos, para no iniciar sesión en cada visita.

### HU-A04 — Protección por rol

Como administrador, quiero que las rutas de administración estén protegidas y que un estudiante no pueda acceder a ellas.

### HU-A05 — Interfaz de acceso

Como usuario, quiero pantallas de login y registro claras, con validaciones y mensajes en español, adaptadas a mi teléfono.

## Criterios de aceptación

### CA-01 — Registro exitoso

**Dado** un cuerpo `{ nombre, email, password }` válido con un correo nuevo,
**cuando** se solicita `POST /api/auth/registro`,
**entonces** responde `201` con `{ token, usuario }`; el usuario tiene `rol: "estudiante"`, `email` en minúsculas, `creadoEn` como fecha y **no** incluye `passwordHash`.

### CA-02 — Contraseña almacenada de forma segura

**Dado** un registro exitoso,
**cuando** se consulta el documento en MongoDB,
**entonces** `passwordHash` empieza por `$2b$10$` y `bcryptjs.compare(password, passwordHash)` devuelve `true`; la contraseña original no se almacena.

### CA-03 — Correo duplicado

**Dado** un correo que ya existe,
**cuando** se intenta registrar de nuevo,
**entonces** responde `409` con `{ "error": "El correo ya está registrado" }`.

### CA-04 — Validación del registro

**Dado** un cuerpo con nombre menor a 3 caracteres, correo inválido, contraseña menor a 8 caracteres o sin mayúscula, minúscula, número y símbolo, o un campo `rol`,
**cuando** se solicita el registro,
**entonces** responde `400` con `{ error: "Datos inválidos", detalles: [...] }` y no inserta nada.

### CA-05 — Login de usuarios existentes

**Dado** el administrador `admin@utmachala.edu.ec` / `Admin123*` o la estudiante `ana.torres@utmachala.edu.ec` / `Estudiante123*`,
**cuando** se solicita `POST /api/auth/login`,
**entonces** responde `200` con un JWT y el usuario público; el token contiene `_id`, `nombre` y `rol`, y expira en 8 horas.

### CA-06 — Credenciales incorrectas

**Dado** un correo inexistente o una contraseña incorrecta,
**cuando** se solicita el login,
**entonces** responde `401` con `{ "error": "Correo o contraseña incorrectos" }`, sin revelar cuál de los dos falló.

### CA-07 — Perfil autenticado

**Dado** un JWT válido en `Authorization: Bearer <token>`,
**cuando** se solicita `GET /api/auth/perfil`,
**entonces** responde `200` con `{ usuario }` actualizado desde MongoDB y sin `passwordHash`.

### CA-08 — Token ausente, inválido o expirado

**Dado** una petición sin token, con firma inválida o con un token expirado,
**cuando** se solicita una ruta protegida,
**entonces** responde `401` con un mensaje en español.

### CA-09 — Autorización por rol

**Dado** un usuario autenticado con rol `estudiante`,
**cuando** intenta acceder a una ruta exclusiva de `admin`,
**entonces** responde `403` con `{ "error": "No tienes permisos para realizar esta acción" }`.

### CA-10 — Pantallas de login y registro

**Dado** un navegador en `http://localhost:4200`,
**cuando** se abren `/login` y `/registro`,
**entonces** se muestran formularios reactivos con validaciones en español, estado de carga, mensaje de error y diseño mobile-first con los colores azul y blanco de la UTMACH.

### CA-11 — Sesión en el frontend

**Dado** un login exitoso,
**cuando** el usuario navega o recarga la página,
**entonces** el token se conserva en `localStorage`, el interceptor lo adjunta como `Bearer` y el guard mantiene la sesión; al cerrar sesión se limpian token y usuario y se vuelve a `/login`.

### CA-12 — Guards por rol

**Dado** un visitante sin sesión,
**cuando** intenta abrir `/menu` o `/admin`,
**entonces** es redirigido a `/login`; un estudiante que intenta `/admin` es redirigido a `/menu`; un administrador puede entrar a `/admin`.

### CA-13 — Redirección posterior al acceso

**Dado** un login exitoso,
**cuando** el rol es `admin`,
**entonces** se redirige a `/admin`; si es `estudiante`, a `/menu`. Después del registro se inicia sesión automáticamente y se va a `/menu`.

### CA-14 — Calidad y pruebas

**Dado** el código de la fase,
**cuando** se ejecutan las pruebas y compilaciones,
**entonces** `npm run lint`, `npm test` (backend), `npm run build` (backend), `npm run build --prefix frontend` y `npm test --prefix frontend -- --watch=false` terminan sin errores.

## Reglas y restricciones

1. El `rol` **nunca** se toma del cliente: el registro siempre crea `estudiante`.
2. El correo se normaliza a minúsculas y se recorta antes de validar y guardar.
3. La contraseña debe tener entre 8 y 72 caracteres e incluir al menos una mayúscula, una minúscula, un número y un símbolo; se almacena solo con `bcryptjs` (coste 10) y nunca se devuelve.
4. El JWT se firma con HS256 y `JWT_SECRET`; dura 8 horas; su payload tiene `_id`, `nombre` y `rol`.
5. Las respuestas de error mantienen el formato `{ error, detalles? }` de la fase 1.
6. Los mensajes de login no distinguen entre correo inexistente y contraseña incorrecta.
7. El frontend usa la URL de la API definida en `src/environments/environment.ts`.
8. La sesión del frontend se guarda en `localStorage` bajo claves propias del proyecto; el token no se registra en consola.
9. No se modifican colecciones, validadores ni índices de `pedidos_utmach`.

## Fuera de alcance

- Recuperación o cambio de contraseña.
- Verificación de correo, refresh tokens o revocación de sesiones.
- CRUD de usuarios por parte del administrador.
- Menú, carrito, pedidos y reportes (fases 3 a 6).
- Diseño final de las pantallas internas; en esta fase solo se crean los marcadores de `/menu` y `/admin` para probar guards y redirecciones.
