import { z } from "zod";

const correo = z
  .string()
  .trim()
  .email("El correo no es válido")
  .transform((valor) => valor.toLowerCase());

export const esquemaRegistro = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(100, "El nombre no puede superar los 100 caracteres"),
    email: correo,
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar los 72 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).*$/,
        "La contraseña debe incluir mayúscula, minúscula, número y símbolo"
      )
  })
  .strict();

export const esquemaLogin = z
  .object({
    email: correo,
    password: z.string().min(1, "La contraseña es obligatoria")
  })
  .strict();

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;
