# Especificación 005 — Seguimiento del estado de los pedidos

**Issue:** #6
**Rama:** `005-estado-pedidos`
**Estado:** completada
**Depende de:** fase 4 (`004-carrito-pedido`) y de los índices `ix_usuario_fecha` e `ix_estado_hora` de la colección `pedidos`.

## Contexto

El estudiante ya crea pedidos con estado `recibido`, pero no puede consultarlos y el bar no tiene cómo avanzarlos. Esta fase agrega la vista «Mis pedidos» del estudiante, el tablero «Pedidos activos» del administrador y la transición de estados `recibido → preparando → listo → entregado`, cuya regla se desarrolla con TDD como función pura.

## Historias de usuario

### HU-E01 — Consultar mis pedidos (HU-05)

Como estudiante, quiero ver mis pedidos con su estado actual y su historial para saber cuándo pasar a recogerlos.

### HU-E02 — Atender pedidos activos (HU-06)

Como administrador del bar, quiero ver los pedidos pendientes ordenados por hora de recogida y avanzarlos de estado para organizar la preparación.

### HU-E03 — Transiciones seguras

Como administrador del bar, quiero que un pedido solo avance al estado siguiente, aunque dos personas lo actualicen a la vez, para que el historial sea fiable.

## Criterios de aceptación

### CA-01 — Estado siguiente (TDD)

**Dado** el estado actual de un pedido,
**cuando** se ejecuta `siguienteEstado(estadoActual)`,
**entonces** devuelve `preparando` para `recibido`, `listo` para `preparando` y `entregado` para `listo`; con `entregado` lanza `El pedido ya fue entregado y no puede avanzar` (409) y con un valor fuera de la lista lanza `El estado «<valor>» no es válido` (400).

### CA-02 — Mis pedidos

**Dado** un estudiante autenticado,
**cuando** solicita `GET /api/pedidos/mios?limite=N`,
**entonces** responde `200 { pedidos }` solo con **sus** pedidos, ordenados por `creadoEn` descendente, como máximo `N` (por defecto 20, rango 1–50), usando el índice `ix_usuario_fecha`.

### CA-03 — Pedidos activos

**Dado** un administrador,
**cuando** solicita `GET /api/pedidos/activos[?fecha=AAAA-MM-DD]`,
**entonces** responde `200 { pedidos }` con los pedidos en `recibido`, `preparando` o `listo`, ordenados por `horaRecogida` ascendente con el índice `ix_estado_hora`; con `fecha`, solo los que se recogen ese día en Ecuador (de 05:00Z a 05:00Z del día siguiente). Una fecha mal formada responde `400`.

### CA-04 — Avanzar estado

**Dado** un administrador y un pedido en `recibido`, `preparando` o `listo`,
**cuando** solicita `PATCH /api/pedidos/:id/estado`,
**entonces** el servidor calcula el estado con `siguienteEstado`, ejecuta `updateOne({ _id, estado: estadoActual }, { $set: { estado }, $push: { historialEstados: { estado, fecha } } })` y responde `200 { pedido }` actualizado. El documento sigue cumpliendo el validador `$jsonSchema`.

### CA-05 — Secuencia completa

**Dado** un pedido recién creado,
**cuando** se avanza tres veces,
**entonces** termina en `entregado` con 4 elementos en `historialEstados` (`recibido`, `preparando`, `listo`, `entregado`), y un cuarto intento responde `409` sin modificar el documento.

### CA-06 — Concurrencia

**Dado** dos `PATCH` simultáneos que leen el mismo estado,
**cuando** ambos intentan actualizar,
**entonces** solo uno se aplica (`200`) y el otro responde `409 El pedido ya cambió de estado` porque `matchedCount` es 0; el historial crece en un solo elemento.

### CA-07 — Errores de identificador

**Dado** un administrador,
**cuando** envía `PATCH` con un id mal formado o inexistente,
**entonces** responde `400` o `404 Pedido no encontrado` respectivamente.

### CA-08 — Permisos

**Dado** un estudiante, **cuando** solicita `GET /activos` o `PATCH /:id/estado`, **entonces** responde `403`; **dado** un administrador, **cuando** solicita `GET /mios`, **entonces** responde `403`; sin token, `401`.

### CA-09 — Mis pedidos (frontend)

**Dado** un estudiante en `/mis-pedidos`,
**cuando** carga la página,
**entonces** ve tarjetas con fecha, hora de recogida (America/Guayaquil), productos, total, estado con color (recibido gris, preparando ámbar, listo verde, entregado azul) y la línea de tiempo del historial. La lista se refresca cada 15 s y, si un pedido pasa a `listo`, la tarjeta se resalta con un aviso.

### CA-10 — Navegación del estudiante

**Dado** un estudiante,
**cuando** confirma un pedido,
**entonces** se redirige a `/mis-pedidos`, donde el pedido nuevo aparece destacado; la navbar incluye el enlace «Mis pedidos».

### CA-11 — Tablero del administrador

**Dado** un administrador en `/admin/pedidos`,
**cuando** carga la página,
**entonces** ve tres columnas (Recibido, Preparando, Listo) con tarjetas de estudiante, hora de recogida, productos y total, y un botón «Empezar a preparar», «Marcar listo» o «Entregar». El tablero se refresca cada 15 s y se filtra por fecha (hoy en Ecuador por defecto).

### CA-12 — Conflicto en el tablero

**Dado** que otro administrador ya avanzó el pedido,
**cuando** se pulsa el botón y la API responde `409`,
**entonces** se muestra un aviso en español y el tablero se recarga.

### CA-13 — Estados de la interfaz

**Dado** cualquiera de las dos pantallas, **cuando** carga, no hay datos o falla la API, **entonces** muestra un indicador de carga, un estado vacío o el mensaje de error en español.

### CA-14 — Calidad

**Dado** el código de la fase, **cuando** se ejecutan lint, pruebas y builds, **entonces** terminan en verde; una prueba real con el administrador muestra los pedidos activos de la base y avanza uno, y el driver confirma que su `historialEstados` creció.

## Reglas y restricciones

1. Orden único: `recibido → preparando → listo → entregado`. No se retrocede, no se saltan estados y `entregado` es final; por eso `historialEstados` nunca supera 4 elementos.
2. Cada cambio agrega `{ estado, fecha: Date }` con el reloj inyectado en `crearApp`.
3. La actualización es condicional sobre el estado leído para evitar condiciones de carrera.
4. No se crean, borran ni modifican colecciones, validadores ni índices; las pruebas usan `mongodb-memory-server`.

## Fuera de alcance

- Cancelar pedidos o retroceder estados.
- Notificaciones push o WebSockets (se usa sondeo cada 15 s).
- Reportes y agregaciones (fase 6).
