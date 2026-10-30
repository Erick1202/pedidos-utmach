# Documentación de PedidosUTMACH

Documentos de apoyo para las dos materias del proyecto. Todo está en español y los comandos están pensados para **Windows + PowerShell**.

| Documento | Contenido | Estado |
| --- | --- | --- |
| [`modelo-datos.md`](modelo-datos.md) | Colecciones, validadores, índices, diagrama Mermaid, decisiones de embebido/referencia y comparación con el modelo relacional. | ✅ Fase 1 |
| [`consultas-mongodb.md`](consultas-mongodb.md) | Cada consulta y agregación del sistema en `mongosh`, con explicación, índices y `explain("executionStats")` antes/después. | ⏳ Fase 6 |
| [`studio3t.md`](studio3t.md) | Cómo abrir `pedidos_utmach` en Studio 3T, consultas para IntelliShell y capturas sugeridas (📸). | ⏳ Fase 6 |
| [`despliegue.md`](despliegue.md) | Demo local en Windows y despliegue opcional en MongoDB Atlas + Render + GitHub Pages. | ⏳ Fase 7 |

## Scripts de la base de datos

La base `pedidos_utmach` ya está creada y su fuente de verdad son los scripts versionados en `database/`:

| Script | Contenido |
| --- | --- |
| [`database/pedidos_utmach.js`](../database/pedidos_utmach.js) | Creación de colecciones con validadores `$jsonSchema`, índices y datos de prueba. Empieza con `dropDatabase()`: úsalo solo para recrear la base. |
| [`database/consultas_pedidos_utmach.js`](../database/consultas_pedidos_utmach.js) | Consultas `find`, agregaciones de reportes, planes de ejecución y operaciones de escritura de referencia. |

Para ejecutarlos: Studio 3T → conexión **MongoDB Local-Tienda** → clic derecho → **Refresh All** → **IntelliShell** → abrir el archivo y ejecutarlo.

## Recursos relacionados

- [README del proyecto](../README.md): requisitos, puesta en marcha y usuarios de prueba.
- [Constitución](../specs/constitution.md): principios de ingeniería y calidad.
- [Especificaciones](../specs/): historias, planes y tareas por funcionalidad.
