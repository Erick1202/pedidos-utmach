import { Router } from "express";
import type { Db } from "mongodb";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../../middleware/autenticacion.js";
import { esquemaParametroId } from "../../utils/validacion.js";
import { esquemaCategoria } from "./categorias.schemas.js";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias
} from "./categorias.service.js";

export function crearRutasCategorias(db: Db, jwtSecret: string): Router {
  const router = Router();
  const soloAdmin = [crearAutenticacion(jwtSecret), autorizarPorRol("admin")];

  router.get("/", async (_req, res) => {
    const categorias = await listarCategorias(db);
    res.json({ categorias });
  });

  router.post("/", ...soloAdmin, async (req, res) => {
    const datos = esquemaCategoria.parse(req.body);
    const categoria = await crearCategoria(db, datos);
    res.status(201).json({ categoria });
  });

  router.put("/:id", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    const datos = esquemaCategoria.parse(req.body);
    const categoria = await actualizarCategoria(db, id, datos);
    res.json({ categoria });
  });

  router.delete("/:id", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    await eliminarCategoria(db, id);
    res.status(204).end();
  });

  return router;
}
