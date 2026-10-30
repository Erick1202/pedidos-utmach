import { Router } from "express";
import type { Db } from "mongodb";
import { obtenerSalud } from "./salud.service.js";

/** Rutas públicas de estado del backend. */
export function crearRutasSalud(db: Db): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await obtenerSalud(db));
  });

  return router;
}
