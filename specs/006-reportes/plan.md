# Plan técnico 006 — Reportes del administrador

**Issue:** #7
**Rama:** `006-reportes`

## Objetivo

Exponer seis reportes de solo lectura calculados con el framework de agregación y presentarlos en un panel de Angular con Chart.js.

## Backend

### 1. Contrato de la API

Todas las rutas son `GET`, exigen `autenticar` + `autorizarPorRol("admin")` y aceptan `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` opcionales. Errores: `400` (query inválida), `401`, `403`.

| Ruta | Query extra | Respuesta `200` | Pipeline |
| --- | --- | --- | --- |
| `/api/reportes/mas-vendidos` | `limite` 1–20 (5) | `{ productos: [{ producto, unidades, ingresos }] }` | B1 |
| `/api/reportes/ventas-por-dia` | — | `{ dias: [{ dia, pedidos, total }] }` | B2 |
| `/api/reportes/hora-pico` | — | `{ horas: [{ hora, pedidos }] }` | B3 |
| `/api/reportes/ventas-por-categoria` | — | `{ categorias: [{ categoria, unidades, ingresos, porcentaje }] }` | B4 |
| `/api/reportes/por-estudiante` | — | `{ estudiantes: [{ estudiante, pedidos, gasto, ticket }] }` | B5 |
| `/api/reportes/resumen` | — | `{ resumen: { porEstado: [{ estado, pedidos }], totales: { pedidos, ventas, ticketPromedio }, hoy, activos } }` | B6 |

### 2. Filtro de fechas

- `reportes.schemas.ts`: `esquemaRangoFechas` (`desde` y `hasta` opcionales con `fechaCalendario`, refinado `desde <= hasta`) y `esquemaMasVendidos` (rango + `limite`).
- `fechaCalendario` se extrae a `utils/validacion.ts` y la reutiliza también `esquemaPedidosActivos` (misma regla de la fase 5).
- `etapaFiltroFechas(rango)` antepone `{ $match: { horaRecogida: { $gte, $lt } } }` usando `rangoDiaEcuador` de la fase 5: `desde` → inicio de ese día, `hasta` → inicio del día siguiente (límite exclusivo). Sin parámetros no se agrega la etapa, así que B1–B6 quedan idénticos al script.

### 3. Pipelines (`reportes.service.ts`)

Se copian los pipelines B1–B6 tal cual y solo se cambia el filtro de fechas inicial. Ajustes mínimos, documentados:

| Pipeline | Ajuste | Motivo |
| --- | --- | --- |
| B1 | `$limit` parametrizable. | `?limite`. |
| B2 | Sin el `$match` fijo del script (14–28 oct). | Lo reemplaza el filtro común. |
| B4 | Tras el `$group`: `$group` nulo con `$push` + `$sum`, `$unwind` y `porcentaje = $round(ingresos / total × 100, 2)`; desempate por `categoria`. | Porcentaje calculado en MongoDB. |
| B5 | Desempate por `estudiante`. | Orden determinista. |
| B6 | `totales` agrega `ticketPromedio` con `$avg`; facetas `hoy` (`$match` del día de `ahora` + `$count`) y `activos` (`$match` de estados activos + `$count`); `porEstado` se proyecta como `{ estado, pedidos }` con desempate por estado. | Tarjetas del panel. |

El reloj (`ahora`) se inyecta en `crearRutasReportes` igual que en pedidos. El servicio solo convierte las facetas vacías de `$facet`/`$count` en `0`; no suma ni promedia en JavaScript.

**Alternativa descartada:** `$setWindowFields` para el porcentaje. Es más compacto, pero `$group` + `$push` funciona en cualquier versión soportada de MongoDB/Atlas y es más legible en Studio 3T.

### 4. Pruebas (`tests/reportes.test.ts`)

Datos propios y deterministas (se vacía `pedidos` y se insertan 5 pedidos de Ana y Luis con 4 productos de 3 categorías; se agrega «Jugo natural» en Bebidas). Reloj fijo `2026-10-29T14:00:00Z`. Se verifican los valores exactos de los seis reportes, el desempate por nombre, `?limite`, los filtros `desde`/`hasta` (juntos y por separado), el pedido de las 23:30 en Ecuador, el rango vacío, las validaciones `400` y los permisos `401`/`403`.

## Frontend

### 5. Chart.js directo (sin ng2-charts)

Se instala solo `chart.js` y se registra lo necesario (`BarController`, `DoughnutController`, escalas, `Tooltip`, `Legend`). Un componente `Grafico` recibe la configuración con `input.required()`, crea el `Chart` sobre un `<canvas>` en `afterNextRender`, lo recrea con un `effect` cuando cambia la configuración y lo destruye en `DestroyRef.onDestroy`.

**Motivo:** ng2-charts añade un envoltorio y su propia matriz de compatibilidad con cada versión mayor de Angular; con Angular 22 no hay garantía de soporte inmediato. Chart.js directo es una dependencia menos y el envoltorio necesario son ~40 líneas.

### 6. Estructura

```text
frontend/src/app/
├── core/models/reporte.ts
├── core/reportes/
│   ├── reportes.service.ts      # seis GET con desde/hasta + todos() con forkJoin
│   └── rangos.ts                # rangoRapido('todo' | 'semana' | 'mes', ahora) en hora de Ecuador
├── shared/grafico/grafico.ts    # envoltorio de Chart.js
├── features/admin/reportes/admin-reportes.ts + .html
└── layout/layout.html           # enlace «Reportes» (admin)
```

### 7. Comportamiento

- Un `Subject` de rango + `switchMap` a `todos()` (`forkJoin` de los seis reportes) + `takeUntilDestroyed`: cambiar el filtro cancela la carga anterior.
- Paleta UTMACH: azul `#003087`, azul claro `#1d4ed8`, amarillo `#f2b705` y tonos de apoyo para la dona.
- Montos con `CurrencyPipe` (`USD`, `es-EC` ya configurado), horas como `HH:00`.
- Si el resumen trae `totales.pedidos === 0`, el panel muestra «Sin datos en este rango» en lugar de gráficos.
- Ruta `/admin/reportes` protegida por `adminGuard`, tarjeta en el panel del admin y enlace en la navbar.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Agrupar por día en UTC en lugar de Ecuador. | `timezone` en `$dateToString`/`$hour` y prueba del pedido de las 23:30. |
| Errores de redondeo de punto flotante. | `$round` en el servidor y montos de prueba con valores exactos. |
| Canvas que no se libera al navegar. | `chart.destroy()` en `onDestroy` y al recrear. |
| Pruebas que toquen la base local. | `mongodb-memory-server` con datos propios. |
