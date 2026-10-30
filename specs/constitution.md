# Constitución de PedidosUTMACH

**Versión:** 1.2.0
**Fecha de ratificación:** 2026-10-28
**Última enmienda:** 2026-10-30
**Ámbito:** todo el monorepo (`frontend`, `backend`, `database`, `docs`, `specs` y flujos de Git/CI).
**Ratificada por:** equipo del proyecto PedidosUTMACH.

## Preámbulo

PedidosUTMACH es un sistema académico de pedidos anticipados para el bar de la Universidad Técnica de Machala. Se evalúa en dos materias simultáneas —Programación Móvil y Bases de Datos No Estructuradas—, por lo que el proyecto debe demostrar tanto ingeniería de software (Angular, Git, CI, Spec Driven Development) como modelado y explotación de MongoDB.

Esta constitución fija los principios no negociables. Cuando una decisión técnica entre en conflicto con ella, prevalece la constitución; cualquier excepción debe justificarse por escrito en el `plan.md` de la funcionalidad y aprobarse en el Pull Request correspondiente.

---

## Artículo I. TypeScript estricto

1. Todo el código de aplicación se escribe en **TypeScript**. No se admite JavaScript suelto en `src/` (salvo archivos de configuración generados por las herramientas).
2. El compilador se ejecuta con `strict: true` y, como mínimo, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals` y `noUnusedParameters`. El backend compila con `target: ES2022` y `module: NodeNext`.
3. Se prohíbe `any` explícito o implícito. En los bordes del sistema (cuerpo, parámetros y consultas HTTP) se recibe `unknown` y se valida con **zod** antes de usarlo.
4. Las fechas viajan como cadenas ISO 8601 en la API y se persisten como `Date` de BSON. El dinero se maneja como número (USD, dos decimales) y se redondea explícitamente en los cálculos.
5. `@ts-ignore` y `@ts-expect-error` requieren un comentario que explique por qué son inevitables. No se aceptan como atajo.
6. Los modelos del dominio se declaran una vez en el backend y se reflejan en el frontend (`frontend/src/app/core/models`). Si un contrato cambia, se actualizan ambos lados en el mismo Pull Request.

## Artículo II. Pruebas y TDD en la lógica de negocio

1. La lógica de negocio debe estar cubierta por pruebas automatizadas. Como mínimo:
   - cálculo del total de un pedido;
   - validación de la hora de recogida;
   - transición de estados del pedido;
   - recálculo de precios y validación de disponibilidad al crear un pedido;
   - registro, login y autorización por rol.
2. Las tres funcionalidades críticas se desarrollan con **TDD**: primero se escribe una prueba que falla (commit `test:`), después el código mínimo que la hace pasar (commit `feat:`) y, si hace falta, una refactorización sin cambiar el comportamiento.
3. En el backend se usa **Vitest + supertest + mongodb-memory-server**. Las pruebas **nunca** se conectan a la base local del desarrollador ni a una base compartida: cada suite levanta su propia instancia efímera y la detiene al terminar. El helper de pruebas replica los validadores `$jsonSchema` y los índices de `database/pedidos_utmach.js`; si el esquema real cambia, el helper se actualiza en el mismo PR.
4. Las pruebas son deterministas: no dependen de la hora real (se inyecta el reloj o se usan fechas fijas), del orden de ejecución ni de datos remanentes. Cada prueba prepara y limpia su estado. Las reglas de hora se prueban con la zona `America/Guayaquil`.
5. En el frontend se usa el **runner por defecto de Angular** (`ng test`). Se prueban servicios, guards, interceptores y los componentes con lógica relevante; los componentes puramente presentacionales pueden omitirse.
6. Un Pull Request no se abre si alguna prueba falla. No se permiten pruebas omitidas (`skip`, `todo`) sin una tarea registrada que las recupere.
7. La cobertura es una señal, no una meta: se exige cobertura alta (≥ 80 % de líneas) en los módulos con TDD y se revisa en el PR, pero el CI no bloquea por porcentaje global.

## Artículo III. Seguridad

1. Las contraseñas se almacenan **solo** como hash con `bcryptjs` (coste 10, compatible con los hashes `$2b$10` existentes). Nunca se guardan, registran ni devuelven en texto plano; las respuestas de la API jamás incluyen `passwordHash`.
2. La autenticación usa **JWT** firmado con HS256. El token incluye `_id`, `nombre` y `rol`, y expira en 8 horas. El cliente lo envía como `Authorization: Bearer <token>`.
3. `JWT_SECRET` vive **únicamente** en `backend/.env`. El frontend nunca recibe secretos: solo el token emitido. `backend/.env` está en `.gitignore` y se versiona exclusivamente `backend/.env.example` con valores de ejemplo.
4. Toda entrada se valida con **zod** (cuerpo, parámetros de ruta y query). El servidor **recalcula los precios y el total** desde la base de datos al crear un pedido y verifica la disponibilidad; nunca confía en precios ni totales enviados por el cliente.
5. La autorización se aplica en dos capas: middleware `autenticar` + `autorizar("admin")` en el backend, y guards funcionales por rol en Angular. Ocultar un botón no sustituye la comprobación del servidor.
6. CORS se limita a los orígenes de `CORS_ORIGINS` (por defecto `http://localhost:4200` y `https://erick1202.github.io`, el origen de GitHub Pages). Los errores se devuelven en JSON con mensajes en español, sin trazas ni detalles internos en producción.
7. El login responde con un mensaje genérico («Correo o contraseña incorrectos») para no revelar qué correos existen. El registro sí informa cuando el correo ya está en uso.
8. La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un carácter especial. El hash se compara con `bcrypt.compare`; nunca con `===`.
9. No se registran tokens, contraseñas ni datos personales en logs. Los pagos son simulados: no se integra ninguna pasarela real.

