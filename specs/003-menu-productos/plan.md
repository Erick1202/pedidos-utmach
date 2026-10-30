# Plan técnico 003 — Menú, productos y categorías

**Issue:** #4
**Rama:** `003-menu-productos`

## Objetivo

Exponer el catálogo existente (`categorias` y `productos`) con filtros y búsqueda de texto, el CRUD de administración protegido por rol, y las pantallas Angular del menú del estudiante y de la administración de productos y categorías.

## Backend

### 1. Contrato de la API

| Método | Ruta | Rol | Cuerpo / query | Respuesta |
| --- | --- | --- | --- | --- |
| `GET` | `/api/categorias` | Público | — | `200 { categorias }` |
| `POST` | `/api/categorias` | Admin | `{ nombre }` | `201 { categoria }` |
| `PUT` | `/api/categorias/:id` | Admin | `{ nombre }` | `200 { categoria }` |
| `DELETE` | `/api/categorias/:id` | Admin | — | `204` |
| `GET` | `/api/productos` | Público (admin con `todos`) | `?categoria=<id>&q=<texto>&todos=true` | `200 { productos }` |
| `GET` | `/api/productos/:id` | Público | — | `200 { producto }` |
| `POST` | `/api/productos` | Admin | `{ nombre, descripcion?, precio, imagenUrl?, disponible?, categoriaId }` | `201 { producto }` |
| `PUT` | `/api/productos/:id` | Admin | igual que `POST` (reemplazo completo) | `200 { producto }` |
| `PATCH` | `/api/productos/:id/disponible` | Admin | `{ disponible }` | `200 { producto }` |
| `DELETE` | `/api/productos/:id` | Admin | — | `204` |

Los `ObjectId` y las fechas se serializan como cadenas hexadecimales e ISO 8601 al responder.

```json
{
  "_id": "64d000000000000000000001",
  "nombre": "Bolón de verde",
  "descripcion": "Bolón de plátano verde con queso o chicharrón",
  "precio": 1.5,
  "imagenUrl": "https://images.unsplash.com/...",
  "disponible": true,
  "categoria": { "_id": "64c000000000000000000001", "nombre": "Desayunos" },
  "creadoEn": "2026-10-01T13:00:00.000Z"
}
```

### 2. Validación con zod

- `idMongo`: cadena de 24 caracteres hexadecimales (`Identificador inválido`), transformada a `ObjectId` en el servicio.
- Categoría: `{ nombre }` recortado, 3–50 caracteres, `.strict()`; el slug resultante no puede quedar vacío.
- Producto: `nombre` 3–100, `descripcion` ≤ 500 (por defecto `""`), `precio` número `> 0` y ≤ 1000 redondeado con `Math.round(x * 100) / 100` (debe quedar ≥ 0.01), `imagenUrl` URL `http(s)` opcional (cadena vacía = sin imagen), `disponible` booleano (por defecto `true`), `categoriaId` id válido; `.strict()`.
- Query de productos: `categoria` id opcional, `q` 1–100 caracteres opcional, `todos` `"true" | "false"` opcional.

### 3. Slug

`generarSlug(nombre)`: `normalize("NFD")`, quitar diacríticos, minúsculas, cualquier secuencia distinta de `[a-z0-9]` → `-`, sin guiones al inicio ni al final. `"Bebidas Frías"` → `bebidas-frias`. Antes de insertar o renombrar se busca el slug (excluyendo la propia categoría al editar) y se responde `409`; si hay una carrera, el índice `ux_slug` produce `11000` y el middleware central también responde `409`.

### 4. Consistencia de la copia embebida

- Renombrar: `updateOne` de la categoría y, si el nombre cambió, `productos.updateMany({ "categoria._id": id }, { $set: { "categoria.nombre": nombre } })`. No se usa transacción: la instancia local es *standalone*; si el `updateMany` fallara, repetir el `PUT` lo corrige (operación idempotente).
- Eliminar: `productos.countDocuments({ "categoria._id": id })`; si es mayor que cero, `409`. La consulta usa el prefijo del índice `ix_categoria_disponible`.

### 5. Consultas del catálogo

- Filtro base: `{ disponible: true }` salvo `todos=true` de admin; `categoria` agrega `{ "categoria._id": ObjectId }` (aprovecha `ix_categoria_disponible`).
- Con `q`: `{ $text: { $search: q } }`, proyección `{ score: { $meta: "textScore" } }` y orden por `score`. El campo `score` no se devuelve al cliente.
- Sin `q`: orden `{ "categoria.nombre": 1, nombre: 1 }`.
- `todos=true` exige autenticación y rol admin: se encadenan `crearAutenticacion` y `autorizarPorRol("admin")` solo cuando el parámetro viene en `true`.

### 6. Estructura

