import { crearApp } from "./app.js";
import { entorno } from "./config/entorno.js";
import { contarDocumentos, conectarBaseDeDatos } from "./db/cliente.js";

async function iniciar(): Promise<void> {
  const { cliente, db } = await conectarBaseDeDatos(entorno.MONGODB_URI);
  const conteos = await contarDocumentos(db);

  console.info(`[db] Conectado a MongoDB: ${db.databaseName} (ping OK)`);
  for (const [coleccion, total] of Object.entries(conteos)) {
    console.info(`[db] ${coleccion}: ${total} documentos`);
  }

  const app = crearApp(db, { jwtSecret: entorno.JWT_SECRET });
  const servidor = app.listen(entorno.PORT, () => {
    console.info(`[api] PedidosUTMACH escuchando en http://localhost:${entorno.PORT}/api`);
  });

  const cerrar = (): void => {
    console.info("[api] Cerrando el servidor...");
    servidor.close(() => {
      void cliente.close().then(
        () => process.exit(0),
        () => process.exit(1)
      );
    });
  };

  process.once("SIGINT", cerrar);
  process.once("SIGTERM", cerrar);
}

iniciar().catch((error: unknown) => {
  console.error("[api] No se pudo iniciar el backend:", error);
  process.exitCode = 1;
});
