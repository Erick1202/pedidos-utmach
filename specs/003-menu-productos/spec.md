# Especificación 003 — Menú, productos y categorías

**Issue:** #4
**Rama:** `003-menu-productos`
**Estado:** completada
**Depende de:** fase 2 (`002-autenticacion`) y de las 4 categorías y 12 productos ya cargados en `pedidos_utmach`.

## Contexto

La base ya contiene las categorías `Desayunos`, `Almuerzos`, `Bebidas` y `Snacks` y 12 productos, de los cuales `Tigrillo` no está disponible. Esta fase expone el catálogo en la API, permite al administrador mantener productos y categorías, y reemplaza el marcador de `/menu` por el menú real del estudiante. El carrito llega en la fase 4.

## Historias de usuario

### HU-M01 — Ver el menú

Como estudiante, quiero ver los productos disponibles con imagen, nombre, descripción y precio para decidir qué pedir.

### HU-M02 — Filtrar y buscar

Como estudiante, quiero filtrar el menú por categoría y buscar por texto para encontrar rápido lo que quiero.

### HU-M03 — Administrar productos

Como administrador, quiero crear, editar, eliminar y activar o desactivar productos para mantener el menú al día.

### HU-M04 — Administrar categorías

Como administrador, quiero crear, renombrar y eliminar categorías sin dejar productos huérfanos ni nombres desactualizados.

## Criterios de aceptación

### CA-01 — Listar categorías

**Dado** cualquier visitante,
**cuando** solicita `GET /api/categorias`,
**entonces** responde `200` con `{ categorias: [{ _id, nombre, slug }] }` ordenadas por nombre.

### CA-02 — Crear categoría

**Dado** un administrador y un nombre válido (3–50 caracteres),
**cuando** solicita `POST /api/categorias`,
**entonces** responde `201` con la categoría y un `slug` generado del nombre (minúsculas, sin tildes, espacios como guiones).

### CA-03 — Slug duplicado

**Dado** un nombre cuyo slug ya existe (por ejemplo, `bebidas` o `Bébidas`),
**cuando** se crea o se renombra una categoría,
**entonces** responde `409` con `{ "error": "Ya existe una categoría con ese nombre" }`.

### CA-04 — Renombrar categoría

**Dado** una categoría con productos,
**cuando** el administrador la renombra con `PUT /api/categorias/:id`,
**entonces** se actualizan `nombre` y `slug`, y la copia embebida `categoria.nombre` de todos sus productos se actualiza con `updateMany`.

### CA-05 — Eliminar categoría

**Dado** una categoría,
**cuando** el administrador solicita `DELETE /api/categorias/:id`,
**entonces** responde `204` si no tiene productos y `409` con `{ "error": "No se puede eliminar una categoría con productos" }` si los tiene. Una categoría inexistente responde `404`.

### CA-06 — Menú por defecto

**Dado** cualquier visitante,
**cuando** solicita `GET /api/productos`,
**entonces** responde `200` con `{ productos }` que contiene **solo** productos con `disponible: true`.

### CA-07 — Filtro por categoría

**Dado** `?categoria=<id>`,
**cuando** se listan productos,
**entonces** solo se devuelven los de esa categoría; un id con formato inválido responde `400`.

### CA-08 — Búsqueda de texto

**Dado** `?q=<texto>`,
**cuando** se listan productos,
**entonces** se usa `$text` sobre el índice `tx_busqueda` (español, nombre con peso 3) y los resultados se ordenan por `textScore`. Con la base real, `q=verde` devuelve `Bolón de verde` y `Chifles`.

### CA-09 — Incluir no disponibles

**Dado** `?todos=true`,
**cuando** lo solicita un administrador,
**entonces** se incluyen los productos no disponibles; sin token responde `401` y con rol estudiante `403`.

### CA-10 — Detalle de producto

**Dado** un id existente,
**cuando** se solicita `GET /api/productos/:id`,
**entonces** responde `200` con `{ producto }`; si no existe, `404` `{ "error": "Producto no encontrado" }`.

### CA-11 — Crear y editar producto

**Dado** un administrador y un cuerpo válido `{ nombre, descripcion?, precio, imagenUrl?, disponible?, categoriaId }`,
**cuando** solicita `POST /api/productos` o `PUT /api/productos/:id`,
**entonces** la categoría embebida `{ _id, nombre }` se toma de la base a partir de `categoriaId`; el precio se redondea a 2 decimales; `creadoEn` es `Date`. Si la categoría no existe responde `400` `{ "error": "La categoría indicada no existe" }`. Un precio `≤ 0`, una URL inválida o campos desconocidos responden `400`.

### CA-12 — Cambiar disponibilidad

**Dado** un administrador,
**cuando** solicita `PATCH /api/productos/:id/disponible` con `{ disponible: boolean }`,
**entonces** responde `200` con el producto actualizado.

### CA-13 — Eliminar producto

**Dado** un administrador,
**cuando** solicita `DELETE /api/productos/:id`,
**entonces** responde `204`; si no existe, `404`.

### CA-14 — Permisos del CRUD

**Dado** un estudiante autenticado,
**cuando** intenta cualquier escritura de productos o categorías,
**entonces** responde `403`; sin token, `401`.

### CA-15 — Menú del estudiante (frontend)

**Dado** un usuario autenticado en `/menu`,
**cuando** carga la página,
**entonces** ve tarjetas con imagen, nombre, descripción y precio en USD (formato de Ecuador), chips de categoría, un buscador con *debounce*, indicador de carga, estado vacío y mensajes de error; el botón «Agregar al carrito» aparece deshabilitado como «Próximamente».

### CA-16 — Administración (frontend)

**Dado** un administrador,
**cuando** abre `/admin/productos` o `/admin/categorias`,
**entonces** puede crear, editar y eliminar (con confirmación), elegir la categoría en un selector y alternar la disponibilidad con un switch; los errores de la API se muestran en español.

### CA-17 — Rutas y navegación por rol

**Dado** la navbar,
**cuando** el usuario es administrador,
**entonces** ve los enlaces «Menú», «Productos» y «Categorías»; un estudiante solo ve «Menú» y es redirigido a `/menu` si abre una ruta de administración.

### CA-18 — Calidad

**Dado** el código de la fase,
**cuando** se ejecutan lint, pruebas y builds,
**entonces** `npm run lint`, `npm test` y `npm run build` del backend y `npm run build` del frontend terminan sin errores.

## Reglas y restricciones

1. No se crean, borran ni modifican colecciones, validadores ni índices; la búsqueda usa el índice existente `tx_busqueda`.
2. Todos los ids se guardan como `ObjectId`, `creadoEn` como `Date` y el precio redondeado a 2 decimales.
3. La categoría del producto **siempre** se lee de la base; el cliente solo envía `categoriaId`.
4. El slug se genera en el servidor y cumple `^[a-z0-9-]+$`.
5. Toda entrada (cuerpo, parámetros y query) se valida con zod y los esquemas de cuerpo son `.strict()`.
6. Las respuestas de error mantienen el formato `{ error, detalles? }`.

## Fuera de alcance

- Carrito y creación de pedidos (fase 4).
- Subida de imágenes: solo URL externa.
- Paginación del catálogo (12 productos).
- Historial de cambios de precio.
