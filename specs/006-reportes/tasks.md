# Tareas 006 — Reportes del administrador

**Issue:** #7
**Rama:** `006-reportes`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con contratos, pipelines y decisión sobre Chart.js.
- [x] Escribir esta lista de tareas.

## B. Backend

- [x] Extraer `fechaCalendario` y esquemas zod del rango de fechas y `limite` (CA-01, CA-02).
- [x] Servicio con los pipelines B1–B6 y el `$match` inicial de fechas (CA-02 a CA-07).
- [x] Rutas `/api/reportes/*` solo para admin con reloj inyectado (CA-07, CA-09).
- [x] Pruebas de integración: valores exactos, filtros, zona horaria, validación y permisos (CA-01 a CA-09).

## C. Frontend

- [x] Instalar `chart.js` y crear el componente `Grafico` (CA-10).
- [x] Modelos, `ReportesService` y `rangoRapido` con pruebas (CA-10).
- [x] Página «Reportes» con tarjetas, filtro, gráficos y tabla (CA-10, CA-11).
- [x] Ruta, enlace en la navbar y tarjeta en el panel del admin (CA-10).

## D. Verificación y cierre

- [x] Lint, pruebas y build del backend; pruebas y build del frontend (CA-12).
- [x] Prueba real contra la base: «Almuerzo del día» y «Almuerzos» encabezan sus reportes (CA-12).
- [x] Actualizar `README.md`, `specs/README.md` y `docs/`.

## Resultados de la verificación

- Backend: `npm run lint` sin advertencias, `npm test` **10 archivos / 176 pruebas** en verde (32 nuevas en `reportes.test.ts` con datos propios: valores exactos de los seis reportes, desempate por nombre, `limite`, filtros `desde`/`hasta`, rango vacío, pedido de las 23:30 en Ecuador contado el 21/10 y en la hora 23, `400` de validación, `401` y `403`) y `npm run build` sin errores.
- Frontend: `ng build` sin advertencias (Chart.js en el chunk diferido `admin-reportes`, 56 kB comprimido) y `ng test --watch=false` **13 archivos / 57 pruebas** en verde (`ReportesService` y `rangoRapido`/`validarRango`).
- Base real (API en un puerto alterno, solo lectura): más vendido «Almuerzo del día» (20 u., $55,00); categoría con más ingresos «Almuerzos» ($104,00, 58,35 %); resumen de 41 pedidos, $179,85 y ticket $4,39; estudiante → 403; `desde > hasta` → 400.
- Navegador: panel con tarjetas, cuatro gráficos y tabla; «Este mes» fija 01/10–30/10; noviembre muestra «Sin datos en este rango»; a 375 px no hay desplazamiento horizontal.
