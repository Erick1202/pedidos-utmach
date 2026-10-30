# Tareas 005 — Seguimiento del estado de los pedidos

**Issue:** #6
**Rama:** `005-estado-pedidos`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, regla pura y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — regla pura (TDD)

- [x] `test:` prueba en rojo de `siguienteEstado` (CA-01).
- [x] `feat:` implementar `siguienteEstado` (CA-01).
- [x] `refactor:` derivar el tipo `EstadoPedido` de `ESTADOS_PEDIDO` (CA-01).

## C. Backend — endpoints

- [x] Esquemas zod de `limite` y `fecha`, y `rangoDiaEcuador` (CA-02, CA-03).
- [x] `GET /api/pedidos/mios` con `ix_usuario_fecha` (CA-02).
- [x] `GET /api/pedidos/activos` con `ix_estado_hora` y filtro por fecha (CA-03).
- [x] `PATCH /api/pedidos/:id/estado` con `updateOne` condicional y 409 (CA-04, CA-06, CA-07).
- [x] Pruebas de integración: permisos, orden, aislamiento, secuencia, concurrencia y validador (CA-02 a CA-08).

## D. Frontend

- [x] `PedidosService` (`misPedidos`, `activos`, `avanzarEstado`) con pruebas.
- [x] Utilidades de estados y `pedidosQuePasaronAListo` con pruebas (CA-09, CA-11).
- [x] Página «Mis pedidos» con sondeo, colores y línea de tiempo (CA-09, CA-13).
- [x] Enlace en la navbar y redirección tras confirmar (CA-10).
- [x] Tablero «Pedidos activos» con filtro, botones y manejo del 409 (CA-11, CA-12, CA-13).

## E. Verificación y cierre

- [x] Lint, pruebas y build del backend; pruebas y build del frontend (CA-14).
- [x] Prueba real con el administrador: avanzar un pedido y verificar `historialEstados` con el driver (CA-14).
- [x] Actualizar `README.md`, `specs/README.md` y `docs/`.

## Resultados de la verificación

- Ciclo TDD en el historial: `test:` (rojo, 7 pruebas fallan porque `siguienteEstado` no existe) → `feat:` (verde, 25/25) → `refactor:` (tipo `EstadoPedido` derivado de `ESTADOS_PEDIDO`).
- Backend: `npm run lint` sin advertencias, `npm test` **9 archivos / 144 pruebas** en verde (22 nuevas de integración en `pedidos.estado.test.ts`, con `explain` que confirma `ix_usuario_fecha` e `ix_estado_hora`, y la carrera de dos `PATCH` resuelta como `[200, 409]` de forma determinista) y `npm run build` sin errores.
- Frontend: `npm run build` sin errores y `npm test -- --watch=false` **11 archivos / 48 pruebas** en verde.
- Base real (API en un puerto alterno): el administrador vio los 3 pedidos activos ordenados por hora de recogida (María Castillo «preparando», Carlos Pineda «recibido» y el pedido de Ana Torres de la fase 4). `PATCH` sobre el pedido `64f000000000000000000014` lo pasó a «preparando»; con el driver, `historialEstados` creció de **1 a 2** con `fecha` de tipo `Date` y `pedidos` siguió en 41. Id inválido → 400, inexistente → 404, pedido entregado → 409 y estudiante en `/activos` → 403.
