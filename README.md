# PedidosUTMACH

Aplicación web para pedir comida con anticipación en el bar de la **Universidad Técnica de Machala** y recogerla a la hora elegida, sin hacer fila en los recesos. Los pagos son simulados y quedan fuera del alcance del proyecto.

> Proyecto académico desarrollado para las materias **Programación Móvil** (Angular, Git, GitHub Actions y Spec Driven Development) y **Bases de Datos No Estructuradas** (MongoDB: modelado de documentos, validación, índices y agregaciones).

## Integrantes

- [Nombre 1]
- [Nombre 2]

## Alcance funcional

| Historia | Rol | Descripción |
| --- | --- | --- |
| HU-01 | Estudiante | Registrarse e iniciar sesión con correo y contraseña. |
| HU-02 | Estudiante | Ver el menú por categoría, buscar productos y ver solo los disponibles. |
| HU-03 | Estudiante | Carrito con cantidades editables y total recalculado. |
| HU-04 | Estudiante | Confirmar el pedido con una hora de recogida posterior a la actual y entre 07:00 y 16:00. |
| HU-05 | Estudiante | Ver «Mis pedidos» y el avance de su estado: recibido → preparando → listo → entregado. |
| HU-06 | Admin | CRUD de productos (imagen por URL externa y campo disponible sí/no). |
| HU-07 | Admin | Ver los pedidos del día ordenados por hora de recogida y avanzar su estado. |
| HU-08 | Admin | Panel de reportes con agregaciones de MongoDB y gráficos. |

## Stack

| Capa | Tecnologías |
| --- | --- |
| Frontend | Angular 22 (componentes standalone, signals, Router, HttpClient), Tailwind CSS v4 (`@tailwindcss/postcss`), Chart.js, TypeScript estricto. |
| Backend | Node.js 22+, Express 5, TypeScript, driver oficial `mongodb` (sin Mongoose), `bcrypt`, `jsonwebtoken`, `zod`, `cors`. |
| Base de datos | MongoDB local `mongodb://127.0.0.1:27017/pedidos_utmach` (compatible con MongoDB Atlas cambiando solo la URI). |
| Pruebas | Backend: Vitest + supertest + mongodb-memory-server. Frontend: runner por defecto de Angular (`ng test`). |
| CI/CD | GitHub Actions + GitHub Pages (frontend) y Render (backend, opcional). |

## Estructura del repositorio

```text
PROYECTOPARCIAL/
├── .github/
│   └── workflows/ci.yml          # CI: lint, pruebas, build y despliegue (fase 7)
├── backend/                      # API REST Express + TypeScript
│   ├── src/
│   │   ├── config/               # Variables de entorno validadas y constantes
│   │   ├── db/                   # Cliente MongoDB, setup.ts, seed.ts
│   │   ├── middleware/           # Autenticación JWT, autorización por rol, errores
│   │   ├── modules/              # auth, categorias, productos, pedidos, reportes
│   │   ├── app.ts                # Composición de Express
│   │   └── server.ts             # Arranque del servidor
│   ├── tests/                    # Pruebas de integración (memoria, nunca la BD local)
│   └── .env.example
├── frontend/                     # Aplicación Angular
│   └── src/
│       ├── app/
│       │   ├── core/             # Modelos, servicios, interceptores y guards
│       │   ├── features/         # auth, menu, carrito, pedidos, admin
│       │   └── shared/           # Componentes reutilizables
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
- **Node.js 22.12 o superior** y npm 10 o superior. El proyecto también funciona con Node 24.
- **MongoDB Community Server** instalado y corriendo como servicio de Windows (servicio `MongoDB`). La base `pedidos_utmach` **no** se crea a mano: la crea `npm run seed`.
- **Git** 2.40 o superior.
- **Angular CLI** (opcional, se puede usar `npx ng`). La versión del proyecto la fija `frontend/package.json`.
- **Studio 3T Community** (opcional, recomendado para revisar la base y tomar capturas).

> ⚠️ La URI del proyecto usa `127.0.0.1`, **no** `localhost`: en Windows, Node puede resolver `localhost` como IPv6 (`::1`) y MongoDB escucha en IPv4, lo que provoca `ECONNREFUSED`.

## Puesta en marcha en Windows

> ℹ️ La fase 0 solo crea la estructura del monorepo y la documentación. Los comandos de instalación, base de datos y ejecución quedan operativos al completar la **fase 1** (backend) y la **fase 2** (frontend); consulta la tabla de estado al final del documento.

### 1. Clonar e instalar dependencias

```powershell
git clone https://github.com/<usuario>/<repositorio>.git
cd <repositorio>
npm run install:all
```

### 2. Configurar las variables de entorno del backend

```powershell
Copy-Item backend/.env.example backend/.env
```

Edita `backend/.env` si hace falta. Los valores por defecto son:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/pedidos_utmach
JWT_SECRET=cambia-este-secreto-en-tu-maquina
PORT=3000
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

### 4. Crear colecciones, validadores e índices

```powershell
npm run db:setup
```

Este comando es idempotente: se puede ejecutar varias veces sin errores.

### 5. Cargar los datos de ejemplo

```powershell
npm run seed
```

Borra y recrea **solo** la base `pedidos_utmach`, ejecuta el setup e inserta categorías, productos, usuarios y pedidos de ejemplo. No toca las bases `admin`, `config` ni `local`.

### 6. Levantar backend y frontend

En dos terminales distintas, desde la raíz del repositorio:

```powershell
# Terminal 1 - API en http://localhost:3000
npm run dev:backend
```

```powershell
# Terminal 2 - aplicación en http://localhost:4200
npm run dev:frontend
```

Abre <http://localhost:4200> en el navegador.

## Usuarios de prueba

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@utmachala.edu.ec` | `Admin123*` |
| Estudiante | `estudiante1@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `estudiante2@utmachala.edu.ec` | `Estudiante123*` |
| Estudiante | `estudiante3@utmachala.edu.ec` | `Estudiante123*` |

## API REST

Todas las rutas usan el prefijo `/api` y responden JSON.

| Recurso | Endpoints | Rol |
| --- | --- | --- |
| Autenticación | `POST /auth/registro`, `POST /auth/login`, `GET /auth/perfil` | Público / autenticado |
| Categorías | `GET /categorias` | Público |
| Productos | `GET /productos?categoria=&q=`, `GET /productos/:id` | Público |
| Productos (admin) | `POST /productos`, `PUT /productos/:id`, `PATCH /productos/:id/disponible`, `DELETE /productos/:id` | Admin |
| Pedidos | `POST /pedidos`, `GET /pedidos/mios` | Estudiante |
| Pedidos (admin) | `GET /pedidos/hoy`, `PATCH /pedidos/:id/estado` | Admin |
| Reportes | `GET /reportes/mas-vendidos`, `/ventas-por-dia`, `/hora-pico`, `/ventas-por-categoria` | Admin |

El detalle de cada endpoint se documenta en [`specs/`](specs/) y en las pruebas del backend.

## Pruebas

```powershell
# Backend: Vitest + supertest + mongodb-memory-server (nunca usa la base local)
npm run test:backend