```text
backend/src/
├── modules/categorias/
│   ├── categorias.routes.ts
│   ├── categorias.schemas.ts
│   └── categorias.service.ts     # generarSlug, CRUD, updateMany
├── modules/productos/
│   ├── productos.routes.ts
│   ├── productos.schemas.ts
│   └── productos.service.ts      # filtros, $text, CRUD
├── utils/validacion.ts           # esquema idMongo y redondeo a 2 decimales
└── app.ts                        # monta /api/categorias y /api/productos
```

### 7. Respuestas de error nuevas

| Situación | HTTP | Mensaje |
| --- | --- | --- |
| Slug duplicado | 409 | `Ya existe una categoría con ese nombre` |
| Categoría con productos | 409 | `No se puede eliminar una categoría con productos` |
| Categoría inexistente | 404 | `Categoría no encontrada` |
| `categoriaId` inexistente | 400 | `La categoría indicada no existe` |
| Producto inexistente | 404 | `Producto no encontrado` |

### 8. Pruebas del backend

`tests/categorias.test.ts` y `tests/productos.test.ts` con `mongodb-memory-server` (helper existente):

1. Listado público de categorías ordenado.
2. Crear con slug sin tildes; slug duplicado `409` (también con tildes o mayúsculas); nombre corto `400`.
3. Renombrar actualiza la copia embebida en todos los productos; renombrar a un slug existente `409`; id inexistente `404`.
4. Eliminar con productos `409`; sin productos `204`.
5. Menú: solo disponibles; filtro por categoría; id inválido `400`.
6. `$text`: `q=verde` ordenado por relevancia; sin coincidencias, lista vacía.
7. `todos=true`: admin ve no disponibles; estudiante `403`; sin token `401`.
8. Detalle `200` / `404`.
9. Crear: categoría embebida tomada de la BD, `ObjectId` y `Date` persistidos, precio redondeado; categoría inexistente `400`; precio `0` `400`; campo desconocido `400`.
10. Editar, cambiar disponibilidad y eliminar.
11. Estudiante recibe `403` en todo el CRUD; sin token `401`.

Se amplía el helper con la categoría `Bebidas` (sin productos) para probar el borrado exitoso y el slug duplicado.

## Frontend

### 9. Estructura

```text
frontend/src/app/
├── core/
│   ├── catalogo/
│   │   ├── categorias.service.ts   # GET/POST/PUT/DELETE /categorias
│   │   ├── productos.service.ts    # GET con filtros, CRUD y disponibilidad
│   │   └── *.spec.ts
│   └── models/catalogo.ts          # Categoria, Producto, DatosProducto, FiltrosProductos
├── features/
│   ├── menu/menu.ts + menu.html    # menú del estudiante
│   └── admin/
│       ├── admin.ts                # panel con accesos
│       ├── productos/admin-productos.ts + .html
│       └── categorias/admin-categorias.ts + .html
└── layout/layout.html              # enlaces por rol
```

### 10. Menú del estudiante

- Estado con signals: `categorias`, `productos`, `categoriaSeleccionada`, `busqueda`, `cargando`, `error`.
- Los filtros se combinan con `toObservable` + `debounceTime(300)` sobre la búsqueda + `switchMap`, cancelando peticiones anteriores.
- Chips: «Todos» + una por categoría (`aria-pressed`). Tarjetas en rejilla 1/2/3 columnas; imagen con `loading="lazy"` y respaldo si falla.
- Precio con `CurrencyPipe` y la configuración regional `es-EC` registrada en `app.config.ts`.
- Botón «Próximamente» deshabilitado (el carrito es la fase 4).

### 11. Administración

- `/admin` conserva el panel con accesos a productos y categorías.
- Productos: listado en tarjetas (móvil) con `todos=true`, formulario reactivo para crear/editar con selector de categoría y vista previa de imagen, switch de disponibilidad (`role="switch"`) y eliminación con `confirm()`.
- Categorías: lista con formulario en línea para crear y editar, eliminar con confirmación; el `409` se muestra tal como lo envía la API.

### 12. Rutas

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/menu` | Menú | `authGuard` |
| `/admin` | Panel | `authGuard` + `adminGuard` |
| `/admin/productos` | AdminProductos | `authGuard` + `adminGuard` |
| `/admin/categorias` | AdminCategorias | `authGuard` + `adminGuard` |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| La copia embebida queda desactualizada si falla `updateMany`. | Operación idempotente: repetir el `PUT` la corrige. Documentado. |
| `$text` no admite `collation` ni orden distinto sin `textScore`. | Con `q` se ordena solo por `textScore`. |
| Un estudiante usa `?todos=true` para ver productos ocultos. | El parámetro activa `autenticar` + `autorizarPorRol("admin")`. |
| Las pruebas tocan la base real. | Siguen usando `mongodb-memory-server`; la verificación contra la base real solo hace lecturas. |
| Las imágenes externas no cargan. | Se muestra un respaldo con la inicial del producto. |
