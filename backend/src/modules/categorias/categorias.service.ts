import { ObjectId, type Db } from "mongodb";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import type { DatosCategoria } from "./categorias.schemas.js";

export interface CategoriaDocumento {
  _id: ObjectId;
  nombre: string;
  slug: string;
}

export interface CategoriaPublica {
  _id: string;
  nombre: string;
  slug: string;
}

const MENSAJE_DUPLICADO = "Ya existe una categoría con ese nombre";

function aCategoriaPublica(categoria: CategoriaDocumento): CategoriaPublica {
  return {
    _id: categoria._id.toHexString(),
    nombre: categoria.nombre,
    slug: categoria.slug
  };
}

/** "Bebidas Frías" → "bebidas-frias". Cumple el patrón `^[a-z0-9-]+$`. */
export function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugValido(nombre: string): string {
  const slug = generarSlug(nombre);
  if (!slug) {
    throw new ErrorAplicacion(400, "El nombre debe contener letras o números");
  }
  return slug;
}

async function verificarSlugLibre(
  db: Db,
  slug: string,
  excluirId?: ObjectId
): Promise<void> {
  const filtro = excluirId ? { slug, _id: { $ne: excluirId } } : { slug };
  const existente = await db
    .collection<CategoriaDocumento>("categorias")
    .findOne(filtro, { projection: { _id: 1 } });

  if (existente) {
    throw new ErrorAplicacion(409, MENSAJE_DUPLICADO);
  }
}

export async function listarCategorias(db: Db): Promise<CategoriaPublica[]> {
  const categorias = await db
    .collection<CategoriaDocumento>("categorias")
    .find()
    .sort({ nombre: 1 })
    .toArray();

  return categorias.map(aCategoriaPublica);
}

export async function crearCategoria(
  db: Db,
  datos: DatosCategoria
): Promise<CategoriaPublica> {
  const slug = slugValido(datos.nombre);
  await verificarSlugLibre(db, slug);

  const categoria: CategoriaDocumento = {
    _id: new ObjectId(),
    nombre: datos.nombre,
    slug
  };

  await db.collection<CategoriaDocumento>("categorias").insertOne(categoria);
  return aCategoriaPublica(categoria);
}

/**
 * Renombra la categoría y sincroniza la copia embebida en los productos.
 * Sin transacción (la instancia local es standalone): repetir el PUT es
 * idempotente y corrige cualquier copia que haya quedado desactualizada.
 */
export async function actualizarCategoria(
  db: Db,
  id: ObjectId,
  datos: DatosCategoria
): Promise<CategoriaPublica> {
  const categorias = db.collection<CategoriaDocumento>("categorias");

  const actual = await categorias.findOne({ _id: id });
  if (!actual) {
    throw new ErrorAplicacion(404, "Categoría no encontrada");
  }

  const slug = slugValido(datos.nombre);
  await verificarSlugLibre(db, slug, id);

  await categorias.updateOne({ _id: id }, { $set: { nombre: datos.nombre, slug } });

  await db
    .collection("productos")
    .updateMany(
      { "categoria._id": id, "categoria.nombre": { $ne: datos.nombre } },
      { $set: { "categoria.nombre": datos.nombre } }
    );

  return aCategoriaPublica({ _id: id, nombre: datos.nombre, slug });
}

export async function eliminarCategoria(db: Db, id: ObjectId): Promise<void> {
  const categorias = db.collection<CategoriaDocumento>("categorias");

  const existe = await categorias.findOne({ _id: id }, { projection: { _id: 1 } });
  if (!existe) {
    throw new ErrorAplicacion(404, "Categoría no encontrada");
  }

  const productos = await db
    .collection("productos")
    .countDocuments({ "categoria._id": id });
  if (productos > 0) {
    throw new ErrorAplicacion(409, "No se puede eliminar una categoría con productos");
  }

  await categorias.deleteOne({ _id: id });
}
