import type { Db } from "mongodb";
import { contarDocumentos, type NombreColeccion } from "../../db/cliente.js";

export interface ResumenSalud {
  estado: "ok";
  baseDatos: string;
  colecciones: Record<NombreColeccion, number>;
}

/** Conteos reales de la base conectada; no modifica ningún documento. */
export async function obtenerSalud(db: Db): Promise<ResumenSalud> {
  return {
    estado: "ok",
    baseDatos: db.databaseName,
    colecciones: await contarDocumentos(db)
  };
}
