import { z } from "zod";
import { idMongo, redondearMonto } from "../../utils/validacion.js";

export const esquemaProducto = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(100, "El nombre no puede superar los 100 caracteres"),
    descripcion: z
      .string()
      .trim()
      .max(500, "La descripción no puede superar los 500 caracteres")
      .default(""),
    precio: z
      .number({ error: "El precio debe ser un número" })
      .positive("El precio debe ser mayor que cero")
      .max(1000, "El precio no puede superar los 1000 dólares")
      .transform(redondearMonto)
      .refine((precio) => precio >= 0.01, "El precio debe ser de al menos 0.01"),
    imagenUrl: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .url("La URL de la imagen no es válida")
          .regex(/^https?:\/\//i, "La imagen debe ser una URL http o https")
      ])
      .optional(),
    disponible: z.boolean({ error: "Disponible debe ser verdadero o falso" }).default(true),
    categoriaId: idMongo
  })
  .strict();

export const esquemaDisponibilidad = z
  .object({
    disponible: z.boolean({ error: "Disponible debe ser verdadero o falso" })
  })
  .strict();

export const esquemaFiltrosProductos = z.object({
  categoria: idMongo.optional(),
  q: z
    .string()
    .trim()
    .min(1, "La búsqueda no puede estar vacía")
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional(),
  todos: z
    .enum(["true", "false"])
    .transform((valor) => valor === "true")
    .optional()
});

export type DatosProducto = z.infer<typeof esquemaProducto>;
export type FiltrosProductos = z.infer<typeof esquemaFiltrosProductos>;
