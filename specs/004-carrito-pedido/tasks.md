# Tareas 004 — Carrito y creación de pedidos

**Issue:** #5
**Rama:** `004-carrito-pedido`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, reglas puras y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — reglas puras (TDD)

- [x] `test:` prueba en rojo de `calcularTotales` (CA-01).
- [x] `feat:` implementar `calcularTotales` (CA-01).
- [x] `test:` prueba en rojo de `validarHoraRecogida` (CA-02).
- [x] `feat:` implementar `validarHoraRecogida` con `America/Guayaquil` (CA-02).
- [ ] `test:` prueba en rojo de `validarCantidades` (CA-03).
- [ ] `feat:` implementar `validarCantidades` (CA-03).

## C. Backend — endpoint

- [ ] Esquema zod `.strict()` del cuerpo (CA-05, CA-07).
- [ ] Reloj inyectable en `crearApp` (regla 4).
- [ ] Servicio: productos desde la base, disponibilidad, totales e inserción (CA-04, CA-06).
- [ ] `POST /api/pedidos` solo para estudiantes (CA-08).
- [ ] Exportar `VALIDADORES` del helper de pruebas.
- [ ] Prueba de integración: validador real, precio del cliente ignorado, no disponible, admin `403` (CA-04 a CA-08).

## D. Frontend

- [ ] Modelos `LineaCarrito`, `DatosPedido` y `Pedido`.
- [ ] `CarritoService` con signals y `localStorage`, con pruebas (CA-09, CA-10).
- [ ] `PedidosService` y utilidades de hora de recogida, con pruebas (CA-11).
- [ ] `estudianteGuard` con pruebas (CA-12).
- [ ] Botón «Agregar al carrito» y contador en la navbar (CA-09).
- [ ] Página Carrito (CA-10).
- [ ] Página Confirmar pedido con selector de hora y mensaje de éxito (CA-11).

## E. Verificación y cierre

- [ ] Lint, pruebas y build del backend; pruebas y build del frontend (CA-13).
- [ ] Prueba real con `ana.torres@utmachala.edu.ec`: `pedidos` pasa de 40 a 41 (CA-13).
- [ ] Actualizar `README.md`, `specs/README.md` y la documentación de la API.
