# Plan técnico 004 — Carrito y creación de pedidos

**Issue:** #5
**Rama:** `004-carrito-pedido`

## Objetivo

Permitir que un estudiante arme un carrito en el navegador y lo confirme como pedido con una hora de recogida válida. El servidor recalcula precios y totales desde la base y guarda un documento que cumple el validador de `pedidos`.

## Backend

### 1. Contrato de la API

| Método | Ruta | Rol | Cuerpo | Respuesta |
| --- | --- | --- | --- | --- |
| `POST` | `/api/pedidos` | Estudiante | `{ items: [{ productoId, cantidad }], horaRecogida }` | `201 { pedido }` |

```json
{
  "items": [{ "productoId": "64d000000000000000000001", "cantidad": 2 }],
  "horaRecogida": "2026-10-30T12:30:00-05:00"
}
```

Respuesta (ids como texto hexadecimal y fechas ISO 8601):

```json
{
  "pedido": {
    "_id": "…",
    "usuario": { "_id": "64a100000000000000000001", "nombre": "Ana Torres" },
    "items": [
      { "productoId": "64d000000000000000000001", "nombre": "Bolón de verde", "precioUnitario": 1.5, "cantidad": 2, "subtotal": 3 }
    ],
    "total": 3,
    "horaRecogida": "2026-10-30T17:30:00.000Z",
    "estado": "recibido",
    "historialEstados": [{ "estado": "recibido", "fecha": "…" }],
    "creadoEn": "…"
  }
}
```

### 2. Reglas puras (TDD) — `modules/pedidos/pedidos.reglas.ts`

| Función | Entrada | Salida |
| --- | --- | --- |
| `calcularTotales(items)` | `[{ precioUnitario, cantidad, … }]` | `{ items: [...con subtotal], total }` redondeados con `redondearMonto`. |
| `validarHoraRecogida(fecha, ahora)` | `Date`, `Date` | `{ valido: true }` o `{ valido: false, mensaje }`. |
| `validarCantidades(items)` | `[{ cantidad }]` | `{ valido: true }` o `{ valido: false, mensaje }`. |

- La hora local se obtiene con `Intl.DateTimeFormat("en-US", { timeZone: "America/Guayaquil", hourCycle: "h23" })`; no se usa la zona del equipo. El rango es inclusivo: 07:00:00 ≤ hora ≤ 16:00:00.
- Las funciones no acceden a la base ni a `Date.now()`: el reloj llega como parámetro.

### 3. Validación con zod — `pedidos.schemas.ts`

- `items`: arreglo (máximo 50) de `{ productoId: idMongo, cantidad: number }`; productos sin repetir (`No repitas un producto en el pedido`).
- `horaRecogida`: `z.iso.datetime({ offset: true })` transformada a `Date`.
- **Decisión:** el cuerpo y los ítems usan `z.object` sin `.strict()` (modo por defecto, que *descarta* claves desconocidas). Así `precioUnitario`, `subtotal`, `total` o `usuario` enviados por el cliente se ignoran en silencio, como exige el Issue #5, en lugar de rechazar la petición. Es una excepción documentada a la regla `.strict()` de la fase 3.
- El rango de cantidades y la hora se validan con las reglas puras en el servicio (mensajes de negocio con `ErrorAplicacion(400)`).

### 4. Servicio — `pedidos.service.ts`

1. `validarCantidades` y `validarHoraRecogida(hora, ahora())`.
2. `productos.find({ _id: { $in: ids } })` en una sola consulta; si falta alguno → `400 Uno de los productos del pedido no existe`; si alguno tiene `disponible: false` → `400 El producto «<nombre>» no está disponible`.
3. Líneas con `nombre` y `precio` de la base → `calcularTotales`.
4. `insertOne` con `usuario: { _id: new ObjectId(token._id), nombre: token.nombre }`, `estado: "recibido"`, `historialEstados: [{ estado: "recibido", fecha: ahora }]` y `creadoEn: ahora`.
5. Se devuelve el pedido serializado (`aPedidoPublico`).

### 5. Reloj inyectable

`crearApp(db, { jwtSecret, ahora? })`, donde `ahora: () => Date` por defecto es `() => new Date()`. Las pruebas fijan `2026-10-29T14:00:00Z` (09:00 en Ecuador).

### 6. Estructura

