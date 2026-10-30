# Tareas 002 — Autenticación y roles

**Issue:** #3
**Rama:** `002-autenticacion`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, arquitectura y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — contrato y persistencia

- [ ] Adaptar `crearApp(db, { jwtSecret })` y actualizar las pruebas de la fase 1.
- [ ] Crear esquemas zod de registro y login (`.strict()`, correo en minúsculas, contraseña 8–72).
- [ ] Implementar registro con hash `bcryptjs` coste 10, rol forzado y `creadoEn`.
- [ ] Implementar login con comparación de hash y mensaje genérico de error.
- [ ] Implementar perfil desde MongoDB sin `passwordHash`.
- [ ] Firmar y verificar JWT HS256 de 8 horas con `_id`, `nombre` y `rol`.
- [ ] Implementar `crearAutenticacion` y `autorizarPorRol`.
- [ ] Declarar `req.usuario` y montar `/api/auth`.

## C. Backend — pruebas

- [ ] Agregar `SECRETO_PRUEBAS` al helper.
- [ ] Probar registro exitoso, hash, rol forzado y correo en minúsculas.
- [ ] Probar correo duplicado (409), validaciones (400) y campo `rol` rechazado.
- [ ] Probar login del admin y de Ana con los hashes reales.
- [ ] Probar credenciales incorrectas (401 genérico).
- [ ] Probar perfil con token, sin token, con token inválido y expirado.
- [ ] Probar `autorizarPorRol` (403 para estudiante, acceso para admin).
- [ ] Ejecutar lint, pruebas y build del backend.

## D. Frontend — proyecto Angular

- [ ] Generar Angular 22 standalone con routing, Tailwind v4 y Vitest en `frontend/`.
- [ ] Configurar `src/environments/environment.ts` con la URL de la API.
- [ ] Definir el modelo `Usuario` y la paleta UTMACH en `styles.css`.
- [ ] Actualizar `index.html` (idioma, título y viewport).

## E. Frontend — autenticación

- [ ] Crear `TokenStorageService` con las claves del proyecto.
- [ ] Crear `AuthService` con signals, login, registro, perfil y logout.
- [ ] Crear el interceptor JWT.
- [ ] Crear `authGuard` y `adminGuard`.
- [ ] Restaurar la sesión con `provideAppInitializer`.
- [ ] Crear la pantalla de login (validaciones, carga, error, credenciales de prueba).
- [ ] Crear la pantalla de registro (validaciones, carga, error).
- [ ] Crear `Layout` con navbar por rol y cierre de sesión.
- [ ] Crear marcadores de `/menu` y `/admin`.
- [ ] Configurar rutas y redirecciones por rol.

## F. Verificación y cierre

- [ ] `npm run build --prefix frontend` sin errores.
- [ ] `npm test --prefix frontend -- --watch=false` en verde.
- [ ] Verificar login real del admin y de Ana contra la base existente.
- [ ] Verificar recarga de sesión, logout y acceso denegado a `/admin` como estudiante.
- [ ] Actualizar `README.md` y `specs/README.md`.
- [ ] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #3.
