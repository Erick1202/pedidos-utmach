import { Router } from "express";
import type { Db } from "mongodb";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../../middleware/autenticacion.js";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import { esquemaParametroId } from "../../utils/validacion.js";
import {
  esquemaCrearPedido,
  esquemaMisPedidos,
  esquemaPedidosActivos
} from "./pedidos.schemas.js";
import {
  avanzarEstado,
  crearPedido,
  listarActivos,
  listarMisPedidos
} from "./pedidos.service.js";

export function crearRutasPedidos(db: Db, jwtSecret: string, ahora: () => Date): Router {
  const router = Router();
  const autenticar = crearAutenticacion(jwtSecret);
  const soloEstudiante = [autenticar, autorizarPorRol("estudiante")];
  const soloAdmin = [autenticar, autorizarPorRol("admin")];

  router.post("/", ...soloEstudiante, async (req, res) => {
    if (!req.usuario) {
      throw new ErrorAplicacion(401, "Token de autenticación requerido");
    }
    const datos = esquemaCrearPedido.parse(req.body);
    const pedido = await crearPedido(db, req.usuario, datos, ahora());
    res.status(201).json({ pedido });
  });

  router.get("/mios", ...soloEstudiante, async (req, res) => {
    if (!req.usuario) {
      throw new ErrorAplicacion(401, "Token de autenticación requerido");
    }
    const { limite } = esquemaMisPedidos.parse(req.query);
    const pedidos = await listarMisPedidos(db, req.usuario._id, limite);
    res.json({ pedidos });
  });

  router.get("/activos", ...soloAdmin, async (req, res) => {
    const { fecha } = esquemaPedidosActivos.parse(req.query);
    const pedidos = await listarActivos(db, fecha);
    res.json({ pedidos });
  });

  router.patch("/:id/estado", ...soloAdmin, async (req, res) => {
    const { id } = esquemaParametroId.parse(req.params);
    const pedido = await avanzarEstado(db, id, ahora());
    res.json({ pedido });
  });

  return router;
}
