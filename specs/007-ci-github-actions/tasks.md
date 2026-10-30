# Tareas 007 — Integración y despliegue continuos

**Issue:** #8
**Rama:** `ci/github-actions`

> Convención: `[x]` completado, `[ ]` pendiente. Cada tarea se marca en el commit que la completa.

## A. Especificación

- [x] Escribir `spec.md` con historias, criterios y reglas.
- [x] Escribir `plan.md` con decisiones, excepción de CORS y riesgos.
- [x] Escribir esta lista de tareas.

## B. Backend

- [x] `CORS_ORIGINS` en `entorno.ts` con valores por defecto y validación (CA-08).
- [x] `crearApp` recibe `origenesCors`; `server.ts` la pasa desde el entorno (CA-08).
- [x] Pruebas de CORS: orígenes por defecto, lista personalizada y origen ajeno (CA-08).
- [x] Actualizar `.env.example` (CA-08).

## C. Frontend

- [x] `environment.prod.ts` y `fileReplacements` en `production` (CA-07).
- [x] Instalar `@vitest/browser-playwright` y `playwright`; script `test:ci` con Chromium headless (CA-03).

## D. Pipeline

- [x] `.github/workflows/ci.yml` con disparadores y concurrencia (CA-01).
- [x] Job `backend` con caché de npm y de binarios de MongoDB (CA-02).
- [x] Job `frontend` con pruebas en ChromeHeadless, build, `404.html` y artefacto (CA-03, CA-04).
- [x] Job `deploy` con GitHub Pages (CA-05, CA-06).

## E. Documentación y cierre

- [x] `docs/despliegue.md`: demo local, pipeline con Mermaid y migración futura a Atlas (CA-09).
- [ ] README: «Integración continua», badge, app publicada, backend local y fases en ✅ (CA-09).
- [ ] `specs/README.md`, `docs/README.md` y enmienda 1.2.0 de la constitución.
- [ ] Validar el YAML y ejecutar localmente los comandos de los jobs `backend` y `frontend`.
