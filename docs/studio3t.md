# Guía de Studio 3T

## 1. Abrir la base

1. Abre Studio 3T y conéctate con **MongoDB Local-Tienda** (`mongodb://127.0.0.1:27017`).
2. Clic derecho sobre la conexión → **Refresh All**.
3. Expande `pedidos_utmach`: deben aparecer `usuarios`, `categorias`, `productos` y `pedidos`.

> No ejecutes `database/pedidos_utmach.js` salvo que quieras recrear la base: empieza con `dropDatabase()`.

## 2. Ejecutar las consultas

1. Abre **IntelliShell** (`Tools → IntelliShell`) sobre `pedidos_utmach`.
2. Abre `database/consultas_pedidos_utmach.js`.
3. Selecciona una consulta y presiona **F9** (ejecutar selección). Ejecuta las secciones A–C (solo lectura) antes de la D (escritura).

| Sección | Qué demuestra | Captura sugerida |
| --- | --- | --- |
| A1–A5 | `find` con filtros, proyección, orden, texto y arreglos embebidos | 📸 A1, A2, A3, A4 |
| B1–B6 | Agregaciones de los reportes (`$unwind`, `$group`, `$lookup`, `$facet`, zona horaria) | 📸 cada una |
| C1–C4 | Índices y `explain("executionStats")`: `COLLSCAN` frente a `IXSCAN` | 📸 C1, C2, C3, C4 |
| D1–D5 | `insertOne`, `updateOne` con `$set`/`$push`, `updateMany` y borrado | 📸 D1, D2 |
| E1–E4 | Validador `$jsonSchema` (error 121) e índice único (E11000) | 📸 E1, E3, E4 |

## 3. Comparar con la aplicación

Los pipelines B1–B6 son los mismos que usa la API en `/api/reportes/*` (ver [`consultas-mongodb.md`](consultas-mongodb.md)). Para contrastar un resultado:

1. Ejecuta B1 en IntelliShell.
2. Inicia sesión como administrador en la aplicación y abre **Reportes** con el botón **Todo**.
3. El gráfico «Productos más vendidos» debe mostrar los mismos productos y unidades.

Para B2 con un rango, cambia las fechas del `$match` y elige el mismo rango con «Desde» y «Hasta» en el panel.
