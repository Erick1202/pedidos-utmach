import { ObjectId, type Db, type Filter, type FindOptions } from "mongodb";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import type { CategoriaDocumento } from "../categorias/categorias.service.js";
import type { DatosProducto, FiltrosProductos } from "./productos.schemas.js";

export interface ProductoDocumento {
  _id: ObjectId;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  disponible: boolean;
  categoria: { _id: ObjectId; nombre: string };
  creadoEn: Date;
}

export interface ProductoPublico {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  disponible: boolean;
  categoria: { _id: string; nombre: string };
  creadoEn: Date;
}

const PRODUCTO_NO_ENCONTRADO = "Producto no encontrado";

function aProductoPublico(producto: ProductoDocumento): ProductoPublico {
  return {
    _id: producto._id.toHexString(),
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? "",
    precio: producto.precio,
    ...(producto.imagenUrl ? { imagenUrl: producto.imagenUrl } : {}),
    disponible: producto.disponible,
    categoria: {
      _id: producto.categoria._id.toHexString(),
      nombre: producto.categoria.nombre
    },
    creadoEn: producto.creadoEn
  };
}

function coleccion(db: Db) {
  return db.collection<ProductoDocumento>("productos");
}

/** Lee la categoría de la base para embeber `{ _id, nombre }`. */
async function categoriaEmbebida(
  db: Db,
  categoriaId: ObjectId
): Promise<ProductoDocumento["categoria"]> {
  const categoria = await db
    .collection<CategoriaDocumento>("categorias")
    .findOne({ _id: categoriaId });

  if (!categoria) {
    throw new ErrorAplicacion(400, "La categoría indicada no existe");
  }

  return { _id: categoria._id, nombre: categoria.nombre };
}

/**
 * Menú: por defecto solo disponibles. `categoria` aprovecha el índice
 * `ix_categoria_disponible`; `q` usa `$text` sobre `tx_busqueda` y ordena
 * por relevancia (`textScore`).
 */
export async function listarProductos(
  db: Db,
  filtros: FiltrosProductos
): Promise<ProductoPublico[]> {
  const filtro: Filter<ProductoDocumento> = {};

  if (!filtros.todos) {
    filtro.disponible = true;
  }
  if (filtros.categoria) {
    filtro["categoria._id"] = filtros.categoria;
  }

  let opciones: FindOptions;
  if (filtros.q) {
    filtro.$text = { $search: filtros.q };
    opciones = {
      projection: { score: { $meta: "textScore" } },
      sort: { score: { $meta: "textScore" } }
    };
  } else {
    opciones = { sort: { "categoria.nombre": 1, nombre: 1 } };
  }

  const productos = await coleccion(db).find(filtro, opciones).toArray();
  return productos.map(aProductoPublico);
}

export async function obtenerProducto(
  db: Db,
  id: ObjectId
): Promise<ProductoPublico> {
  const producto = await coleccion(db).findOne({ _id: id });
  if (!producto) {
    throw new ErrorAplicacion(404, PRODUCTO_NO_ENCONTRADO);
  }
  return aProductoPublico(producto);
}

export async function crearProducto(
  db: Db,
  datos: DatosProducto
): Promise<ProductoPublico> {
  const producto: ProductoDocumento = {
    _id: new ObjectId(),
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    ...(datos.imagenUrl ? { imagenUrl: datos.imagenUrl } : {}),
    disponible: datos.disponible,
    categoria: await categoriaEmbebida(db, datos.categoriaId),
    creadoEn: new Date()
  };

  await coleccion(db).insertOne(producto);
  return aProductoPublico(producto);
}

/** Reemplazo completo de los campos editables; conserva `_id` y `creadoEn`. */
export async function actualizarProducto(
  db: Db,
  id: ObjectId,
  datos: DatosProducto
): Promise<ProductoPublico> {
  const categoria = await categoriaEmbebida(db, datos.categoriaId);

  const actualizacion = datos.imagenUrl
    ? {
        $set: {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precio: datos.precio,
          imagenUrl: datos.imagenUrl,
          disponible: datos.disponible,
          categoria
        }
      }
    : {
        $set: {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precio: datos.precio,
          disponible: datos.disponible,
          categoria
        },
        $unset: { imagenUrl: "" as const }
      };

  const producto = await coleccion(db).findOneAndUpdate({ _id: id }, actualizacion, {
    returnDocument: "after"
  });

  if (!producto) {
    throw new ErrorAplicacion(404, PRODUCTO_NO_ENCONTRADO);
  }
  return aProductoPublico(producto);
}

export async function cambiarDisponibilidad(
  db: Db,
  id: ObjectId,
  disponible: boolean
): Promise<ProductoPublico> {
  const producto = await coleccion(db).findOneAndUpdate(
    { _id: id },
    { $set: { disponible } },
    { returnDocument: "after" }
  );

  if (!producto) {
    throw new ErrorAplicacion(404, PRODUCTO_NO_ENCONTRADO);
  }
  return aProductoPublico(producto);
}

export async function eliminarProducto(db: Db, id: ObjectId): Promise<void> {
  const resultado = await coleccion(db).deleteOne({ _id: id });
  if (resultado.deletedCount === 0) {
    throw new ErrorAplicacion(404, PRODUCTO_NO_ENCONTRADO);
  }
}
