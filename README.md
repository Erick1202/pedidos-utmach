# PedidosUTMACH

[![CI](https://github.com/Erick1202/pedidos-utmach/actions/workflows/ci.yml/badge.svg)](https://github.com/Erick1202/pedidos-utmach/actions/workflows/ci.yml)

Aplicación web para pedir comida con anticipación en el bar de la **Universidad Técnica de Machala** y recogerla a la hora elegida, sin hacer fila en los recesos. Los pagos son simulados y quedan fuera del alcance del proyecto.

> Proyecto académico desarrollado para las materias **Programación Móvil** (Angular, Git, GitHub Actions y Spec Driven Development) y **Bases de Datos No Estructuradas** (MongoDB: modelado de documentos, validación, índices y agregaciones).

## Integrantes

- Erick Patricio Dumas Parrales
- Hermione Paulette Ortiz Córdova

## Alcance funcional

| Historia | Rol | Descripción |
| --- | --- | --- |
| HU-01 | Estudiante | Registrarse e iniciar sesión con correo y contraseña. |
| HU-02 | Estudiante | Ver el menú por categoría, buscar productos y ver solo los disponibles. |
| HU-03 | Estudiante | Carrito con cantidades editables y total recalculado. |
| HU-04 | Estudiante | Confirmar el pedido con una hora de recogida posterior a la actual y entre 07:00 y 16:00. |
| HU-05 | Estudiante | Ver «Mis pedidos» y el avance de su estado: recibido → preparando → listo → entregado. |
| HU-06 | Admin | CRUD de productos (imagen por URL externa y campo disponible sí/no) y de categorías. |
| HU-07 | Admin | Ver los pedidos activos ordenados por hora de recogida y avanzar su estado. |
| HU-08 | Admin | Panel de reportes con agregaciones de MongoDB y gráficos. |

## Stack

| Capa | Tecnologías |
| --- | --- |
| Frontend | Angular 22 (componentes standalone, signals, Router, HttpClient), Tailwind CSS v4 (`@tailwindcss/postcss`), Chart.js, TypeScript estricto. |
| Backend | Node.js 22+, Express 5, TypeScript, driver oficial `mongodb` (sin Mongoose), `bcryptjs`, `jsonwebtoken`, `zod`, `cors`, `dotenv`. |
| Base de datos | MongoDB local `mongodb://127.0.0.1:27017/pedidos_utmach` (compatible con MongoDB Atlas cambiando solo la URI). La base ya está creada y poblada. |
| Pruebas | Backend: Vitest + supertest + mongodb-memory-server. Frontend: runner por defecto de Angular (`ng test`, Vitest) en jsdom y, en el CI, en Chromium headless. |
| CI/CD | GitHub Actions + GitHub Pages (frontend). El backend corre en la PC de la demo (Atlas + nube como opción futura). |

## Estructura del repositorio

```text
PROYECTOPARCIAL/
├── .github/
│   └── workflows/ci.yml          # CI: lint, pruebas, build y despliegue (fase 7)
├── backend/                      # API REST Express + TypeScript
│   ├── src/
│   │   ├── config/               # Variables de entorno validadas con zod
│   │   ├── db/                   # Conexión y conteos de MongoDB
│   │   ├── middleware/           # Autenticación, autorización, 404 y errores
│   │   ├── modules/              # salud, auth, categorias, productos, pedidos, reportes
│   │   ├── utils/                # ErrorAplicacion y traducción de errores
│   │   ├── app.ts                # crearApp(db, { jwtSecret })
│   │   └── server.ts             # Arranque, ping, conteos y apagado ordenado
│   ├── tests/                    # Pruebas con MongoDB en memoria (nunca la BD local)
│   └── .env.example
├── database/                     # Scripts de la base existente (fuente de verdad)
│   ├── pedidos_utmach.js         # Colecciones, validadores, índices y datos de prueba
│   └── consultas_pedidos_utmach.js
├── frontend/                     # Aplicación Angular 22
│   └── src/
│       ├── app/
│       │   ├── core/             # Modelos, AuthService, almacenamiento, interceptor y guards
│       │   ├── features/         # Login, registro, menú, carrito, confirmación y administración
│       │   └── layout/           # Navbar y contenedor de rutas protegidas
│       └── environments/         # URL de la API por entorno
├── docs/                         # Modelo de datos, consultas, Studio 3T, despliegue
├── specs/                        # Spec Driven Development
│   ├── constitution.md
│   └── 00X-nombre/               # spec.md, plan.md, tasks.md por funcionalidad
├── README.md
└── package.json                  # Scripts de conveniencia del monorepo
```

## Requisitos

- **Windows 10/11** con PowerShell (los comandos de esta guía usan PowerShell).
- **Node.js** en una versión compatible con Angular 22 (`^22.22.3`, `^24.15.0` o `>=26`) y npm 10 o superior.
- **MongoDB Community Server** instalado y corriendo como servicio de Windows (servicio `MongoDB`).
- **Git** 2.40 o superior.
- **Angular CLI** (opcional, se puede usar `npx ng`). La versión del proyecto la fija `frontend/package.json`.
- **Studio 3T Community** (recomendado para revisar la base y ejecutar los scripts).

> ⚠️ La URI del proyecto usa `127.0.0.1`, **no** `localhost`: en Windows, Node puede resolver `localhost` como IPv6 (`::1`) y MongoDB escucha en IPv4, lo que provoca `ECONNREFUSED`.

## Puesta en marcha en Windows

### 1. Clonar e instalar dependencias

```powershell
git clone https://github.com/Erick1202/pedidos-utmach.git
cd pedidos-utmach
npm run install:all
```

### 2. Configurar las variables de entorno del backend

```powershell
Copy-Item backend/.env.example backend/.env
```

Edita `backend/.env` si hace falta. Los valores por defecto son:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/pedidos_utmach
JWT_SECRET=cambia-este-secreto-por-uno-largo-y-aleatorio
PORT=3000
CORS_ORIGINS=http://localhost:4200,https://erick1202.github.io
```

`backend/.env` está en `.gitignore`: **nunca** se sube al repositorio.

### 3. Verificar el servicio de MongoDB

```powershell
Get-Service -Name "MongoDB"
```

Debe mostrar `Status: Running`. Si no está corriendo:

```powershell
Start-Service -Name "MongoDB"
```

### 4. Crear o restaurar la base de datos (solo si no existe)

La base `pedidos_utmach` **ya está creada** en el equipo del proyecto. Si necesitas recrearla en otra máquina o restaurar los datos de prueba:

1. Abre **Studio 3T** y selecciona la conexión **MongoDB Local-Tienda** (`mongodb://127.0.0.1:27017`).
2. Clic derecho sobre la conexión → **Refresh All**.
3. Abre **IntelliShell** (`Tools → IntelliShell`).
4. Abre el archivo `database/pedidos_utmach.js` y ejecútalo completo.
5. Verifica los conteos: **6 usuarios, 4 categorías, 12 productos y 40 pedidos**.

> ⚠️ El script comienza con `db.dropDatabase()` y **borra solo** `pedidos_utmach`. No lo ejecutes si tienes pedidos que quieres conservar. No toca las bases `admin`, `config` ni `local`.

Si tienes `mongosh` en el PATH, la alternativa es:

```powershell
mongosh "mongodb://127.0.0.1:27017/pedidos_utmach" database/pedidos_utmach.js
```

### 5. Levantar backend y frontend

En dos terminales distintas, desde la raíz del repositorio:

```powershell
# Terminal 1 - API en http://localhost:3000
npm run dev:backend
```

```powershell
# Terminal 2 - aplicación en http://localhost:4200
npm run dev:frontend
```

Al arrancar, el backend verifica la conexión con un `ping` e imprime los conteos de las cuatro colecciones. Abre <http://localhost:4200> en el navegador.

## Usuarios de prueba

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@utmachala.edu.ec` | `Admin123*` |
| Estudiante | `ana.torres@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `luis.ramirez@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `maria.castillo@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `carlos.pineda@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `sofia.herrera@utmachala.edu.ec` | `Estudiante123*` |

## API REST

Todas las rutas usan el prefijo `/api` y responden JSON.

| Recurso | Endpoints | Rol |
| --- | --- | --- |
| Salud | `GET /salud` | Público |
| Autenticación | `POST /auth/registro`, `POST /auth/login`, `GET /auth/perfil` | Público / autenticado |
| Categorías | `GET /categorias` | Público |
| Categorías (admin) | `POST /categorias`, `PUT /categorias/:id`, `DELETE /categorias/:id` | Admin |
| Productos | `GET /productos?categoria=&q=`, `GET /productos/:id` (`?todos=true` solo admin) | Público |
| Productos (admin) | `POST /productos`, `PUT /productos/:id`, `PATCH /productos/:id/disponible`, `DELETE /productos/:id` | Admin |
| Pedidos | `POST /pedidos`, `GET /pedidos/mios` | Estudiante |
| Pedidos (admin) | `GET /pedidos/activos`, `PATCH /pedidos/:id/estado` | Admin |
| Reportes | `GET /reportes/mas-vendidos`, `/ventas-por-dia`, `/hora-pico`, `/ventas-por-categoria`, `/por-estudiante`, `/resumen` (`?desde=&hasta=`) | Admin |

El detalle de cada endpoint se documenta en [`specs/`](specs/) y en las pruebas del backend. Hasta la fase 6 están implementados **Salud**, **Autenticación**, **Categorías**, **Productos**, **Pedidos** y **Reportes**: creación (contrato en [`specs/004-carrito-pedido/plan.md`](specs/004-carrito-pedido/plan.md)), `GET /pedidos/mios?limite`, `GET /pedidos/activos?fecha=AAAA-MM-DD` y `PATCH /pedidos/:id/estado` (contrato en [`specs/005-estado-pedidos/plan.md`](specs/005-estado-pedidos/plan.md)). Los reportes usan las agregaciones B1–B6 de `database/consultas_pedidos_utmach.js` (contrato en [`specs/006-reportes/plan.md`](specs/006-reportes/plan.md) y explicación en [`docs/consultas-mongodb.md`](docs/consultas-mongodb.md)).

## Pruebas

```powershell
# Backend: Vitest + supertest + mongodb-memory-server (nunca usa la base local)
npm run test:backend

# Frontend: runner por defecto de Angular
npm run test:frontend

# Ambas suites
npm test

# Frontend en Chromium headless, como en el CI (la primera vez: npx playwright install chromium)
npm run test:ci --prefix frontend
```

> Las pruebas del backend levantan una instancia efímera de MongoDB en memoria con los mismos validadores e índices de `database/pedidos_utmach.js`. La base `pedidos_utmach` de tu máquina no se lee ni se modifica durante las pruebas.

## Integración continua

[![CI](https://github.com/Erick1202/pedidos-utmach/actions/workflows/ci.yml/badge.svg)](https://github.com/Erick1202/pedidos-utmach/actions/workflows/ci.yml)

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en cada Pull Request hacia `main` y en cada `push` a `main`:

| Job | Pasos |
| --- | --- |
| `backend` | `npm ci`, lint, pruebas con MongoDB en memoria (binario en caché) y build. |
| `frontend` | `npm ci`, pruebas en Chromium headless, build con `--base-href /pedidos-utmach/` y `404.html` para las rutas de Angular. |
| `deploy` | Solo en `push` a `main`: publica el frontend en GitHub Pages. |

**App publicada:** <https://erick1202.github.io/pedidos-utmach/>

> ⚠️ La app publicada consume la API en `http://localhost:3000/api`. Para usarla, en el mismo equipo deben estar corriendo **MongoDB** (servicio `MongoDB`) y el **backend** (`npm run dev:backend`). Si el navegador pide permiso para acceder a la red local, acéptalo. Guía completa y migración futura a MongoDB Atlas en [`docs/despliegue.md`](docs/despliegue.md).

## Flujo de trabajo Git (GitHub Flow + SDD)

1. `main` siempre debe quedar desplegable y **solo recibe cambios por Pull Request** con el CI en verde.
2. Cada fase se desarrolla en su propia rama, creada desde `main`:

   | Fase | Issue | Rama |
   | --- | --- | --- |
   | 0 | — | `chore/estructura` |
   | 1 | #2 | `001-backend-base` |
   | 2 | #3 | `002-autenticacion` |
   | 3 | #4 | `003-menu-productos` |
   | 4 | #5 | `004-carrito-pedido` |
   | 5 | #6 | `005-estado-pedidos` |
   | 6 | #7 | `006-reportes` |
   | 7 | #8 | `ci/github-actions` |

3. Antes de escribir código se crean `specs/00X-nombre/spec.md`, `plan.md` y `tasks.md`. Las tareas se marcan a medida que avanzan.
4. Los commits siguen **Conventional Commits** en español, con cambios pequeños y un solo propósito:

   ```text
   feat(pedidos): calcular el total del pedido en el servidor
   test(pedidos): agregar casos límite del total
   fix(auth): rechazar tokens expirados
   docs(studio3t): documentar los pipelines de reportes
   ci: ejecutar las pruebas en cada pull request
   chore: configurar ESLint del backend
   ```

5. En las funcionalidades con TDD (total del pedido, hora de recogida y transición de estados) se hace primero el commit `test:` con la prueba en rojo y después el commit `feat:` que la pone en verde.
6. No se hace push directo a `main` ni se fusiona localmente: cada PR lo abre y lo revisa el equipo en GitHub.

## Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Colecciones, validadores, índices, diagrama Mermaid, decisiones de embebido/referencia y comparación con el modelo relacional. |
| [`docs/consultas-mongodb.md`](docs/consultas-mongodb.md) | Consultas y agregaciones en `mongosh`, índices y `explain("executionStats")`. |
| [`docs/studio3t.md`](docs/studio3t.md) | Guía de Studio 3T con consultas listas para IntelliShell y capturas sugeridas. |
| [`docs/despliegue.md`](docs/despliegue.md) | Demo local en Windows, funcionamiento del pipeline y migración futura a MongoDB Atlas + backend en la nube. |
| [`database/pedidos_utmach.js`](database/pedidos_utmach.js) | Script de creación de la base (fuente de verdad del esquema). |
| [`database/consultas_pedidos_utmach.js`](database/consultas_pedidos_utmach.js) | Consultas, agregaciones y planes de ejecución de referencia. |
| [`specs/constitution.md`](specs/constitution.md) | Principios no negociables del proyecto. |
| [`specs/`](specs/) | Especificaciones, planes y tareas por funcionalidad. |

## Estado del proyecto

| Fase | Rama | Estado |
| --- | --- | --- |
| 0 · Estructura del monorepo | `chore/estructura` | ✅ Completada |
| 1 · Backend base y documentación del modelo | `001-backend-base` | ✅ Completada |
| 2 · Autenticación y guards | `002-autenticacion` | ✅ Completada |
| 3 · Menú, productos y admin | `003-menu-productos` | ✅ Completada |
| 4 · Carrito y pedido | `004-carrito-pedido` | ✅ Completada |
| 5 · Estados de pedidos | `005-estado-pedidos` | ✅ Completada |
| 6 · Reportes | `006-reportes` | ✅ Completada |
| 7 · CI y despliegue | `ci/github-actions` | ✅ Completada |

---

Proyecto académico de la Universidad Técnica de Machala. Pagos simulados: no se procesan transacciones reales.
