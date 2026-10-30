import { MongoClient, ObjectId, type Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { crearColecciones, crearIndices } from "./esquema.js";

/**
 * Identificadores deterministas para las pruebas.
 * Reutilizan los mismos valores que los datos de ejemplo de la base real.
 */
export const IDS = {
  admin: new ObjectId("64a000000000000000000001"),
  estudiante: new ObjectId("64a100000000000000000001"),
  categoriaDesayunos: new ObjectId("64c000000000000000000001"),
  categoriaAlmuerzos: new ObjectId("64c000000000000000000002"),
  bolon: new ObjectId("64d000000000000000000001"),
  tigrillo: new ObjectId("64d000000000000000000003"),
  almuerzo: new ObjectId("64d000000000000000000004"),
  pedido: new ObjectId("64e000000000000000000001")
} as const;

/** Hashes reales del script de la base (contraseñas de prueba). */
const HASH_ADMIN = "$2b$10$GO/ZMAwNw/FaGlWFhtyZ7eI4eMFq6Y7AxFgo2r7qDOL3w0EPji70q";
const HASH_ESTUDIANTE = "$2b$10$UxcLyPrl/3gWbnbXMZ67aOqjFqjj7iL6BHFgz5CFGAFSv7144PHFe";

export interface EntornoPruebas {
  mongod: MongoMemoryServer;
  cliente: MongoClient;
  db: Db;
  cerrar: () => Promise<void>;
}

/**
 * Levanta una instancia efímera de MongoDB con los validadores e índices
 * reales y, opcionalmente, datos mínimos. Nunca usa la base local.
 */
export async function crearEntornoPruebas(
  opciones: { conDatos?: boolean } = {}
): Promise<EntornoPruebas> {
  const binarioDelSistema = process.env.MONGOMS_SYSTEM_BINARY;

  const mongod = await MongoMemoryServer.create({
    binary: binarioDelSistema ? { systemBinary: binarioDelSistema } : undefined,
    instance: { dbName: "pedidos_utmach" }
  });

  const cliente = new MongoClient(mongod.getUri(), { ignoreUndefined: true });
  await cliente.connect();
  const db = cliente.db("pedidos_utmach");

  await crearColecciones(db);
  await crearIndices(db);

  if (opciones.conDatos !== false) {
    await insertarDatosMinimos(db);
  }

  return {
    mongod,
    cliente,
    db,
    cerrar: async () => {
      await cliente.close();
      await mongod.stop();
    }
  };
}

/** Datos mínimos: 2 usuarios, 2 categorías, 3 productos y 1 pedido. */
export async function insertarDatosMinimos(db: Db): Promise<void> {
  await db.collection("usuarios").insertMany([
    {
      _id: IDS.admin,
      nombre: "Administrador Bar UTMACH",
      email: "admin@utmachala.edu.ec",
      passwordHash: HASH_ADMIN,
      rol: "admin",
      creadoEn: new Date("2026-10-01T13:00:00Z")
    },
    {
      _id: IDS.estudiante,
      nombre: "Ana Torres",
      email: "ana.torres@utmachala.edu.ec",
      passwordHash: HASH_ESTUDIANTE,
      rol: "estudiante",
      creadoEn: new Date("2026-10-02T14:00:00Z")
    }
  ]);

  await db.collection("categorias").insertMany([
    {
      _id: IDS.categoriaDesayunos,
      nombre: "Desayunos",
      slug: "desayunos"
    },
    {
      _id: IDS.categoriaAlmuerzos,
      nombre: "Almuerzos",
      slug: "almuerzos"
    }
  ]);

  await db.collection("productos").insertMany([
    {
      _id: IDS.bolon,
      nombre: "Bolón de verde",
      descripcion: "Bolón de plátano verde con queso o chicharrón",
      precio: 1.5,
      imagenUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
      disponible: true,
      categoria: { _id: IDS.categoriaDesayunos, nombre: "Desayunos" },
      creadoEn: new Date("2026-10-01T13:00:00Z")
    },
    {
      _id: IDS.tigrillo,
      nombre: "Tigrillo",
      descripcion: "Plátano verde majado con huevo y queso",
      precio: 2,
      imagenUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
      disponible: false,
      categoria: { _id: IDS.categoriaDesayunos, nombre: "Desayunos" },
      creadoEn: new Date("2026-10-01T13:00:00Z")
    },
    {
      _id: IDS.almuerzo,
      nombre: "Almuerzo del día",
      descripcion: "Sopa, segundo y jugo del día",
      precio: 2.75,
      imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
      disponible: true,
      categoria: { _id: IDS.categoriaAlmuerzos, nombre: "Almuerzos" },
      creadoEn: new Date("2026-10-01T13:00:00Z")
    }
  ]);

  await db.collection("pedidos").insertOne({
    _id: IDS.pedido,
    usuario: { _id: IDS.estudiante, nombre: "Ana Torres" },
    items: [
      {
        productoId: IDS.bolon,
        nombre: "Bolón de verde",
        precioUnitario: 1.5,
        cantidad: 2,
        subtotal: 3
      }
    ],
    total: 3,
    horaRecogida: new Date("2026-10-28T15:00:00Z"),
    estado: "recibido",
    historialEstados: [
      { estado: "recibido", fecha: new Date("2026-10-28T13:00:00Z") }
    ],
    creadoEn: new Date("2026-10-28T13:00:00Z")
  });
}
