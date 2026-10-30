import cors from "cors";
import express, { type Express } from "express";
import type { Db } from "mongodb";
import { manejadorErrores } from "./middleware/errores.js";
import { noEncontrado } from "./middleware/no-encontrado.js";
import { crearRutasAuth } from "./modules/auth/auth.routes.js";
import { crearRutasPedidos } from "./modules/pedidos/pedidos.routes.js";
import { crearRutasCategorias } from "./modules/categorias/categorias.routes.js";
import { crearRutasProductos } from "./modules/productos/productos.routes.js";
import { crearRutasReportes } from "./modules/reportes/reportes.routes.js";
import { crearRutasSalud } from "./modules/salud/salud.routes.js";
import { ORIGENES_CORS_POR_DEFECTO } from "./config/cors.js";

export interface OpcionesApp {
  jwtSecret: string;
  /** Orígenes permitidos por CORS; por defecto, el frontend local y GitHub Pages. */
  origenesCors?: readonly string[];
  /** Reloj inyectable para que las pruebas de pedidos y reportes sean deterministas. */
  ahora?: () => Date;
}

/**
 * Fábrica de la aplicación. Recibe la base ya conectada, el secreto JWT y,
 * opcionalmente, el reloj, para que las pruebas los inyecten sin leer `.env`.
 */
export function crearApp(db: Db, opciones: OpcionesApp): Express {
  const app = express();
  const ahora = opciones.ahora ?? (() => new Date());

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: [...(opciones.origenesCors ?? ORIGENES_CORS_POR_DEFECTO)],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/salud", crearRutasSalud(db));
  app.use("/api/auth", crearRutasAuth(db, opciones.jwtSecret));
  app.use("/api/categorias", crearRutasCategorias(db, opciones.jwtSecret));
  app.use("/api/productos", crearRutasProductos(db, opciones.jwtSecret));
  app.use("/api/pedidos", crearRutasPedidos(db, opciones.jwtSecret, ahora));
  app.use("/api/reportes", crearRutasReportes(db, opciones.jwtSecret, ahora));

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
