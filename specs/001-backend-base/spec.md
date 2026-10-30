# Especificación 001 — Backend base

**Issue:** #2
**Rama:** `001-backend-base`
**Estado:** en curso
**Depende de:** base de datos `pedidos_utmach` ya creada con [`database/pedidos_utmach.js`](../../database/pedidos_utmach.js).

## Contexto

La base NoSQL `pedidos_utmach` ya existe en el MongoDB local y es la fuente de verdad del esquema. Esta fase no crea, recrea ni modifica colecciones, validadores ni índices: solo prepara el backend Express + TypeScript que se conectará a ella y las bases de prueba aisladas que se usarán en las siguientes fases.

## Historias de usuario

### HU-B01 — Arranque verificable del backend

Como equipo de desarrollo, necesito que el backend arranque, confirme la conexión con MongoDB e informe cuántos documentos hay en cada colección, para detectar errores de configuración antes de implementar funcionalidades.

### HU-B02 — Errores uniformes en español

Como equipo de desarrollo, necesito que cualquier fallo de la API responda un JSON en español con el código HTTP correcto, para que el frontend muestre mensajes claros y las pruebas sean predecibles.

### HU-B03 — Pruebas aisladas de la base real

Como equipo de desarrollo, necesito un helper de pruebas que levante MongoDB en memoria con los mismos validadores e índices de la base real, para probar la API sin leer ni escribir en la base local.

## Criterios de aceptación

### CA-01 — Conexión y conteos al arrancar

**Dado** un `backend/.env` válido con `MONGODB_URI` apuntando a `pedidos_utmach`,
**cuando** se ejecuta `npm run dev`,
**entonces** el proceso hace `ping` a MongoDB, imprime la base conectada y el número de documentos de `usuarios`, `categorias`, `productos` y `pedidos`, y queda escuchando en `PORT`.

### CA-02 — Variables de entorno validadas

**Dado** un `.env` sin `MONGODB_URI` o con un `PORT` inválido,
**cuando** arranca el backend,
**entonces** el proceso termina con código distinto de cero y muestra un mensaje en español indicando la variable inválida, sin exponer secretos.

### CA-03 — Endpoint de salud

**Dado** el backend conectado,
**cuando** se solicita `GET /api/salud`,
**entonces** responde `200` con `{ estado: "ok", baseDatos, colecciones }`, donde `colecciones` contiene los conteos de las cuatro colecciones.

### CA-04 — Ruta inexistente

**Dado** el backend en ejecución,
**cuando** se solicita una ruta que no existe,
**entonces** responde `404` con `{ "error": "Ruta no encontrada" }` en JSON.

### CA-05 — Documento inválido traducido

**Dado** un controlador que intenta insertar un documento que viola el validador `$jsonSchema`,
**cuando** MongoDB responde con el código `121`,
**entonces** la API responde `400` con un mensaje en español y no expone detalles internos.

### CA-06 — Duplicado de correo traducido

**Dado** un registro con un correo ya existente,
**cuando** MongoDB responde con el código `11000` sobre el índice `ux_email`,
**entonces** la API responde `409` con `{ "error": "El correo ya está registrado" }`.

### CA-07 — Error de validación zod

**Dado** un cuerpo o parámetro inválido,
**cuando** zod lanza un `ZodError`,
**entonces** la API responde `400` con `{ error: "Datos inválidos", detalles: [...] }`, con los campos y mensajes en español.

### CA-08 — CORS restringido

**Dado** un navegador en `http://localhost:4200`,
**cuando** consume la API,
**entonces** la petición recibe las cabeceras CORS correspondientes; cualquier otro origen no recibe permiso.

### CA-09 — Pruebas sin la base local

**Dado** la suite `npm test`,
**cuando** se ejecuta,
**entonces** usa `mongodb-memory-server`, replica los validadores e índices de `database/pedidos_utmach.js` y no abre conexiones a `mongodb://127.0.0.1:27017`.

### CA-10 — Calidad del backend

**Dado** el código de la fase,
**cuando** se ejecutan `npm run lint`, `npm test` y `npm run build`,
**entonces** los tres terminan sin errores ni advertencias.

### CA-11 — Modelo documentado

**Dado** el script de la base,
**cuando** se revisa `docs/modelo-datos.md`,
**entonces** describe las cuatro colecciones, su validador e índices, incluye un diagrama Mermaid, justifica el embebido/referencia y compara el modelo con su equivalente relacional.

### CA-12 — Documentación sin scripts inexistentes

**Dado** el README y la constitución,
**cuando** se revisan,
**entonces** no mencionan `db:setup`, `setup.ts` ni un seed propio; indican que la base se crea ejecutando `database/pedidos_utmach.js` en Studio 3T.

## Reglas y restricciones

1. El backend **nunca** crea, borra ni modifica colecciones, validadores o índices. Solo ejecuta `ping`, `countDocuments` y, más adelante, operaciones sobre documentos.
2. Todos los `_id` que se persistan serán `ObjectId`; las fechas, `Date`; los montos se redondearán a dos decimales.
3. El texto visible (errores, logs, documentación) está en español.
4. La conexión usa `127.0.0.1`, nunca `localhost`.
5. Los secretos viven solo en `backend/.env`, que está ignorado por Git.

## Fuera de alcance

- Autenticación y JWT (fase 2).
- Endpoints de categorías, productos, pedidos y reportes (fases 3 a 6).
- Frontend (fase 2 en adelante).
- GitHub Actions y despliegue (fase 7).
- Cualquier script de seed o de creación de la base.
