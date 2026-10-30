# Plan técnico 005 — Seguimiento del estado de los pedidos

**Issue:** #6
**Rama:** `005-estado-pedidos`

## Objetivo

Exponer los pedidos del estudiante y los pedidos activos del bar, y permitir que el administrador avance su estado de forma segura ante concurrencia.

## Backend

### 1. Contrato de la API

| Método | Ruta | Rol | Entrada | Respuesta | Errores |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/pedidos/mios` | Estudiante | `?limite=1..50` (20) | `200 { pedidos }` | 400, 401, 403 |
| `GET` | `/api/pedidos/activos` | Admin | `?fecha=AAAA-MM-DD` opcional | `200 { pedidos }` | 400, 401, 403 |
| `PATCH` | `/api/pedidos/:id/estado` | Admin | sin cuerpo | `200 { pedido }` | 400, 401, 403, 404, 409 |

Los pedidos se serializan con `aPedidoPublico` (ids hexadecimales y fechas ISO 8601), igual que en la fase 4.

### 2. Regla pura (TDD) — `pedidos.reglas.ts`

| Función | Entrada | Salida |
| --- | --- | --- |
| `siguienteEstado(estadoActual)` | `string` | El estado siguiente, o lanza `ErrorAplicacion(409)` con `entregado` y `ErrorAplicacion(400)` con un valor desconocido. |
| `rangoDiaEcuador(fecha)` | `AAAA-MM-DD` | `{ desde, hasta }` = `fechaT00:00-05:00` y 24 h después. |

- `ESTADOS_PEDIDO` (`as const`) define el orden y el tipo `EstadoPedido`; el servicio lo reutiliza.
- **Decisión:** `siguienteEstado` lanza `ErrorAplicacion` en lugar de devolver `ResultadoValidacion` porque el Issue pide que «lance un error» y así el `409`/`400` llega al middleware central sin traducción adicional. Sigue siendo pura: no accede a la base ni al reloj.

### 3. Validación con zod — `pedidos.schemas.ts`

- `esquemaMisPedidos`: `limite` con `z.coerce.number().int().min(1).max(50).default(20)`.
- `esquemaActivos`: `fecha` opcional con formato `AAAA-MM-DD` y fecha de calendario real.
- `:id` con `esquemaParametroId` existente (400 si no es un `ObjectId`).

### 4. Servicio — `pedidos.service.ts`

- `listarMisPedidos(db, usuarioId, limite)`: `find({ "usuario._id" }).sort({ creadoEn: -1 }).limit(limite)` → prefijo y orden de `ix_usuario_fecha`.
- `listarActivos(db, fecha?)`: `find({ estado: { $in: ["recibido","preparando","listo"] }, horaRecogida?: { $gte, $lt } }).sort({ horaRecogida: 1 }).limit(200)` → `ix_estado_hora` (el planificador combina los tres rangos de estado con `SORT_MERGE`, sin ordenar en memoria).
- `avanzarEstado(db, id, ahora)`:
  1. `findOne({ _id })` → `404 Pedido no encontrado`.
  2. `siguienteEstado(pedido.estado)`.
  3. `updateOne({ _id, estado: estadoActual }, { $set: { estado }, $push: { historialEstados: { estado, fecha: ahora } } })`.
  4. `matchedCount === 0` → `409 El pedido ya cambió de estado`.
  5. Devuelve el documento releído.

**Alternativa descartada:** `findOneAndUpdate` devolvería el documento en una sola operación, pero el Issue pide `updateOne` con `matchedCount` explícito para evidenciar el control de concurrencia optimista.

### 5. Pruebas

- `pedidos.reglas.test.ts`: las tres transiciones válidas, `entregado` (409), valor desconocido (400) y `rangoDiaEcuador`.
- `pedidos.estado.test.ts` (integración): permisos, aislamiento por estudiante, orden y `limite`, uso de índices con `explain`, filtro por fecha, secuencia completa hasta `entregado`, 409 tras `entregado`, 400/404 de id, validador real tras cada cambio y concurrencia.
- **Concurrencia determinista:** se espía `Collection.prototype.findOne` con una barrera que libera las lecturas solo cuando ambas peticiones leyeron el mismo estado; así los dos `updateOne` compiten siempre y el resultado es exactamente `[200, 409]`.

## Frontend

### 6. Estructura

```text
frontend/src/app/
├── core/pedidos/
│   ├── pedidos.service.ts     # + misPedidos, activos, avanzarEstado
│   └── estados.ts             # etiquetas, colores, acción del botón y detección de «listo»
├── features/mis-pedidos/mis-pedidos.ts + .html
├── features/admin/pedidos/admin-pedidos.ts + .html
└── layout/layout.html          # «Mis pedidos» (estudiante) y «Pedidos» (admin)
```

### 7. Comportamiento

- Sondeo con `merge(timer(0, 15000), recargar$)` + `switchMap` + `takeUntilDestroyed`: una recarga manual cancela la petición en curso y no quedan temporizadores al salir.
- `pedidosQuePasaronAListo(anteriores, actuales)` (pura, con pruebas) devuelve los ids que cambiaron a `listo` entre dos sondeos; esas tarjetas se resaltan y se anuncia con `role="status"`.
- Confirmar pedido navega a `/mis-pedidos?nuevo=<id>`; la tarjeta con ese id aparece destacada.
- Horas con `DatePipe` y zona `-0500`; el filtro de fecha usa `fechaHoyEcuador`.
- `409` en el tablero: aviso ámbar «Otro usuario ya actualizó este pedido…» y recarga inmediata.

### 8. Rutas

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/mis-pedidos` | MisPedidos | `authGuard` + `estudianteGuard` |
| `/admin/pedidos` | AdminPedidos | `authGuard` + `adminGuard` |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Dos administradores avanzan el mismo pedido. | `updateOne` condicional + `409` y recarga en el tablero. |
| La prueba de concurrencia es intermitente. | Barrera sobre `findOne` en la prueba. |
| El sondeo deja temporizadores vivos. | `takeUntilDestroyed`. |
| La zona del navegador altera el filtro. | `fechaHoyEcuador` y `rangoDiaEcuador` con UTC-5 fijo. |
