# Tareas 002 — Autenticación y roles

**Issue:** #3
**Rama:** `002-autenticacion`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, arquitectura y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — contrato y persistencia

- [x] Adaptar `crearApp(db, { jwtSecret })` y actualizar las pruebas de la fase 1.
- [x] Crear esquemas zod de registro y login (`.strict()`, correo en minúsculas, contraseña de 8–72 con mayúscula, minúscula, número y símbolo).
- [x] Implementar registro con hash `bcryptjs` coste 10, rol forzado y `creadoEn`.
- [x] Implementar login con comparación de hash y mensaje genérico de error.
- [x] Implementar perfil desde MongoDB sin `passwordHash`.
- [x] Firmar y verificar JWT HS256 de 8 horas con `_id`, `nombre` y `rol`.
- [x] Implementar `crearAutenticacion` y `autorizarPorRol`.
- [x] Declarar `req.usuario` y montar `/api/auth`.

## C. Backend — pruebas

- [x] Agregar `SECRETO_PRUEBAS` al helper.
- [x] Probar registro exitoso, hash, rol forzado y correo en minúsculas.
- [x] Probar correo duplicado (409), validaciones (400) y campo `rol` rechazado.
- [x] Probar contraseña débil sin mayúscula, número o símbolo (400).
- [x] Probar login del admin y de Ana con los hashes reales.
- [x] Probar credenciales incorrectas (401 genérico).
- [x] Probar perfil con token, sin token, con token inválido y expirado.
- [x] Probar `autorizarPorRol` (403 para estudiante, acceso para admin).
- [x] Ejecutar lint, pruebas y build del backend.

## D. Frontend — proyecto Angular

- [x] Generar Angular 22 standalone con routing, Tailwind v4 y Vitest en `frontend/`.
- [x] Configurar `src/environments/environment.ts` con la URL de la API.
- [x] Definir el modelo `Usuario` y la paleta UTMACH en `styles.css`.
- [x] Actualizar `index.html` (idioma, título y viewport).

## E. Frontend — autenticación

- [x] Crear `TokenStorageService` con las claves del proyecto.
- [x] Crear `AuthService` con signals, login, registro, perfil y logout.
- [x] Crear el interceptor JWT.
- [x] Crear `authGuard`, `adminGuard` y `guestGuard`.
- [x] Restaurar la sesión con `provideAppInitializer`.
- [x] Crear la pantalla de login (validaciones, carga, error, credenciales de prueba).
- [x] Crear la pantalla de registro (validaciones, carga, error).
- [x] Crear `Layout` con navbar por rol y cierre de sesión.
- [x] Crear marcadores de `/menu` y `/admin`.
- [x] Configurar rutas y redirecciones por rol.
- [x] Probar `AuthService`, los guards y el interceptor con Vitest.

## F. Verificación y cierre

- [x] `npm run build --prefix frontend` sin errores.
- [x] `npm test --prefix frontend -- --watch=false` en verde.
- [x] Verificar login real del admin y de Ana contra la base existente.
- [x] Verificar recarga de sesión, logout y acceso denegado a `/admin` como estudiante.
- [x] Actualizar `README.md` y `specs/README.md`.
- [x] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #3.
