# Especificación 007 — Integración y despliegue continuos

**Issue:** #8
**Rama:** `ci/github-actions`
**Estado:** completada
**Depende de:** fases 0 a 6 (backend con lint, pruebas y build; frontend con `ng test` y `ng build`).

## Contexto

Hasta ahora la calidad se verificaba a mano antes de abrir cada Pull Request. Esta fase automatiza esa verificación con GitHub Actions y publica el frontend en GitHub Pages en cada `push` a `main`. El backend no se despliega: durante la demo se ejecuta en la PC del equipo junto con la base `pedidos_utmach` local.

## Historias de usuario

### HU-C01 — Verificación automática de cada PR

Como integrante del equipo, quiero que cada Pull Request hacia `main` ejecute lint, pruebas y build de backend y frontend, para no fusionar cambios que rompan el proyecto.

### HU-C02 — Publicación automática del frontend

Como equipo, queremos que cada `push` a `main` publique el frontend en `https://erick1202.github.io/pedidos-utmach/`, para mostrar siempre la última versión estable.

### HU-C03 — Demo con backend local

Como presentador, quiero abrir la app publicada y que consuma la API que corre en mi PC, para hacer la demo sin desplegar el backend ni la base.

## Criterios de aceptación

### CA-01 — Disparadores y concurrencia

**Dado** el workflow `.github/workflows/ci.yml`,
**cuando** se abre o actualiza un PR hacia `main` o se hace `push` a `main`,
**entonces** se ejecuta; una ejecución nueva de la misma rama cancela la anterior que siga en curso.

### CA-02 — Job `backend`

**Dado** Node 22 con caché de npm basada en `backend/package-lock.json`,
**cuando** corre el job `backend`,
**entonces** ejecuta `npm ci`, `npm run lint`, `npm test` y `npm run build`, y reutiliza el binario de `mongodb-memory-server` desde `~/.cache/mongodb-binaries` con una llave basada en `backend/package-lock.json`.

### CA-03 — Job `frontend`

**Dado** Node 22 con caché de npm basada en `frontend/package-lock.json`,
**cuando** corre el job `frontend`,
**entonces** ejecuta `npm ci`, `ng test --watch=false` en ChromeHeadless y `ng build --base-href /pedidos-utmach/`, y copia `index.html` a `404.html` en la carpeta de salida.

### CA-04 — Artefacto de Pages

**Dado** un `push` a `main`,
**cuando** termina el job `frontend`,
**entonces** sube la carpeta `browser` con `actions/upload-pages-artifact`. En un PR no se sube artefacto.

### CA-05 — Job `deploy`

**Dado** un `push` a `main` con `backend` y `frontend` en verde,
**cuando** corre el job `deploy`,
**entonces** publica el artefacto con `actions/deploy-pages` en el entorno `github-pages`, con permisos `pages: write` e `id-token: write`. En un PR el job no se ejecuta.

### CA-06 — Nombres estables

**Dado** que los jobs se usarán como status checks obligatorios,
**entonces** se llaman exactamente `backend`, `frontend` y `deploy`.

### CA-07 — Entorno de producción del frontend

**Dado** el build de producción,
**cuando** se carga la app publicada,
**entonces** usa `environment.prod.ts` con `produccion: true` y `apiUrl = http://localhost:3000/api`.

### CA-08 — CORS configurable

**Dado** el backend,
**cuando** recibe una petición con cabecera `Origin`,
**entonces** solo responde `Access-Control-Allow-Origin` para los orígenes de `CORS_ORIGINS` (lista separada por comas), que por defecto son `http://localhost:4200` y `https://erick1202.github.io`. Un valor que no sea un origen `http(s)` válido detiene el arranque con un mensaje en español.

### CA-09 — Documentación

**Dado** el cierre del proyecto,
**entonces** `docs/despliegue.md` explica la demo local en Windows, el pipeline (diagrama Mermaid) y la migración futura a MongoDB Atlas; el README muestra el badge del CI, el enlace a la app publicada, el requisito del backend local y todas las fases en ✅.

## Reglas

- Las pruebas del backend solo usan `mongodb-memory-server`; el CI nunca se conecta a una base real.
- El CI no usa secretos: el backend de pruebas recibe el secreto JWT desde el helper.
- No se desactivan pruebas ni reglas de lint para pasar el CI.

## Fuera de alcance

- Desplegar el backend o la base en la nube (se documenta como opción futura).
- Pruebas end-to-end y reportes de cobertura en el CI.
- Configurar la protección de rama en GitHub (la hace el equipo; ver `docs/despliegue.md`).