## Artículo IV. Git y Conventional Commits

1. `main` es la rama desplegable. Está protegida: **todo cambio entra por Pull Request** con el CI en verde. No se hace push directo a `main` ni fusión local.
2. Se trabaja en una rama por fase, con los nombres acordados (`chore/estructura`, `001-backend-base`, `002-autenticacion`, …, `ci/github-actions`). Las ramas se crean desde `main` una vez fusionado el PR anterior.
3. Los commits siguen **Conventional Commits**, en español, modo imperativo y con alcance cuando aporte claridad:

   ```text
   <tipo>(<alcance opcional>): <descripción>
   ```

   Tipos permitidos: `feat`, `fix`, `test`, `docs`, `ci`, `chore`, `refactor`, `style`, `perf`.
4. Cada commit contiene **un solo cambio lógico**. Se prefieren commits pequeños y frecuentes a uno gigante al final de la fase.
5. En las funcionalidades con TDD, el commit `test:` que introduce la prueba en rojo debe ser anterior al commit `feat:` que la hace pasar. El historial debe evidenciar el ciclo.
6. El Pull Request lo abre el equipo en GitHub; el agente/desarrollador no hace push ni merge por su cuenta. Cada PR referencia su carpeta de `specs/` y enumera cómo se probó.
7. Nunca se versionan `.env`, `node_modules`, `dist`, credenciales, tokens ni capturas con datos sensibles. Antes de cada commit se revisa `git status` y `git diff --staged`.

## Artículo V. Spec Driven Development

1. El orden de trabajo es **spec → plan → tasks → código → pruebas → documentación**. No se escribe código de una funcionalidad antes de que exista su especificación.
2. Cada funcionalidad vive en `specs/00X-nombre/` y contiene:
   - `spec.md`: historias de usuario, criterios de aceptación verificables (Given/When/Then), reglas de negocio y fuera de alcance.
   - `plan.md`: decisiones técnicas, contratos de API, cambios en el modelo de datos, riesgos y alternativas descartadas.
   - `tasks.md`: checklist ordenado y granular; se marca a medida que se completa.
3. Los criterios de aceptación tienen identificadores (`CA-01`, `CA-02`, …) y las tareas referencian la historia o el criterio que satisfacen.
4. Un PR solo se considera completo cuando todas las tareas de su `tasks.md` están marcadas y la documentación afectada está actualizada.
5. La especificación se corrige si la realidad obliga a cambiar el plan; el cambio se refleja en el mismo PR y se explica en `plan.md`.

## Artículo VI. Modelo de datos MongoDB

1. Se usa el **driver oficial `mongodb`**. No se permite Mongoose ni otro ODM: el objetivo es demostrar operaciones nativas, validadores e índices.
2. Reglas de modelado:
   - Los **items del pedido se embeben** porque se leen siempre con el pedido, su número es acotado y necesitan un snapshot del precio al momento de la compra.
   - La **categoría se desnormaliza** dentro del producto (`{ _id, nombre }`) porque el menú se lee por categoría y el nombre cambia con muy baja frecuencia.
   - **Usuarios y productos se referencian** por `_id` (con el nombre copiado cuando la vista lo necesita) porque son entidades independientes, reutilizadas por muchos documentos y con ciclo de vida propio.
3. La base `pedidos_utmach` **ya existe** y su fuente de verdad es `database/pedidos_utmach.js`, que contiene los validadores `$jsonSchema` con `validationLevel: "strict"` y los índices. El backend **no** crea, borra ni modifica colecciones, validadores ni índices, y no incluye scripts propios de creación o carga de datos.
4. Los índices existentes (`ux_email`, `ux_slug`, `ix_categoria_disponible`, `tx_busqueda`, `ix_usuario_fecha`, `ix_estado_hora`) no se crean ni se alteran desde la aplicación. Cualquier cambio de esquema se hace en el script de la base y se replica en el helper de pruebas.
5. Las agregaciones viven en la capa de servicio, reutilizan los pipelines de `database/consultas_pedidos_utmach.js`, comienzan por `$match` sobre campos indexados cuando sea posible y limitan el volumen de datos antes de agrupar.
6. Fechas en UTC (`Date` de BSON); la interfaz y las reglas de negocio usan la zona `America/Guayaquil` (UTC-5). El día se delimita entre las 05:00Z y las 05:00Z siguientes.
7. Prohibido tocar las bases `admin`, `config` y `local`. El script de la base solo puede ejecutarse de forma deliberada y recrea únicamente `pedidos_utmach` (empieza con `dropDatabase`).
8. La aplicación debe funcionar igual con MongoDB local y con MongoDB Atlas cambiando solo `MONGODB_URI`; ninguna cadena de conexión se codifica en el código fuente.
9. Todo id persistido es `ObjectId`; toda fecha, `Date`; todo monto se redondea a dos decimales. Los errores 121 (`Document failed validation`) y 11000 (clave duplicada) se traducen a respuestas en español.

