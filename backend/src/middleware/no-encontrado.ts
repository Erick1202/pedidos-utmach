import type { RequestHandler } from "express";

/** Cualquier ruta no registrada responde 404 en JSON. */
export const noEncontrado: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};
