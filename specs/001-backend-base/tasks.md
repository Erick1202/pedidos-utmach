# Tareas 001 — Backend base

**Issue:** #2
**Rama:** `001-backend-base`
**Estado:** ✅ Completada

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

- [x] Crear `backend/package.json` con scripts `dev`, `build`, `start`, `lint`, `test`.
- [x] Configurar TypeScript estricto (`tsconfig.json` y `tsconfig.build.json`).
- [x] Configurar ESLint con typescript-eslint y `--max-warnings 0`.
- [x] Configurar Vitest (entorno Node, sin paralelismo entre archivos).
- [x] Crear `backend/.env.example` y `backend/.env` local (ignorado por Git).
- [x] Validar variables de entorno con zod y mensajes en español.

## C. Conexión a MongoDB

- [x] Implementar `conectarBaseDeDatos` con `ping` y `serverSelectionTimeoutMS`.
- [x] Implementar `contarDocumentos` para las cuatro colecciones.
- [x] Registrar en el arranque la base conectada y los conteos.
- [x] Implementar apagado ordenado (SIGINT/SIGTERM) cerrando cliente y servidor.
- [x] Crear `GET /api/salud` con conteos reales.

## D. Manejo de errores

- [x] Crear `ErrorAplicacion` con código HTTP y mensaje.
- [x] Implementar `traducirError` (zod, 121, 11000, JSON inválido, desconocido).
- [x] Implementar middleware 404 en JSON.
- [x] Implementar middleware central de errores sin filtrar trazas.
- [x] Configurar CORS para `http://localhost:4200`.
- [x] Configurar `express.json` con límite y `x-powered-by` desactivado.

## E. Pruebas

- [x] Crear helper `tests/helpers/base.ts` con `mongodb-memory-server`.
- [x] Copiar validadores `$jsonSchema` e índices exactos en `tests/helpers/esquema.ts`.
- [x] Insertar fixtures mínimos con `_id` deterministas y hashes reales.
- [x] Probar `GET /api/salud` (200 + conteos).
- [x] Probar 404, `ErrorAplicacion`, zod, 121, 11000 y JSON malformado.
- [x] Probar que el validador rechaza cantidad 0 y precio negativo.
- [x] Probar que `ux_email` impide correos duplicados.
- [x] Verificar que la suite no usa `127.0.0.1:27017`.

## F. Verificación y cierre

- [x] `npm run lint` sin errores ni advertencias.
- [x] `npm test` en verde (14 pruebas, 3 archivos).
- [x] `npm run build` sin errores.
- [x] Arrancar contra la base real y confirmar conteos 6/4/12/40.
- [x] Revisar que no se modificó la base (solo lecturas).
- [x] Actualizar el estado de la fase en `README.md` y `specs/README.md`.
- [x] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #2.

## Resultado de la verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias. |
| `npm test` | 3 archivos, 14 pruebas en verde. |
| `npm run build` | Compila sin errores en `dist/`. |
| `GET /api/salud` contra la base real | 200 con `usuarios: 6`, `categorias: 4`, `productos: 12`, `pedidos: 40`. |
| Base local | Solo `ping` y `countDocuments`; no se creó ni modificó nada. |
