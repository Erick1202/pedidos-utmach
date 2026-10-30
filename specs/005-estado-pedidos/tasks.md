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

- [ ] `PedidosService` (`misPedidos`, `activos`, `avanzarEstado`) con pruebas.
- [ ] Utilidades de estados y `pedidosQuePasaronAListo` con pruebas (CA-09, CA-11).
- [ ] Página «Mis pedidos» con sondeo, colores y línea de tiempo (CA-09, CA-13).
- [ ] Enlace en la navbar y redirección tras confirmar (CA-10).
- [ ] Tablero «Pedidos activos» con filtro, botones y manejo del 409 (CA-11, CA-12, CA-13).

## E. Verificación y cierre

- [ ] Lint, pruebas y build del backend; pruebas y build del frontend (CA-14).
- [ ] Prueba real con el administrador: avanzar un pedido y verificar `historialEstados` con el driver (CA-14).
- [ ] Actualizar `README.md`, `specs/README.md` y `docs/`.
