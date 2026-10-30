import { MongoServerError } from "mongodb";
import { ZodError } from "zod";
import { ErrorAplicacion } from "./ErrorAplicacion.js";

export interface ErrorTraducido {
  estado: number;
  mensaje: string;
  detalles?: unknown;
}

/**
 * Traduce cualquier error a una respuesta en español.
 * Los detalles solo se adjuntan cuando son útiles para el cliente (zod).
 */
export function traducirError(error: unknown): ErrorTraducido {
  if (error instanceof ErrorAplicacion) {
    return {
      estado: error.estado,
      mensaje: error.message,
      ...(error.detalles !== undefined ? { detalles: error.detalles } : {})
    };
  }

  if (error instanceof ZodError) {
    return {
      estado: 400,
      mensaje: "Datos inválidos",
      detalles: error.issues.map((problema) => ({
        campo: problema.path.join(".") || "cuerpo",
        mensaje: problema.message
      }))
    };
  }

  if (error instanceof SyntaxError) {
    const errorDeParseo = error as SyntaxError & { status?: number };
    if (errorDeParseo.status === 400) {
      return {
        estado: 400,
        mensaje: "El cuerpo de la solicitud no es un JSON válido"
      };
    }
  }

  if (error instanceof MongoServerError) {
    if (error.code === 121) {
      return {
        estado: 400,
        mensaje: "Los datos no cumplen el esquema de la base de datos"
      };
    }

    if (error.code === 11000) {
      const clave = error.keyPattern ?? {};

      if ("email" in clave) {
        return { estado: 409, mensaje: "El correo ya está registrado" };
      }

      if ("slug" in clave) {
        return { estado: 409, mensaje: "El slug ya está registrado" };
      }

      return { estado: 409, mensaje: "Ya existe un registro con esos datos" };
    }
  }

  return { estado: 500, mensaje: "Error interno del servidor" };
}
