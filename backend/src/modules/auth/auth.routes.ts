import { Router } from "express";
import type { Db } from "mongodb";
import { crearAutenticacion } from "../../middleware/autenticacion.js";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import { esquemaLogin, esquemaRegistro } from "./auth.schemas.js";
import { iniciarSesion, obtenerPerfil, registrarUsuario } from "./auth.service.js";

export function crearRutasAuth(db: Db, jwtSecret: string): Router {
  const router = Router();
  const autenticar = crearAutenticacion(jwtSecret);

  router.post("/registro", async (req, res) => {
    const datos = esquemaRegistro.parse(req.body);
    const sesion = await registrarUsuario(db, datos, jwtSecret);
    res.status(201).json(sesion);
  });

  router.post("/login", async (req, res) => {
    const datos = esquemaLogin.parse(req.body);
    const sesion = await iniciarSesion(db, datos, jwtSecret);
    res.json(sesion);
  });

  router.get("/perfil", autenticar, async (req, res) => {
    if (!req.usuario) {
      throw new ErrorAplicacion(401, "Token de autenticación requerido");
    }

    const usuario = await obtenerPerfil(db, req.usuario._id);
    res.json({ usuario });
  });

  return router;
}
