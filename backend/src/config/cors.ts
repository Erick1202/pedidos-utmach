import { z } from "zod";

/** Frontend local (`ng serve`) y GitHub Pages, donde se publica la app. */
export const ORIGENES_CORS_POR_DEFECTO = [
  "http://localhost:4200",
  "https://erick1202.github.io"
] as const;

/** Un origen es protocolo + host + puerto opcional, sin ruta ni barra final. */
const PATRON_ORIGEN = /^https?:\/\/[^/\s?#]+$/;

/**
 * Convierte `CORS_ORIGINS` (lista separada por comas) en un arreglo de orígenes.
 * Si la variable no existe o queda vacía, usa los orígenes por defecto.
 */
export const esquemaOrigenesCors = z
  .string()
  .optional()
  .transform((valor) =>
    (valor ?? "")
      .split(",")
      .map((origen) => origen.trim())
      .filter((origen) => origen.length > 0)
  )
  .transform((origenes) => (origenes.length > 0 ? origenes : [...ORIGENES_CORS_POR_DEFECTO]))
  .refine(
    (origenes) => origenes.every((origen) => PATRON_ORIGEN.test(origen)),
    "CORS_ORIGINS debe ser una lista de orígenes http(s) sin ruta, separados por comas"
  );