# Frontend: runner por defecto de Angular
npm run test:frontend

# Ambas suites
npm test
```

> Las pruebas del backend levantan una instancia efímera de MongoDB en memoria. La base `pedidos_utmach` de tu máquina no se lee ni se modifica durante las pruebas.

## Flujo de trabajo Git (GitHub Flow + SDD)

1. `main` siempre debe quedar desplegable y **solo recibe cambios por Pull Request** con el CI en verde.
2. Cada fase se desarrolla en su propia rama, creada desde `main`:

   | Fase | Rama |
   | --- | --- |
   | 0 | `chore/estructura` |
   | 1 | `001-backend-base` |
   | 2 | `002-autenticacion` |
   | 3 | `003-menu-productos` |
   | 4 | `004-carrito-pedido` |
   | 5 | `005-estado-pedidos` |
   | 6 | `006-reportes` |
   | 7 | `ci/github-actions` |

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
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Modelo de documentos, diagrama Mermaid, decisiones de embebido/referencia y comparación con el modelo relacional. |
| [`docs/consultas-mongodb.md`](docs/consultas-mongodb.md) | Consultas y agregaciones en `mongosh`, índices y `explain("executionStats")`. |
| [`docs/studio3t.md`](docs/studio3t.md) | Guía de Studio 3T con consultas listas para IntelliShell y capturas sugeridas. |
| [`docs/despliegue.md`](docs/despliegue.md) | Demo local en Windows y despliegue opcional en MongoDB Atlas + Render + GitHub Pages. |
| [`specs/constitution.md`](specs/constitution.md) | Principios no negociables del proyecto. |
| [`specs/`](specs/) | Especificaciones, planes y tareas por funcionalidad. |

## Estado del proyecto

| Fase | Rama | Estado |
| --- | --- | --- |
| 0 · Estructura del monorepo | `chore/estructura` | ✅ Completada |
| 1 · Backend base, validadores, índices y seed | `001-backend-base` | ⏳ Pendiente |
| 2 · Autenticación y guards | `002-autenticacion` | ⏳ Pendiente |
| 3 · Menú, productos y admin | `003-menu-productos` | ⏳ Pendiente |
| 4 · Carrito y pedido | `004-carrito-pedido` | ⏳ Pendiente |
| 5 · Estados de pedidos | `005-estado-pedidos` | ⏳ Pendiente |
| 6 · Reportes | `006-reportes` | ⏳ Pendiente |
| 7 · CI y despliegue | `ci/github-actions` | ⏳ Pendiente |

---

Proyecto académico de la Universidad Técnica de Machala. Pagos simulados: no se procesan transacciones reales.
