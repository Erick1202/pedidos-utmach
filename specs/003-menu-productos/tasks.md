# Tareas 003 — Menú, productos y categorías

**Issue:** #4
**Rama:** `003-menu-productos`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, consultas y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — categorías

- [x] Crear el esquema `idMongo` y el redondeo a 2 decimales en `utils/validacion.ts`.
- [x] Implementar `generarSlug` (CA-02).
- [x] `GET /api/categorias` ordenado por nombre (CA-01).
- [x] `POST /api/categorias` con slug y `409` por duplicado (CA-02, CA-03).
- [x] `PUT /api/categorias/:id` con `updateMany` de la copia embebida (CA-04).
- [x] `DELETE /api/categorias/:id` con `409` si tiene productos (CA-05).

## C. Backend — productos

- [x] `GET /api/productos` con solo disponibles, filtro por categoría y `$text` ordenado por `textScore` (CA-06, CA-07, CA-08).
- [x] `?todos=true` solo para admin (CA-09).
- [x] `GET /api/productos/:id` (CA-10).
- [x] `POST` y `PUT` con categoría embebida desde la BD y precio redondeado (CA-11).
- [x] `PATCH /api/productos/:id/disponible` (CA-12).
- [x] `DELETE /api/productos/:id` (CA-13).
- [x] Montar las rutas en `crearApp` con `autenticar` + `autorizarPorRol("admin")` (CA-14).

## D. Backend — pruebas

- [x] Ampliar el helper con la categoría `Bebidas`.
- [x] Probar categorías: listado, slug, duplicado, renombrado con `updateMany`, borrado con y sin productos.
- [x] Probar productos: filtros, `$text`, `todos`, detalle, CRUD y validaciones.
- [x] Probar permisos: estudiante `403` y sin token `401` en el CRUD.
- [x] Ejecutar lint, pruebas y build del backend (CA-18).

## E. Frontend — catálogo

- [x] Definir los modelos `Categoria`, `Producto` y `DatosProducto`.
- [x] Crear `CategoriasService` y `ProductosService` con pruebas.
- [x] Registrar la configuración regional `es-EC` para los precios.
- [x] Menú del estudiante: tarjetas, chips, buscador con debounce, carga, vacío, error y botón «Próximamente» (CA-15).

## F. Frontend — administración

- [x] Admin de productos: listado, formulario de crear/editar con selector de categoría, switch de disponibilidad y eliminación (CA-16).
- [x] Admin de categorías: lista, crear, editar y eliminar (CA-16).
- [x] Rutas protegidas por rol y enlaces en la navbar (CA-17).

## G. Verificación y cierre

- [x] `npm run build --prefix frontend` y `npm test --prefix frontend -- --watch=false` en verde.
- [x] Verificar contra la base real: 11 productos disponibles y `q=verde` → Bolón de verde y Chifles.
- [x] Actualizar `README.md`, `specs/README.md` y la documentación de la API.
- [x] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #4.

## Resultados de la verificación

- Backend: `npm run lint` sin advertencias, `npm test` **6 archivos / 81 pruebas** en verde y `npm run build` sin errores.
- Frontend: `npm run build` sin errores y `npm test -- --watch=false` **6 archivos / 24 pruebas** en verde.
- Base real (solo lecturas): `GET /api/productos` → 11 productos sin Tigrillo; `?q=verde` → Bolón de verde y Chifles; `?todos=true` → 401 sin token y 12 productos como admin; `DELETE` como estudiante → 403.
- Navegador a 375 px: menú con 11 tarjetas, búsqueda con debounce, precios `$1,50` y sin desplazamiento horizontal; `/admin/productos` con switches de disponibilidad.
