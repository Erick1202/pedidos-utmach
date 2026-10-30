import cors from "cors";
import express, { type Express } from "express";
import type { Db } from "mongodb";
import { manejadorErrores } from "./middleware/errores.js";
import { noEncontrado } from "./middleware/no-encontrado.js";
import { crearRutasAuth } from "./modules/auth/auth.routes.js";
import { crearRutasSalud } from "./modules/salud/salud.routes.js";

export const ORIGEN_PERMITIDO = "http://localhost:4200";

export interface OpcionesApp {
  jwtSecret: string;
}

/**
 * Fábrica de la aplicación. Recibe la base ya conectada y el secreto JWT
 * para que las pruebas puedan inyectar ambos sin leer `.env`.
 */
export function crearApp(db: Db, opciones: OpcionesApp): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: [ORIGEN_PERMITIDO],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/salud", crearRutasSalud(db));
  app.use("/api/auth", crearRutasAuth(db, opciones.jwtSecret));

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
