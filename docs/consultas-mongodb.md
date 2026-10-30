# Consultas y agregaciones de MongoDB

Las consultas de referencia están en [`database/consultas_pedidos_utmach.js`](../database/consultas_pedidos_utmach.js) (secciones A–E). Este documento explica cómo las usa el backend, en especial los reportes de la sección **B**, que se ejecutan en [`backend/src/modules/reportes/reportes.service.ts`](../backend/src/modules/reportes/reportes.service.ts).

## 1. Consultas `find` del backend

| Pantalla | Consulta | Índice |
| --- | --- | --- |
| Menú por categoría | `productos.find({ "categoria._id", disponible: true })` | `ix_categoria_disponible` |
| Búsqueda | `productos.find({ $text: { $search } })` | `tx_busqueda` |
| Mis pedidos | `pedidos.find({ "usuario._id" }).sort({ creadoEn: -1 })` | `ix_usuario_fecha` |
| Pedidos activos | `pedidos.find({ estado: { $in: [...] } }).sort({ horaRecogida: 1 })` | `ix_estado_hora` |
| Avanzar estado | `updateOne({ _id, estado }, { $set, $push })` | `_id` |

## 2. Reportes (`GET /api/reportes/*`, solo admin)

Todos los endpoints aceptan `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` (días de recogida en Ecuador, inclusivos). Con fechas, el pipeline empieza con:

```js
{ $match: { horaRecogida: { $gte: ISODate("<desde>T05:00:00Z"), $lt: ISODate("<hasta + 1 día>T05:00:00Z") } } }
```

Sin fechas no se agrega la etapa y el pipeline es idéntico al del script.

| Endpoint | Pipeline | Etapas | Ajuste respecto del script |
| --- | --- | --- | --- |
| `/mas-vendidos?limite=5` | B1 | `$unwind` → `$group` por `items.nombre` → `$project` con `$round` → `$sort { unidades: -1, producto: 1 }` → `$limit` | `limite` 1–20. |
| `/ventas-por-dia` | B2 | `$group` por `$dateToString` (`%Y-%m-%d`, `America/Guayaquil`) → `$round` → `$sort { dia: 1 }` | El `$match` fijo lo reemplaza el filtro común. |
| `/hora-pico` | B3 | `$group` por `$hour` (`America/Guayaquil`) → `$sort { pedidos: -1, hora: 1 }` | — |
| `/ventas-por-categoria` | B4 | `$unwind` → `$lookup` a `productos` → `$unwind` → `$group` por `producto.categoria.nombre` | `$group` nulo + `$push` + `$unwind` para calcular `porcentaje` de ingresos en MongoDB. |
| `/por-estudiante` | B5 | `$group` por `usuario.nombre` con `$sum` y `$avg` → `$round` → `$sort { gasto: -1 }` | Desempate por nombre. |
| `/resumen` | B6 | `$facet` con `porEstado`, `totales` (pedidos, ventas, `ticketPromedio` con `$avg`), `hoy` y `activos` (`$count`) | Facetas `hoy` y `activos` para las tarjetas. |

### Zona horaria

`horaRecogida` se guarda en UTC. Un pedido que se recoge el 21/10 a las 23:30 en Ecuador se guarda como `2026-10-22T04:30:00Z`; sin `timezone` se agruparía en el día 22 y en la hora 4. Por eso `$dateToString` y `$hour` reciben `timezone: "America/Guayaquil"`, y la prueba `tests/reportes.test.ts` verifica ese caso.

### Resultados con la base del proyecto

Ejecutados el 30/10/2026 sobre los 41 pedidos existentes (40 del script + 1 de la fase 4):

| Reporte | Primer resultado |
| --- | --- |
| Más vendidos | Almuerzo del día — 20 unidades, $55,00 |
| Ventas por categoría | Almuerzos — $104,00 (58,35 %) |
| Hora pico | 10:00 — 13 pedidos |
| Por estudiante | Ana Torres — 9 pedidos, $38,95 |
| Resumen | 41 pedidos, $179,85, ticket promedio $4,39 |

Los totales cambian a medida que se crean pedidos nuevos.

## 3. Índices y planes de ejecución

La sección **C** del script compara `COLLSCAN` (forzado con `hint({ $natural: 1 })`) frente a `IXSCAN` con `ix_estado_hora` e `ix_usuario_fecha` mediante `explain("executionStats")`. Las pruebas de la fase 5 verifican con `explain` que «Mis pedidos» y «Pedidos activos» usan esos índices.
