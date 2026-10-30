# Tareas 003 — Menú, productos y categorías

**Issue:** #4
**Rama:** `003-menu-productos`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, consultas y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend — categorías

- [ ] Crear el esquema `idMongo` y el redondeo a 2 decimales en `utils/validacion.ts`.
- [ ] Implementar `generarSlug` (CA-02).
- [ ] `GET /api/categorias` ordenado por nombre (CA-01).
- [ ] `POST /api/categorias` con slug y `409` por duplicado (CA-02, CA-03).
- [ ] `PUT /api/categorias/:id` con `updateMany` de la copia embebida (CA-04).
- [ ] `DELETE /api/categorias/:id` con `409` si tiene productos (CA-05).

## C. Backend — productos

- [ ] `GET /api/productos` con solo disponibles, filtro por categoría y `$text` ordenado por `textScore` (CA-06, CA-07, CA-08).
- [ ] `?todos=true` solo para admin (CA-09).
- [ ] `GET /api/productos/:id` (CA-10).
- [ ] `POST` y `PUT` con categoría embebida desde la BD y precio redondeado (CA-11).
- [ ] `PATCH /api/productos/:id/disponible` (CA-12).
- [ ] `DELETE /api/productos/:id` (CA-13).
- [ ] Montar las rutas en `crearApp` con `autenticar` + `autorizarPorRol("admin")` (CA-14).

## D. Backend — pruebas

- [ ] Ampliar el helper con la categoría `Bebidas`.
- [ ] Probar categorías: listado, slug, duplicado, renombrado con `updateMany`, borrado con y sin productos.
- [ ] Probar productos: filtros, `$text`, `todos`, detalle, CRUD y validaciones.
- [ ] Probar permisos: estudiante `403` y sin token `401` en el CRUD.
- [ ] Ejecutar lint, pruebas y build del backend (CA-18).

## E. Frontend — catálogo

- [ ] Definir los modelos `Categoria`, `Producto` y `DatosProducto`.
- [ ] Crear `CategoriasService` y `ProductosService` con pruebas.
- [ ] Registrar la configuración regional `es-EC` para los precios.
- [ ] Menú del estudiante: tarjetas, chips, buscador con debounce, carga, vacío, error y botón «Próximamente» (CA-15).

## F. Frontend — administración

- [ ] Admin de productos: listado, formulario de crear/editar con selector de categoría, switch de disponibilidad y eliminación (CA-16).
- [ ] Admin de categorías: lista, crear, editar y eliminar (CA-16).
- [ ] Rutas protegidas por rol y enlaces en la navbar (CA-17).

## G. Verificación y cierre

- [ ] `npm run build --prefix frontend` y `npm test --prefix frontend -- --watch=false` en verde.
- [ ] Verificar contra la base real: 11 productos disponibles y `q=verde` → Bolón de verde y Chifles.
- [ ] Actualizar `README.md`, `specs/README.md` y la documentación de la API.
- [ ] Commits en Conventional Commits y rama lista para el PR que cierra el Issue #4.
