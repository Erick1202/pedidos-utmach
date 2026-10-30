import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ErrorAplicacion } from "../utils/ErrorAplicacion.js";

const esquemaToken = z.object({
  _id: z.string().min(1),
  nombre: z.string().min(1),
  rol: z.enum(["estudiante", "admin"])
});

export type UsuarioAutenticado = z.infer<typeof esquemaToken>;

/**
 * Exige un JWT válido en `Authorization: Bearer <token>` y deja el usuario
 * autenticado en `req.usuario`.
 */
export function crearAutenticacion(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const encabezado = req.header("authorization");

    if (!encabezado || !encabezado.startsWith("Bearer ")) {
      next(new ErrorAplicacion(401, "Token de autenticación requerido"));
      return;
    }

    const token = encabezado.slice("Bearer ".length).trim();
    if (!token) {
      next(new ErrorAplicacion(401, "Token de autenticación requerido"));
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });

      if (typeof payload === "string") {
        throw new Error("Payload inesperado");
      }

      const resultado = esquemaToken.safeParse(payload);
      if (!resultado.success) {
        throw new Error("Payload inválido");
      }

      req.usuario = resultado.data;
      next();
    } catch {
      next(new ErrorAplicacion(401, "Token inválido o expirado"));
    }
  };
}

/**
 * Restringe una ruta a los roles indicados. Debe usarse después de
 * `crearAutenticacion`.
 */
export function autorizarPorRol(
  ...roles: Array<UsuarioAutenticado["rol"]>
): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) {
      next(new ErrorAplicacion(401, "Token de autenticación requerido"));
      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      next(
        new ErrorAplicacion(
          403,
          "No tienes permisos para realizar esta acción"
        )
      );
      return;
    }

    next();
  };
}