```text
backend/src/modules/pedidos/
├── pedidos.reglas.ts    # calcularTotales, validarHoraRecogida, validarCantidades
├── pedidos.schemas.ts   # zod del cuerpo
├── pedidos.service.ts   # lectura de productos, cálculo e inserción
└── pedidos.routes.ts    # POST / con autenticar + autorizarPorRol("estudiante")
backend/tests/
├── pedidos.reglas.test.ts   # pruebas unitarias (TDD)
└── pedidos.test.ts          # integración con mongodb-memory-server
```

### 7. Respuestas de error nuevas

| Situación | HTTP | Mensaje |
| --- | --- | --- |
| Sin ítems | 400 | `El pedido debe tener al menos un producto` |
| Cantidad fuera de rango | 400 | `La cantidad de cada producto debe ser un entero entre 1 y 20` |
| Hora pasada | 400 | `La hora de recogida debe ser posterior a la hora actual` |
| Fuera de horario | 400 | `La hora de recogida debe estar entre las 07:00 y las 16:00` |
| Producto inexistente | 400 | `Uno de los productos del pedido no existe` |
| Producto no disponible | 400 | `El producto «<nombre>» no está disponible` |
| Rol admin | 403 | `No tienes permisos para realizar esta acción` |

### 8. Pruebas del backend

- `pedidos.reglas.test.ts`: redondeo de subtotales y total, límites 06:59/07:00/16:00/16:01 en Ecuador, fecha pasada o igual a `ahora`, cantidades 0, 21, 1.5, 20 y lista vacía.
- `pedidos.test.ts`: `201` con el documento persistido que cumple el `$jsonSchema` real del helper (consulta con el validador exportado y `$type`), precios de la base, precio del cliente ignorado, `Tigrillo` rechazado sin insertar, inexistente, hora inválida, productos repetidos, admin `403` y sin token `401`.
- El helper exporta `VALIDADORES` para comprobar el documento contra el mismo esquema.

## Frontend

### 9. Estructura

```text
frontend/src/app/
├── core/
│   ├── auth/estudiante.guard.ts       # solo rol estudiante
│   ├── carrito/carrito.service.ts     # signals + localStorage
│   ├── pedidos/pedidos.service.ts     # POST /pedidos
│   ├── pedidos/hora-recogida.ts       # fecha de hoy en Ecuador y validación del selector
│   └── models/pedido.ts               # LineaCarrito, DatosPedido, Pedido
├── features/
│   ├── carrito/carrito.ts + .html
│   └── confirmar-pedido/confirmar-pedido.ts + .html
└── layout/layout.html                 # enlace «Carrito» con contador
```

### 10. `CarritoService`

- Estado: `signal<LineaCarrito[]>` con `{ productoId, nombre, precio, imagenUrl?, cantidad }`.
- `agregar(producto)` (suma 1, tope 20), `quitar(id)`, `cambiarCantidad(id, n)` (entero acotado a 1..20), `vaciar()`.
- `computed`: `lineas`, `cantidadItems` (suma de cantidades), `total` (redondeado), `vacio`.
- Persistencia síncrona en `localStorage['pedidos_utmach_carrito']` tras cada cambio; al iniciar se descartan datos corruptos. Al cerrar sesión se vacía.
- El precio del carrito es solo informativo: el servidor recalcula.

### 11. Pantallas

- Menú: el botón «Agregar al carrito» se activa para estudiantes e indica cuántas unidades hay en el carrito.
- Carrito: líneas con botones − / + y campo numérico, eliminar, subtotal, total y «Confirmar pedido».
- Confirmar pedido: resumen, `<input type="time" min="07:00" max="16:00">` para la fecha de hoy en Ecuador, validación en español (horario y futuro) y estado de éxito con total y hora devueltos por la API.

### 12. Rutas

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/carrito` | Carrito | `authGuard` + `estudianteGuard` |
| `/confirmar-pedido` | ConfirmarPedido | `authGuard` + `estudianteGuard` |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| El cliente manipula precios. | zod descarta los montos y los precios se leen de la base. |
| Un producto se desactiva con el carrito lleno. | El servidor responde `400` con el nombre; el frontend muestra el mensaje. |
| La zona horaria del equipo altera la validación. | Se usa `Intl` con `America/Guayaquil` en ambos lados. |
| Las pruebas dependen de la hora real. | Reloj inyectado en `crearApp` y parámetro `ahora` en las reglas. |
| Las pruebas tocan la base real. | `mongodb-memory-server`; la base real solo recibe el pedido de la prueba manual final. |
