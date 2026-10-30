import { MongoClient, type Db } from "mongodb";

/** Colecciones de la base existente `pedidos_utmach`. */
export const COLECCIONES = ["usuarios", "categorias", "productos", "pedidos"] as const;

export type NombreColeccion = (typeof COLECCIONES)[number];

export interface ConexionMongo {
  cliente: MongoClient;
  db: Db;
}

/**
 * Abre la conexión con MongoDB y confirma con un ping que la base responde.
 * El nombre de la base se toma de la URI (por ejemplo, `pedidos_utmach`).
 */
export async function conectarBaseDeDatos(uri: string): Promise<ConexionMongo> {
  const cliente = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    ignoreUndefined: true
  });

  try {
    await cliente.connect();
    const db = cliente.db();
    await db.command({ ping: 1 });
    return { cliente, db };
  } catch (error) {
    await cliente.close().catch(() => undefined);
    throw error;
  }
}

/** Cuenta los documentos de las cuatro colecciones, en paralelo. */
export async function contarDocumentos(db: Db): Promise<Record<NombreColeccion, number>> {
  const entradas = await Promise.all(
    COLECCIONES.map(async (nombre) => {
      const total = await db.collection(nombre).countDocuments();
      return [nombre, total] as const;
    })
  );

  return Object.fromEntries(entradas) as Record<NombreColeccion, number>;
}
