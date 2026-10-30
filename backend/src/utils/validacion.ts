import { ObjectId } from "mongodb";
import { z } from "zod";

/** Identificador de MongoDB recibido como texto y convertido a `ObjectId`. */
export const idMongo = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Identificador inválido")
  .transform((valor) => new ObjectId(valor));

/** Parámetro de ruta `:id`. */
export const esquemaParametroId = z.object({ id: idMongo });

/** Redondea un monto a dos decimales (USD). */
export function redondearMonto(valor: number): number {
  return Math.round(valor * 100) / 100;
}
