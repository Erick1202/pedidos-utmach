import { z } from "zod";
import { fechaCalendario } from "../../utils/validacion.js";

/**
 * `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`: días de recogida en Ecuador, ambos
 * opcionales e inclusivos. Las cadenas `AAAA-MM-DD` se comparan como texto.
 */
export const esquemaRangoFechas = z
  .object({
    desde: fechaCalendario.optional(),
    hasta: fechaCalendario.optional()
  })
  .refine(
    ({ desde, hasta }) => !desde || !hasta || desde <= hasta,
    { message: "La fecha «desde» no puede ser posterior a «hasta»", path: ["desde"] }
  );

export type RangoFechas = z.infer<typeof esquemaRangoFechas>;

/** `GET /mas-vendidos`: rango de fechas más `?limite` (por defecto 5). */
export const esquemaMasVendidos = z
  .object({
    limite: z.coerce
      .number({ error: "El límite debe ser un número" })
      .int("El límite debe ser un número entero")
      .min(1, "El límite debe estar entre 1 y 20")
      .max(20, "El límite debe estar entre 1 y 20")
      .default(5)
  })
  .and(esquemaRangoFechas);
