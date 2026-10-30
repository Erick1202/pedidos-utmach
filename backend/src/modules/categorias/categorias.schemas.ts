import { z } from "zod";

export const esquemaCategoria = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(50, "El nombre no puede superar los 50 caracteres")
  })
  .strict();

export type DatosCategoria = z.infer<typeof esquemaCategoria>;
