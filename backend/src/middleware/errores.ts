import type { ErrorRequestHandler } from "express";
import { traducirError } from "../utils/traducir-error.js";

/** Middleware central: convierte cualquier error en JSON en español. */
export const manejadorErrores: ErrorRequestHandler = (error, _req, res, _next) => {
  const { estado, mensaje, detalles } = traducirError(error);

  if (estado >= 500) {
    console.error("[error]", error);
  }

  const cuerpo: { error: string; detalles?: unknown } = { error: mensaje };
  if (detalles !== undefined) {
    cuerpo.detalles = detalles;
  }

  res.status(estado).json(cuerpo);
};
