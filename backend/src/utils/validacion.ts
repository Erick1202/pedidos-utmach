import { ObjectId } from "mongodb";
import { z } from "zod";

/** Identificador de MongoDB recibido como texto y convertido a `ObjectId`. */
export const idMongo = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Identificador inválido")
  .transform((valor) => new ObjectId(valor));

/** Día de calendario `AAAA-MM-DD` que existe (rechaza, por ejemplo, `2026-02-30`). */
export const fechaCalendario = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD")
  .refine(
    (valor) => {
      const fecha = new Date(`${valor}T00:00:00Z`);
      return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(valor);
    },
    "La fecha no existe en el calendario"
  );

/** Parámetro de ruta `:id`. */
export const esquemaParametroId = z.object({ id: idMongo });

/** Redondea un monto a dos decimales (USD). */
export function redondearMonto(valor: number): number {
  return Math.round(valor * 100) / 100;
}
