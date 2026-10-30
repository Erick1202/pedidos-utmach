# Especificación 004 — Carrito y creación de pedidos

**Issue:** #5
**Rama:** `004-carrito-pedido`
**Estado:** completada
**Depende de:** fase 2 (`002-autenticacion`), fase 3 (`003-menu-productos`) y de la colección `pedidos` existente (40 documentos y validador `$jsonSchema` estricto).

## Contexto

El estudiante ya ve el menú, pero el botón «Agregar al carrito» está deshabilitado. Esta fase agrega el carrito en el navegador, la confirmación con hora de recogida y el endpoint que crea el pedido en MongoDB. Las tres reglas críticas (totales, hora de recogida y cantidades) se desarrollan con TDD como funciones puras.

## Historias de usuario

### HU-C01 — Armar el carrito (HU-03)

Como estudiante, quiero agregar productos del menú a un carrito, cambiar sus cantidades y ver el total recalculado para decidir mi pedido.

### HU-C02 — Confirmar el pedido (HU-04)

Como estudiante, quiero confirmar mi pedido eligiendo una hora de recogida válida para retirarlo sin hacer fila.

### HU-C03 — Precios confiables

Como administrador del bar, quiero que el servidor tome los precios de la base y rechace productos no disponibles para cobrar lo correcto.

## Criterios de aceptación

### CA-01 — Totales redondeados (TDD)

**Dado** una lista de líneas `{ precioUnitario, cantidad }`,
**cuando** se ejecuta `calcularTotales(items)`,
**entonces** cada línea recibe `subtotal = redondear(precioUnitario × cantidad)` y `total = redondear(Σ subtotales)`, ambos con `Math.round(x * 100) / 100` (por ejemplo, `0.1 × 3 → 0.3` y `1.15 × 3 → 3.45`).

### CA-02 — Hora de recogida (TDD)

**Dado** una fecha de recogida y el instante actual,
**cuando** se ejecuta `validarHoraRecogida(fecha, ahora)`,
**entonces** es válida solo si es posterior a `ahora` y su hora en `America/Guayaquil` está entre las 07:00 y las 16:00 (ambas inclusive); en otro caso devuelve un mensaje en español.

### CA-03 — Cantidades (TDD)

**Dado** las líneas del pedido,
**cuando** se ejecuta `validarCantidades(items)`,
**entonces** es válida solo si hay al menos una línea y cada cantidad es un entero de 1 a 20.

### CA-04 — Crear pedido

**Dado** un estudiante autenticado y un cuerpo `{ items: [{ productoId, cantidad }], horaRecogida }` válido,
**cuando** solicita `POST /api/pedidos`,
**entonces** responde `201 { pedido }` y se inserta un documento con `usuario { _id, nombre }` tomado del token, `items` con `nombre` y `precioUnitario` leídos de la base, `subtotal` y `total` calculados con `calcularTotales`, `estado: "recibido"`, `historialEstados: [{ estado: "recibido", fecha }]` y `creadoEn`, que cumple el validador `$jsonSchema` de `pedidos`.

### CA-05 — El precio del cliente se ignora

**Dado** un cuerpo que intenta enviar `precioUnitario`, `subtotal` o `total`,
**cuando** se crea el pedido,
**entonces** zod descarta esos campos, el pedido se crea (`201`) con el precio de la base y ningún monto del cliente llega a la base.

### CA-06 — Producto no disponible o inexistente

**Dado** un `productoId` no disponible (por ejemplo, `Tigrillo`) o inexistente,
**cuando** se crea el pedido,
**entonces** responde `400` con `El producto «Tigrillo» no está disponible` o `Uno de los productos del pedido no existe`, y no se inserta nada.

### CA-07 — Validaciones del cuerpo

**Dado** un cuerpo sin ítems, con cantidades fuera de 1..20, con productos repetidos, con una hora fuera de 07:00–16:00 o en el pasado,
**cuando** se crea el pedido,
**entonces** responde `400` con un mensaje en español.

### CA-08 — Permisos

**Dado** un administrador o una petición sin token,
**cuando** solicita `POST /api/pedidos`,
**entonces** responde `403` o `401` respectivamente.

### CA-09 — Carrito (frontend)

**Dado** un estudiante en `/menu`,
**cuando** pulsa «Agregar al carrito»,
**entonces** la línea se agrega (o incrementa) en `CarritoService`, el contador de la navbar muestra la cantidad de ítems y el carrito se conserva en `localStorage` al recargar.

### CA-10 — Página Carrito

**Dado** un carrito con productos en `/carrito`,
**cuando** el estudiante cambia cantidades (1..20) o elimina líneas,
**entonces** los subtotales y el total se recalculan; con el carrito vacío se muestra un estado vacío con enlace al menú.

### CA-11 — Confirmar pedido

**Dado** un carrito con productos en `/confirmar-pedido`,
**cuando** el estudiante elige una hora válida de hoy (07:00–16:00, posterior a la actual) y confirma,
**entonces** se llama a la API, se vacía el carrito y se muestra un mensaje de éxito con el total y la hora. Una hora inválida muestra el error en español sin llamar a la API.

### CA-12 — Rutas por rol

**Dado** un administrador,
**cuando** abre `/carrito` o `/confirmar-pedido`,
**entonces** es redirigido a `/admin`; no ve el contador del carrito ni el botón de agregar.

### CA-13 — Calidad

**Dado** el código de la fase,
**cuando** se ejecutan lint, pruebas y builds,
**entonces** backend y frontend terminan en verde, y una prueba real con `ana.torres@utmachala.edu.ec` aumenta `pedidos` de 40 a 41 documentos.

## Reglas y restricciones

1. No se crean, borran ni modifican colecciones, validadores ni índices; la base real nunca se usa en las pruebas.
2. `usuario._id` y `productoId` son `ObjectId`; `horaRecogida`, `fecha` y `creadoEn` son `Date`; montos redondeados a 2 decimales.
3. El precio y el nombre del producto **siempre** se leen de la base.
4. El reloj se inyecta en `crearApp` para que las pruebas sean deterministas.
5. El cuerpo se valida con zod; a diferencia de la fase 3 no es `.strict()`, sino que **descarta** los campos desconocidos para ignorar montos del cliente (ver `plan.md`). Las reglas de negocio viven en funciones puras sin acceso a la base.

## Fuera de alcance

- «Mis pedidos» y avance de estados (fase 5).
- Pagos (simulados) y descuento de inventario.
- Pedidos para días distintos al actual en la interfaz (la API acepta cualquier fecha futura dentro del horario).
