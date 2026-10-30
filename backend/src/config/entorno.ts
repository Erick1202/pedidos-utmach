import "dotenv/config";
import { z } from "zod";
import { esquemaOrigenesCors } from "./cors.js";

/**
 * Validación de las variables de entorno del backend.
 * Si alguna falta o es inválida, el proceso termina antes de conectarse.
 */
const esquemaEntorno = z.object({
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI es obligatoria")
    .refine(
      (valor) => valor.startsWith("mongodb://") || valor.startsWith("mongodb+srv://"),
      "MONGODB_URI debe empezar por mongodb:// o mongodb+srv://"
    ),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),
  PORT: z.coerce
    .number()
    .int("PORT debe ser un número entero")
    .min(1, "PORT debe estar entre 1 y 65535")
    .max(65535, "PORT debe estar entre 1 y 65535")
    .default(3000),
  CORS_ORIGINS: esquemaOrigenesCors
});

const resultado = esquemaEntorno.safeParse(process.env);

if (!resultado.success) {
  console.error("Configuración inválida en backend/.env:");
  for (const problema of resultado.error.issues) {
    const campo = problema.path.join(".") || "entorno";
    console.error(`  - ${campo}: ${problema.message}`);
  }
  process.exit(1);
}

export const entorno = resultado.data;
