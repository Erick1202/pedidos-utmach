# Plan 007 — Integración y despliegue continuos

## Decisiones técnicas

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Runner | `ubuntu-latest`, Node 22 (`actions/setup-node@v4`) | Artículo IX.4: el local usa Node 24 y el CI Node 22. |
| Caché de npm | `cache: npm` + `cache-dependency-path` por job | Cada paquete tiene su propio `package-lock.json`. |
| Binario de MongoDB | `actions/cache@v4` sobre `~/.cache/mongodb-binaries`, llave `mongodb-binaries-${{ runner.os }}-${{ hashFiles('backend/package-lock.json') }}` | La versión del binario depende de `mongodb-memory-server`, fijada en el lock; evita descargar ~780 MB por ejecución. |
| Concurrencia | `group: ci-${{ github.ref }}`, `cancel-in-progress: true` | Cancela ejecuciones viejas de la misma rama o PR. |
| Permisos | `contents: read` global; `pages: write` e `id-token: write` solo en `deploy` | Mínimo privilegio. |
| Pruebas del frontend | `ng test --watch=false --browsers=ChromeHeadless` con `@vitest/browser-playwright` + `playwright` | El builder `@angular/build:unit-test` (Vitest) usa jsdom salvo que se indique `browsers`; para un navegador real necesita un proveedor. Se elige Playwright porque descarga su Chromium con `npx playwright install --with-deps chromium`. |
| `--no-sandbox` | No se agrega | Playwright lanza Chromium con `chromiumSandbox: false` por defecto (equivale a `--no-sandbox`), así que funciona en Linux del CI sin cambios. |
| Script local | `npm run test:ci` en `frontend` | Los mismos comandos del CI se pueden ejecutar en Windows; `npm test` sigue usando jsdom para el ciclo rápido. |
| Build de Pages | `ng build --base-href /pedidos-utmach/` y `cp index.html 404.html` en `dist/pedidos-utmach/browser` | GitHub Pages sirve `404.html` en rutas desconocidas; así Angular resuelve `/pedidos-utmach/menu` al recargar. |
| Artefacto | `actions/upload-pages-artifact@v3` solo con `github.event_name == 'push'` | En PR no se publica nada. |
| Deploy | `actions/deploy-pages@v4`, `environment: github-pages`, `needs: [backend, frontend]`, `if: push a main` | Contrato de la constitución (Artículo X.4). |
| Entorno de producción | `environment.prod.ts` + `fileReplacements` en la configuración `production` | Artículo VII.4. La URL es la misma (`http://localhost:3000/api`) porque el backend corre en la PC de la demo. |
| CORS | Variable `CORS_ORIGINS` validada con zod; `crearApp` recibe `origenesCors` (por defecto `ORIGENES_CORS_POR_DEFECTO`) | La app de Pages (`https://erick1202.github.io`) llama al backend local. |

## Excepción a la constitución

El Artículo III.6 limita CORS a `http://localhost:4200`. Esta fase lo amplía a una lista configurable que, por defecto, agrega `https://erick1202.github.io` (el origen de GitHub Pages; el navegador no envía la ruta `/pedidos-utmach/` en `Origin`). Se enmienda la constitución a la versión **1.2.0** en este mismo PR.

## Contrato de configuración

```dotenv
# Lista separada por comas; cada valor debe ser un origen http(s) sin ruta.
CORS_ORIGINS=http://localhost:4200,https://erick1202.github.io
```

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una página HTTPS llamando a `http://localhost` | Los navegadores tratan `localhost` como origen seguro (no es contenido mixto). Chrome puede pedir el permiso «Acceso a la red local»: se documenta que hay que aceptarlo. |
| Pages no habilitado | `deploy-pages` falla; se documenta activar *Settings → Pages → Source: GitHub Actions*. |
| Descarga de Chromium en cada ejecución | ~150 MB, aceptable; no se cachea para no depender de la versión de Playwright en la llave. |
| Caché de binarios desactualizada | La llave cambia con el lock; `restore-keys` reutiliza la anterior y `mongodb-memory-server` descarga solo si la versión no coincide. |

## Alternativas descartadas

- **Karma + karma-chrome-launcher:** Angular 22 usa Vitest por defecto; volver a Karma cambiaría el runner del proyecto.
- **Desplegar el backend en Render en esta fase:** queda como opción futura en `docs/despliegue.md`; la demo usa la base local que ya existe.
- **Un único job:** se separan para usarlos como status checks y paralelizar.
