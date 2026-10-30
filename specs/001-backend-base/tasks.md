# Tareas 001 — Backend base

**Issue:** #2
**Rama:** `001-backend-base`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Preparación documental

- [x] Leer `database/pedidos_utmach.js` y `database/consultas_pedidos_utmach.js` completos.
- [x] Versionar `database/` en el primer commit de la fase.
- [x] Escribir `specs/001-backend-base/spec.md` (HU-B01 a HU-B03, CA-01 a CA-12).
- [x] Escribir `specs/001-backend-base/plan.md` (decisiones, contratos, riesgos).
- [x] Escribir esta lista de tareas.
- [x] Redactar `docs/modelo-datos.md` a partir del script real, con diagrama Mermaid y comparación relacional.
- [x] Ajustar `README.md` (integrantes, base existente, Studio 3T, usuarios, estructura).
- [x] Ajustar `specs/constitution.md` (base existente, `bcryptjs` coste 10, pruebas con validadores).
- [x] Actualizar `docs/README.md` y quitar `db:setup`/`seed` del `package.json` raíz.

## B. Andamiaje del backend

- [ ] Crear `backend/package.json` con scripts `dev`, `build`, `start`, `lint`, `test`.
- [ ] Configurar TypeScript estricto (`tsconfig.json` y `tsconfig.build.json`).
- [ ] Configurar ESLint 9 con typescript-eslint y `--max-warnings 0`.
- [ ] Configurar Vitest (entorno Node, sin paralelismo entre archivos).
- [ ] Crear `backend/.env.example` y `backend/.env` local (ignorado por Git).
- [ ] Validar variables de entorno con zod y mensajes en español.

## C. Conexión a MongoDB

- [ ] Implementar `conectarBaseDeDatos` con `ping` y `serverSelectionTimeoutMS`.
- [ ] Implementar `contarDocumentos` para las cuatro colecciones.
- [ ] Registrar en el arranque la base conectada y los conteos.
- [ ] Implementar apagado ordenado (SIGINT/SIGTERM) cerrando cliente y servidor.
- [ ] Crear `GET /api/salud` con conteos reales.

## D. Manejo de errores

- [ ] Crear `ErrorAplicacion` con código HTTP y mensaje.
- [ ] Implementar `traducirError` (zod, 121, 11000, JSON inválido, desconocido).
- [ ] Implementar middleware 404 en JSON.
- [ ] Implementar middleware central de errores sin filtrar trazas.
- [ ] Configurar CORS para `http://localhost:4200`.
- [ ] Configurar `express.json` con límite y `x-powered-by` desactivado.

## E. Pruebas

- [ ] Crear helper `tests/helpers/base.ts` con `mongodb-memory-server`.
- [ ] Copiar validadores `$jsonSchema` e índices exactos en `tests/helpers/esquema.ts`.
- [ ] Insertar fixtures mínimos con `_id` deterministas y hashes reales.
- [ ] Probar `GET /api/salud` (200 + conteos).
- [ ] Probar 404, `ErrorAplicacion`, zod, 121, 11000 y JSON malformado.
- [ ] Probar que el validador rechaza cantidad 0 y precio negativo.
- [ ] Probar que `ux_email` impide correos duplicados.
- [ ] Verificar que la suite no usa `127.0.0.1:27017`.

## F. Verificación y cierre

- [ ] `npm run lint` sin errores ni advertencias.
- [ ] `npm test` en verde.
- [ ] `npm run build` sin errores.
- [ ] Arrancar contra la base real y confirmar conteos 6/4/12/40.
- [ ] Revisar que no se modificó la base (solo lecturas).
- [ ] Actualizar el estado de la fase en `README.md` y `specs/README.md`.
- [ ] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #2.
