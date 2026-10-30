import { Router, type RequestHandler } from "express";
import type { Db } from "mongodb";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../../middleware/autenticacion.js";
import { esquemaParametroId } from "../../utils/validacion.js";
import {
  esquemaDisponibilidad,
  esquemaFiltrosProductos,
  esquemaProducto
} from "./productos.schemas.js";
import {
  actualizarProducto,
  cambiarDisponibilidad,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto
} from "./productos.service.js";

export function crearRutasProductos(db: Db, jwtSecret: string): Router {
  const router = Router();
  const autenticar = crearAutenticacion(jwtSecret);
  const esAdmin = autorizarPorRol("admin");
  const soloAdmin = [autenticar, esAdmin];

  /** `?todos=true` incluye los no disponibles y solo lo puede pedir un admin. */
  const adminSiPideTodos: RequestHandler = (req, res, next) => {
    if (req.query.todos !== "true") {
      next();
      return;
    }
    autenticar(req, res, (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }
      esAdmin(req, res, next);
    });
  };

  router.get("/", adminSiPideTodos, async (req, res) => {
    const filtros = esquemaFiltrosProductos.parse(req.query);
    const productos = await listarProductos(db, filtros);
    res.json({ productos });
  });

  router.get("/:id", async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    const producto = await obtenerProducto(db, id);
    res.json({ producto });
  });

  router.post("/", ...soloAdmin, async (req, res) => {
    const datos = esquemaProducto.parse(req.body);
    const producto = await crearProducto(db, datos);
    res.status(201).json({ producto });
  });

  router.put("/:id", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    const datos = esquemaProducto.parse(req.body);
    const producto = await actualizarProducto(db, id, datos);
    res.json({ producto });
  });

  router.patch("/:id/disponible", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    const { disponible } = esquemaDisponibilidad.parse(req.body);
    const producto = await cambiarDisponibilidad(db, id, disponible);
    res.json({ producto });
  });

  router.delete("/:id", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    await eliminarProducto(db, id);
    res.status(204).end();
  });

  return router;
}
