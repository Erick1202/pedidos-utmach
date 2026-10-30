import { Router } from "express";
import type { Db } from "mongodb";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../../middleware/autenticacion.js";
import { esquemaMasVendidos, esquemaRangoFechas } from "./reportes.schemas.js";
import {
  horaPico,
  masVendidos,
  porEstudiante,
  resumen,
  ventasPorCategoria,
  ventasPorDia
} from "./reportes.service.js";

/** Reportes de solo lectura para el administrador. */
export function crearRutasReportes(db: Db, jwtSecret: string, ahora: () => Date): Router {
  const router = Router();
  router.use(crearAutenticacion(jwtSecret), autorizarPorRol("admin"));

  router.get("/mas-vendidos", async (req, res) => {
    const { limite, ...rango } = esquemaMasVendidos.parse(req.query);
    res.json({ productos: await masVendidos(db, rango, limite) });
  });

  router.get("/ventas-por-dia", async (req, res) => {
    const rango = esquemaRangoFechas.parse(req.query);
    res.json({ dias: await ventasPorDia(db, rango) });
  });

  router.get("/hora-pico", async (req, res) => {
    const rango = esquemaRangoFechas.parse(req.query);
    res.json({ horas: await horaPico(db, rango) });
  });

  router.get("/ventas-por-categoria", async (req, res) => {
    const rango = esquemaRangoFechas.parse(req.query);
    res.json({ categorias: await ventasPorCategoria(db, rango) });
  });

  router.get("/por-estudiante", async (req, res) => {
    const rango = esquemaRangoFechas.parse(req.query);
    res.json({ estudiantes: await porEstudiante(db, rango) });
  });

  router.get("/resumen", async (req, res) => {
    const rango = esquemaRangoFechas.parse(req.query);
    res.json({ resumen: await resumen(db, rango, ahora()) });
  });

  return router;
}
