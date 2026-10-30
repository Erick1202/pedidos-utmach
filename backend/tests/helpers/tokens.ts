import type { Db } from "mongodb";
import jwt from "jsonwebtoken";
import { IDS, insertarDatosMinimos, SECRETO_PRUEBAS } from "./base.js";

/** Tokens firmados con el secreto de pruebas, sin pasar por bcrypt. */
export const TOKENS = {
  admin: jwt.sign(
    { _id: IDS.admin.toHexString(), nombre: "Administrador Bar UTMACH", rol: "admin" },
    SECRETO_PRUEBAS,
    { algorithm: "HS256", expiresIn: "1h" }
  ),
  estudiante: jwt.sign(
    { _id: IDS.estudiante.toHexString(), nombre: "Ana Torres", rol: "estudiante" },
    SECRETO_PRUEBAS,
    { algorithm: "HS256", expiresIn: "1h" }
  )
} as const;

export function bearer(token: string): string {
  return `Bearer ${token}`;
}

/** Vacía los documentos (sin tocar validadores ni índices) y recarga los datos mínimos. */
export async function reiniciarDatos(db: Db): Promise<void> {
  await Promise.all(
    ["usuarios", "categorias", "productos", "pedidos"].map((nombre) =>
      db.collection(nombre).deleteMany({})
    )
  );
  await insertarDatosMinimos(db);
}
