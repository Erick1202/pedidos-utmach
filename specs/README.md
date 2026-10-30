# Especificaciones — Spec Driven Development (SDD)

Este directorio contiene la fuente de verdad funcional de PedidosUTMACH. **Ninguna funcionalidad se implementa antes de que exista su especificación.** El orden es siempre:

```text
spec.md  →  plan.md  →  tasks.md  →  código  →  pruebas  →  documentación
```

## Constitución

Las reglas no negociables del proyecto están en [`constitution.md`](constitution.md). Toda especificación, plan y Pull Request debe respetarlas.

## Estructura de cada especificación

```text
specs/00X-nombre/
├── spec.md    # Historias, criterios de aceptación (CA), reglas y fuera de alcance
├── plan.md    # Decisiones técnicas, contratos de API, modelo de datos, riesgos
└── tasks.md   # Checklist granular; se marca conforme se completa
```

### Convenciones

- Las historias se numeran `HU-01`, `HU-02`, … y los criterios de aceptación `CA-01`, `CA-02`, … dentro de cada spec.
- Cada criterio se escribe como **Dado / Cuando / Entonces** y debe ser verificable con una prueba o una comprobación manual descrita.
- Cada tarea de `tasks.md` referencia la historia o el criterio que satisface y se marca `[x]` en el mismo commit que la completa.
- Los cambios de alcance se registran en `plan.md` con su justificación; no se borra el historial de decisiones.
- Un PR debe indicar la carpeta de `specs/` que implementa y el estado de sus tareas.

## Estado de las especificaciones

| Carpeta | Fase / rama | Funcionalidad | Estado |
| --- | --- | --- | --- |
| — | `chore/estructura` | Estructura del monorepo, README y constitución | ✅ Completada |
| [`001-backend-base/`](001-backend-base/) | `001-backend-base` | Backend base, conexión a la base existente, errores y helper de pruebas | ✅ Completada |
| [`002-autenticacion/`](002-autenticacion/) | `002-autenticacion` | Registro, login, JWT y guards por rol | ✅ Completada |
| [`003-menu-productos/`](003-menu-productos/) | `003-menu-productos` | Catálogo, filtros, búsqueda de texto y CRUD admin | ✅ Completada |
| [`004-carrito-pedido/`](004-carrito-pedido/) | `004-carrito-pedido` | Carrito, hora de recogida y creación del pedido (TDD) | ✅ Completada |
| `005-estado-pedidos/` | `005-estado-pedidos` | Mis pedidos, pedidos activos y transiciones (TDD) | ⏳ Pendiente |
| `006-reportes/` | `006-reportes` | Agregaciones, panel de reportes y documentación MongoDB | ⏳ Pendiente |
| `007-ci-despliegue/` | `ci/github-actions` | GitHub Actions y guía de despliegue | ⏳ Pendiente |

> Las carpetas de las fases 1 a 7 se crean al inicio de su fase, **antes** de escribir el código correspondiente. La fase 0 solo define la constitución y la estructura del repositorio.
