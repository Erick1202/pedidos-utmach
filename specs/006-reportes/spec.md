# Especificación 006 — Reportes del administrador

**Issue:** #7
**Rama:** `006-reportes`
**Estado:** completada
**Depende de:** fases 4 y 5 (pedidos con `items` embebidos, `total`, `horaRecogida`, `estado` y `usuario`).

## Contexto

El bar ya recibe y atiende pedidos, pero el administrador no tiene una visión agregada de las ventas. Esta fase expone seis reportes calculados en MongoDB con `aggregate()` —reutilizando los pipelines B1 a B6 de `database/consultas_pedidos_utmach.js`— y un panel «Reportes» con tarjetas, gráficos de Chart.js y una tabla por estudiante.

## Historias de usuario

### HU-R01 — Panel de reportes (HU-08)

Como administrador del bar, quiero ver qué productos y categorías se venden más, cuánto se vende por día, a qué hora se recogen más pedidos y cuánto gasta cada estudiante, para planificar la producción.

### HU-R02 — Filtrar por fechas

Como administrador, quiero limitar los reportes a un rango de días de recogida (en hora de Ecuador) para comparar periodos.

## Criterios de aceptación

### CA-01 — Filtro de fechas común

**Dado** cualquier endpoint de `/api/reportes`,
**cuando** recibe `?desde=AAAA-MM-DD` y/o `?hasta=AAAA-MM-DD`,
**entonces** el pipeline empieza con `$match` sobre `horaRecogida` de `desde 00:00` a `hasta 24:00` en `America/Guayaquil` (05:00Z a 05:00Z); sin parámetros, usa todos los pedidos. Una fecha inexistente, mal formada o `desde > hasta` responde `400` en español.

### CA-02 — Más vendidos (B1)

**Cuando** se pide `GET /api/reportes/mas-vendidos?limite=N` (1–20, por defecto 5),
**entonces** responde `200 { productos: [{ producto, unidades, ingresos }] }` con `$unwind` de `items`, `$group` por nombre, orden por unidades descendente y nombre ascendente, e ingresos con `$round` a 2 decimales.

### CA-03 — Ventas por día (B2)

**Entonces** responde `{ dias: [{ dia, pedidos, total }] }` agrupando por `$dateToString` (`%Y-%m-%d`, zona `America/Guayaquil`), ordenado por día.

### CA-04 — Hora pico (B3)

**Entonces** responde `{ horas: [{ hora, pedidos }] }` agrupando por `$hour` de `horaRecogida` en `America/Guayaquil`, ordenado por pedidos descendente y hora ascendente.

### CA-05 — Ventas por categoría (B4)

**Entonces** responde `{ categorias: [{ categoria, unidades, ingresos, porcentaje }] }` con `$unwind`, `$lookup` a `productos`, `$unwind` y `$group` por `categoria.nombre`; `porcentaje` es la participación en los ingresos del rango (2 decimales), ordenado por ingresos descendente.

### CA-06 — Por estudiante (B5)

**Entonces** responde `{ estudiantes: [{ estudiante, pedidos, gasto, ticket }] }` agrupando por `usuario.nombre`, con `ticket` = `$avg` del total, ordenado por gasto descendente.

### CA-07 — Resumen (B6)

**Entonces** responde `{ resumen: { porEstado, totales: { pedidos, ventas, ticketPromedio }, hoy, activos } }` en una sola agregación con `$facet`; `hoy` cuenta los pedidos que se recogen hoy en Ecuador (reloj inyectado) y `activos` los que están en `recibido`, `preparando` o `listo`. Sin datos, los totales valen 0.

### CA-08 — Zona horaria

**Dado** un pedido con recogida a las 23:30 del 21 de octubre en Ecuador (04:30Z del 22),
**entonces** cuenta en el día `2026-10-21` y en la hora 23, aparece al filtrar `desde=hasta=2026-10-21` y no al filtrar `2026-10-22`.

### CA-09 — Permisos

**Dado** un estudiante, **cuando** pide cualquier reporte, **entonces** responde `403`; sin token, `401`.

### CA-10 — Panel en Angular

**Dado** un administrador en `/admin/reportes` (enlace «Reportes» en la navbar),
**cuando** carga la página,
**entonces** ve cuatro tarjetas (total de ventas, pedidos, ticket promedio y pedidos activos), un filtro desde/hasta con los botones «Todo», «Últimos 7 días» y «Este mes», los gráficos de más vendidos (barras horizontales), ventas por día (barras), hora pico (barras por hora) y ventas por categoría (dona con porcentajes), y la tabla «Por estudiante».

### CA-11 — Estados de la interfaz

**Dado** el panel, **cuando** carga, el rango no tiene pedidos o la API falla, **entonces** muestra un indicador de carga, «Sin datos en este rango» o el error en español. Funciona a 360 px sin desplazamiento horizontal.

### CA-12 — Calidad

Lint, pruebas y builds en verde. Contra la base real, el producto más vendido es «Almuerzo del día» y la categoría con más ingresos «Almuerzos».

## Reglas y restricciones

1. Toda agregación se calcula en MongoDB con `aggregate()`; el backend solo da valores por defecto cuando un `$facet` viene vacío.
2. Montos con `$round` a 2 decimales; fechas y horas con `timezone: "America/Guayaquil"`.
3. Los reportes consideran todos los estados (no existen pedidos cancelados).
4. No se crean, borran ni modifican colecciones, validadores ni índices; las pruebas usan `mongodb-memory-server` con datos propios.

## Fuera de alcance

- Exportar a PDF o Excel.
- Comparativas entre periodos y reportes por producto individual.
- Actualización en tiempo real del panel.
