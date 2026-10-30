# Plan técnico 001 — Backend base

**Issue:** #2
**Rama:** `001-backend-base`

## Objetivo

Dejar un backend Express + TypeScript que arranque contra la base existente `pedidos_utmach`, informe su estado, centralice los errores y tenga una base de pruebas aislada y fiel al esquema real. No se implementan todavía autenticación, catálogo, pedidos ni reportes.

## Decisiones técnicas

### 1. Módulos ES + NodeNext

El backend usa `"type": "module"` y `module`/`moduleResolution: NodeNext`. Los imports relativos llevan extensión `.js` (la que tendrá el archivo compilado), lo que permite ejecutar el mismo código con `tsx` en desarrollo y con Node en producción. `tsx` resuelve `.js` → `.ts` y Vitest hace lo mismo a través de Vite.

### 2. Aplicación como fábrica que recibe la base

`crearApp(db: Db)` recibe una instancia de `Db` y devuelve la app de Express. Esto permite que las pruebas inyecten la base en memoria sin tocar variables globales ni la base local. `server.ts` es el único punto que lee el entorno, conecta y escucha.

### 3. Driver oficial, sin ODM

Se usa `mongodb` directamente. No hay Mongoose ni capa de repositorio genérica: las consultas serán explícitas en cada módulo. En esta fase solo se usan `ping`, `listCollections` (implícito en `countDocuments`) y `countDocuments`.

### 4. Configuración validada con zod

`src/config/entorno.ts` carga `dotenv` y valida:

| Variable | Regla |
| --- | --- |
| `MONGODB_URI` | Obligatoria; debe empezar por `mongodb://` o `mongodb+srv://`. |
| `JWT_SECRET` | Obligatoria; mínimo 16 caracteres. |
| `PORT` | Entero entre 1 y 65535; por defecto `3000`. |

Si falla, imprime cada problema en español y termina con código 1 sin imprimir valores sensibles.

### 5. Conexión y verificación

`conectarBaseDeDatos(uri)` crea el `MongoClient` con `serverSelectionTimeoutMS: 5000` e `ignoreUndefined: true`, ejecuta `ping` y devuelve `{ cliente, db }`. `contarDocumentos(db)` cuenta `usuarios`, `categorias`, `productos` y `pedidos` en paralelo con `Promise.all`.

Al arrancar, `server.ts` imprime la base conectada y los conteos. Es una verificación de solo lectura: **no** crea ni modifica colecciones, validadores o índices.

### 6. Endpoint de salud

`GET /api/salud` (público) devuelve:

```json
{
  "estado": "ok",
  "baseDatos": "pedidos_utmach",
  "colecciones": { "usuarios": 6, "categorias": 4, "productos": 12, "pedidos": 40 }
}
```

Los conteos son reales, no constantes. Si la base no responde, el middleware de errores devuelve 500.

### 7. Manejo centralizado de errores

Formato único:

```json
{ "error": "Mensaje en español", "detalles": [] }
```

`detalles` solo aparece cuando aporta (por ejemplo, errores de zod). Traducciones:

| Origen | HTTP | Mensaje |
| --- | --- | --- |
| `ErrorAplicacion` | el que indique el error | el indicado |
| `ZodError` | 400 | `Datos inválidos` + lista de campos |
| `SyntaxError` de `express.json` | 400 | `El cuerpo de la solicitud no es un JSON válido` |
| MongoDB `121` | 400 | `Los datos no cumplen el esquema de la base de datos` |
| MongoDB `11000` con `keyPattern.email` | 409 | `El correo ya está registrado` |
| MongoDB `11000` con `keyPattern.slug` | 409 | `El slug ya está registrado` |
| MongoDB `11000` otro | 409 | `Ya existe un registro con esos datos` |
| Desconocido | 500 | `Error interno del servidor` |

Los errores 5xx se registran en consola con su traza; los 4xx no. La respuesta nunca incluye el stack.

### 8. CORS

`cors` con origen único `http://localhost:4200` y cabeceras `Content-Type`/`Authorization`. Las peticiones sin `Origin` (curl, supertest) se permiten para poder probar la API.

### 9. Pruebas con MongoDB en memoria

`tests/helpers/base.ts`:

1. Levanta `MongoMemoryServer` (binario propio; nunca el servicio local).
2. Conecta un `MongoClient` a esa instancia y usa la base `pedidos_utmach`.
3. Crea las cuatro colecciones con los mismos `$jsonSchema`, `validationLevel: "strict"` y `validationAction: "error"` de `database/pedidos_utmach.js`.
4. Crea los seis índices con los mismos nombres y opciones (`ux_email`, `ux_slug`, `ix_categoria_disponible`, `tx_busqueda`, `ix_usuario_fecha`, `ix_estado_hora`).
5. Inserta datos mínimos con `_id` deterministas: 2 usuarios, 2 categorías, 3 productos y 1 pedido.