## Artículo VII. Frontend y experiencia de usuario

1. Se usan **componentes standalone** y **signals** para el estado. No se crean `NgModule`.
2. El diseño es **mobile-first** con Tailwind CSS v4 mediante `@tailwindcss/postcss`. La identidad visual emplea azul institucional y blanco, con contraste suficiente (WCAG AA) y estados de foco visibles.
3. El acceso a la API se encapsula en servicios con `HttpClient`. Un interceptor funcional adjunta el JWT y un guard funcional protege las rutas por rol.
4. La URL de la API se configura en `src/environments/`; no se escriben URLs absolutas en componentes ni servicios.
5. La interfaz, los mensajes de error y los textos visibles están en **español**. Los precios se muestran en dólares estadounidenses con formato local de Ecuador.
6. Toda pantalla debe funcionar en un ancho de 360 px sin desplazamiento horizontal y mantener una jerarquía clara de acciones.

## Artículo VIII. Idioma y documentación

1. La interfaz, los comentarios, los mensajes de error, los commits y la documentación se escriben en **español**. Los identificadores de dominio también (`pedidos`, `productos`, `horaRecogida`); los términos técnicos consolidados pueden quedar en inglés (`request`, `middleware`, `guard`).
2. Cada endpoint documenta método, ruta, rol requerido, cuerpo, respuesta y errores posibles.
3. `docs/` es la fuente de verdad para el modelo de datos, las consultas, Studio 3T y el despliegue. Si el código cambia, los documentos se actualizan en el mismo PR.
4. Los documentos usan Markdown, diagramas Mermaid cuando aporten y bloques de comandos copiables para **PowerShell**.
5. Los scripts de `database/` son la fuente de verdad del esquema y de las consultas de referencia. No se modifican desde el backend ni se reemplazan por scripts propios de carga de datos.

## Artículo IX. Entorno y portabilidad

1. La documentación de ejecución usa **PowerShell** (Windows). Los scripts de npm deben ser multiplataforma; si se necesitan variables de entorno se usa `cross-env`.
2. La URI de MongoDB usa `127.0.0.1`, nunca `localhost`, para evitar la resolución IPv6 (`::1`) en Windows.
3. No se codifican rutas absolutas de la máquina del desarrollador en código, configuración ni documentación.
4. El desarrollo local usa Node.js 24 y el CI se ejecuta en `ubuntu-latest` con Node.js 22, de modo que el proyecto funcione en ambas versiones y no dependa de Windows.

## Artículo X. Calidad y CI

1. El workflow `.github/workflows/ci.yml` se ejecuta en cada `pull_request` y en cada `push` a `main`.
2. Job `backend`: `npm ci`, lint sin advertencias y Vitest con `mongodb-memory-server`.
3. Job `frontend`: `npm ci`, `ng test --watch=false` en Chromium headless y `ng build --base-href /pedidos-utmach/`, copiando `index.html` a `404.html` para GitHub Pages.
4. Job `deploy`: solo en `push` a `main` y dependiente de los dos anteriores; publica el frontend en GitHub Pages con `actions/upload-pages-artifact` y `actions/deploy-pages`.
5. Un PR solo es fusionable con el CI en verde y sin conflictos. No se desactivan pruebas ni reglas de lint para «arreglar» el CI.
6. **Definición de terminado:** código implementado, pruebas en verde, documentación y `tasks.md` actualizados, sin secretos versionados y CI en verde.

---

## Gobernanza

- Esta constitución se versiona con SemVer. Cualquier enmienda se propone en un PR que modifique este archivo, explique el motivo y actualice la versión.

### Historial de enmiendas

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-10-28 | Ratificación inicial. |
| 1.1.0 | 2026-10-29 | La base `pedidos_utmach` ya existe: se retiran los scripts de creación de la base, se agrega `database/` como fuente de verdad, `bcryptjs` con coste 10, payload JWT `_id`/`nombre`/`rol`, helper de pruebas con validadores e índices reales y reglas de zona horaria. |
| 1.2.0 | 2026-10-30 | CORS configurable con `CORS_ORIGINS` para admitir la app publicada en GitHub Pages; pruebas del frontend en Chromium headless en el CI (fase 7). |
- Las excepciones puntuales se documentan en el `plan.md` de la funcionalidad con su justificación y fecha; no modifican la constitución.
- En caso de duda, se pregunta antes de asumir. Una decisión no documentada se considera deuda técnica.
- La conformidad se verifica en cada Pull Request mediante la lista de comprobación del Artículo X.
