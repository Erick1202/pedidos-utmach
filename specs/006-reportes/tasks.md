# Tareas 006 — Reportes del administrador

**Issue:** #7
**Rama:** `006-reportes`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, pipelines y decisión sobre Chart.js.
- [x] Escribir esta lista de tareas.

## B. Backend

- [ ] Extraer `fechaCalendario` y esquemas zod del rango de fechas y `limite` (CA-01, CA-02).
- [ ] Servicio con los pipelines B1–B6 y el `$match` inicial de fechas (CA-02 a CA-07).
- [ ] Rutas `/api/reportes/*` solo para admin con reloj inyectado (CA-07, CA-09).
- [ ] Pruebas de integración: valores exactos, filtros, zona horaria, validación y permisos (CA-01 a CA-09).

## C. Frontend

- [ ] Instalar `chart.js` y crear el componente `Grafico` (CA-10).
- [ ] Modelos, `ReportesService` y `rangoRapido` con pruebas (CA-10).
- [ ] Página «Reportes» con tarjetas, filtro, gráficos y tabla (CA-10, CA-11).
- [ ] Ruta, enlace en la navbar y tarjeta en el panel del admin (CA-10).

## D. Verificación y cierre

- [ ] Lint, pruebas y build del backend; pruebas y build del frontend (CA-12).
- [ ] Prueba real contra la base: «Almuerzo del día» y «Almuerzos» encabezan sus reportes (CA-12).
- [ ] Actualizar `README.md`, `specs/README.md` y `docs/`.
