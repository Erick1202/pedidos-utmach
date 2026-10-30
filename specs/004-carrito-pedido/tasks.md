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
- [x] `test:` prueba en rojo de `validarCantidades` (CA-03).
- [x] `feat:` implementar `validarCantidades` (CA-03).

## C. Backend — endpoint

- [x] Esquema zod del cuerpo que descarta montos del cliente (CA-05, CA-07).
- [x] Reloj inyectable en `crearApp` (regla 4).
- [x] Servicio: productos desde la base, disponibilidad, totales e inserción (CA-04, CA-06).
- [x] `POST /api/pedidos` solo para estudiantes (CA-08).
- [x] Exportar `VALIDADORES` del helper de pruebas.
- [x] Prueba de integración: validador real, precio del cliente ignorado, no disponible, admin `403` (CA-04 a CA-08).

## D. Frontend

- [x] Modelos `LineaCarrito`, `DatosPedido` y `Pedido`.
- [x] `CarritoService` con signals y `localStorage`, con pruebas (CA-09, CA-10).
- [x] `PedidosService` y utilidades de hora de recogida, con pruebas (CA-11).
- [x] `estudianteGuard` con pruebas (CA-12).
- [x] Botón «Agregar al carrito» y contador en la navbar (CA-09).
- [x] Página Carrito (CA-10).
- [x] Página Confirmar pedido con selector de hora y mensaje de éxito (CA-11).

## E. Verificación y cierre

- [x] Lint, pruebas y build del backend; pruebas y build del frontend (CA-13).
- [x] Prueba real con `ana.torres@utmachala.edu.ec`: `pedidos` pasa de 40 a 41 (CA-13).
- [x] Actualizar `README.md`, `specs/README.md` y la documentación de la API.

## Resultados de la verificación

- Ciclo TDD en el historial: `test:` (rojo) → `feat:` (verde) para `calcularTotales`, `validarHoraRecogida` y `validarCantidades`, más un `refactor:` sin cambios de comportamiento.
- Backend: `npm run lint` sin advertencias, `npm test` **8 archivos / 113 pruebas** en verde (18 de reglas puras y 14 de integración) y `npm run build` sin errores.
- Frontend: `npm run build` sin errores y `npm test -- --watch=false` **9 archivos / 39 pruebas** en verde.
- Base real: `ana.torres@utmachala.edu.ec` creó un pedido (Bolón ×2 + Café pasado ×1 = $3.60, recogida 2026-10-30 10:00) enviando `precioUnitario: 0.01` y `total: 0.01`, que se ignoraron; `pedidos` pasó de **40 a 41** (conteo con el driver) con `ObjectId` y `Date` en los campos esperados. `Tigrillo` → 400 con su nombre; admin → 403.
- Navegador: un administrador que abre `/carrito` es redirigido a `/admin` y no ve el enlace «Carrito».
- Nota: la interfaz solo permite recoger **hoy**; después de las 16:00 la página de confirmación indica que el bar ya no recibe pedidos. La prueba real se hizo por la API con la fecha del día siguiente.