La duplicación del esquema está consciente y documentada: la fuente de verdad es el script de la base y el helper debe actualizarse si cambia. Se agrega una prueba que verifica que el validador rechaza documentos inválidos y que el índice único funciona, para detectar desincronización.

### 10. Estructura de carpetas

```text
backend/
├── src/
│   ├── app.ts                     # crearApp(db)
│   ├── server.ts                  # conexión + escucha + apagado ordenado
│   ├── config/
│   │   └── entorno.ts             # dotenv + zod
│   ├── db/
│   │   └── cliente.ts             # conectarBaseDeDatos, contarDocumentos
│   ├── middleware/
│   │   ├── errores.ts             # manejador central
│   │   └── no-encontrado.ts       # 404 JSON
│   ├── modules/
│   │   └── salud/
│   │       ├── salud.routes.ts
│   │       └── salud.service.ts
│   └── utils/
│       ├── ErrorAplicacion.ts
│       └── traducir-error.ts
├── tests/
│   ├── helpers/
│   │   ├── base.ts
│   │   └── esquema.ts
│   ├── errores.test.ts
│   ├── salud.test.ts
│   └── validadores.test.ts
├── .env.example
├── eslint.config.js
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.ts
```

### 11. Dependencias

Producción: `express`, `mongodb`, `bcryptjs`, `jsonwebtoken`, `zod`, `cors`, `dotenv`.
Desarrollo: `typescript` 5.9, `tsx`, `vitest` 3, `supertest`, `mongodb-memory-server` 11, `eslint` 9, `typescript-eslint` 8, tipos de Node/Express/CORS/JWT/supertest.

Se instalan todas en esta fase porque las fases 2 a 6 las necesitan y así el `package-lock.json` queda estable; solo se usan las correspondientes en cada fase.

### 12. Pruebas de esta fase

| Archivo | Qué verifica |
| --- | --- |
| `salud.test.ts` | `GET /api/salud` responde 200 con la base y los conteos reales del entorno en memoria. |
| `errores.test.ts` | 404, `ErrorAplicacion`, zod, error 121 real, duplicado 11000 real y JSON malformado. |
| `validadores.test.ts` | El helper rechaza pedido con cantidad 0 y producto con precio negativo, y el índice `ux_email` impide duplicados. |

No se usa TDD en esta fase porque no hay reglas de negocio; las pruebas se escriben junto con la infraestructura. El TDD obligatorio comienza en la fase 4.

## Contratos

### `GET /api/salud`

- **Rol:** público.
- **Respuesta 200:** `{ estado, baseDatos, colecciones: { usuarios, categorias, productos, pedidos } }`.
- **Errores:** 500 si la base no responde.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| El helper de pruebas se desincroniza del script real. | Pruebas de validadores e índices; comentario con la fuente de verdad; revisión en cada fase que toque el esquema. |
| `mongodb-memory-server` falla al descargar el binario en la primera ejecución. | Se permite `MONGOMS_SYSTEM_BINARY` con el `mongod.exe` instalado; el CI descarga el binario. |
| Windows resuelve `localhost` a IPv6. | URI con `127.0.0.1` y validación explícita. |
| Fuga de secretos en logs. | zod no imprime valores; los errores de configuración solo muestran el nombre del campo. |
| Duplicar el esquema genera deuda. | Se documenta la fuente de verdad y se prueban los rechazos del validador. |

## Alternativas descartadas

- **Mongoose:** oculta las operaciones nativas que evalúa la materia de NoSQL.
- **Seed o `setup.ts` propios:** la base ya existe y el usuario pidió no recrearla.
- **CommonJS:** funciona, pero se prefirió ESM por coherencia con Node moderno y Angular.
- **Pruebas contra la base local:** riesgo de contaminar datos reales; prohibido por la constitución.
- **Servidor HTTP de prueba separado:** se usa supertest sobre la misma fábrica `crearApp`.

## Actualizaciones de documentación

- `docs/modelo-datos.md`: documento nuevo con el esquema real.
- `README.md`: se elimina toda mención a `db:setup`/`seed`, se documenta la ejecución del script en Studio 3T y se actualizan integrantes, estructura y usuarios.
- `specs/constitution.md`: se ajustan los artículos II, III, VI, IX y X a la base existente y a `bcryptjs` con coste 10.
- `docs/README.md`: se agrega la sección de scripts de base de datos y se actualiza el estado.
- `package.json` raíz: se eliminan los scripts `db:setup` y `seed`.
