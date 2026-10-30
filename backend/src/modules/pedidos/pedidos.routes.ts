import { Router } from "express";
import type { Db } from "mongodb";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../../middleware/autenticacion.js";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import { esquemaCrearPedido } from "./pedidos.schemas.js";
import { crearPedido } from "./pedidos.service.js";

export function crearRutasPedidos(db: Db, jwtSecret: string, ahora: () => Date): Router {
  const router = Router();
  const soloEstudiante = [crearAutenticacion(jwtSecret), autorizarPorRol("estudiante")];

  router.post("/", ...soloEstudiante, async (req, res) => {
    if (!req.usuario) {
      throw new ErrorAplicacion(401, "Token de autenticación requerido");
    }
    const datos = esquemaCrearPedido.parse(req.body);
    const pedido = await crearPedido(db, req.usuario, datos, ahora());
    res.status(201).json({ pedido });
  });

  return router;
}
