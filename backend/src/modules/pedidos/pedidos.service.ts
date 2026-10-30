import { ObjectId, type Db } from "mongodb";
import type { UsuarioAutenticado } from "../../middleware/autenticacion.js";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import type { ProductoDocumento } from "../productos/productos.service.js";
import {
  calcularTotales,
  validarCantidades,
  validarHoraRecogida,
  type EstadoPedido,
  type ResultadoValidacion
} from "./pedidos.reglas.js";
import type { DatosCrearPedido } from "./pedidos.schemas.js";

export type { EstadoPedido };

export interface ItemPedidoDocumento {
  productoId: ObjectId;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface PedidoDocumento {
  _id: ObjectId;
  usuario: { _id: ObjectId; nombre: string };
  items: ItemPedidoDocumento[];
  total: number;
  horaRecogida: Date;
  estado: EstadoPedido;
  historialEstados: Array<{ estado: EstadoPedido; fecha: Date }>;
  creadoEn: Date;
}

export interface PedidoPublico {
  _id: string;
  usuario: { _id: string; nombre: string };
  items: Array<Omit<ItemPedidoDocumento, "productoId"> & { productoId: string }>;
  total: number;
  horaRecogida: Date;
  estado: EstadoPedido;
  historialEstados: Array<{ estado: EstadoPedido; fecha: Date }>;
  creadoEn: Date;
}

function aPedidoPublico(pedido: PedidoDocumento): PedidoPublico {
  return {
    _id: pedido._id.toHexString(),
    usuario: { _id: pedido.usuario._id.toHexString(), nombre: pedido.usuario.nombre },
    items: pedido.items.map((item) => ({ ...item, productoId: item.productoId.toHexString() })),
    total: pedido.total,
    horaRecogida: pedido.horaRecogida,
    estado: pedido.estado,
    historialEstados: pedido.historialEstados,
    creadoEn: pedido.creadoEn
  };
}

/** Convierte un resultado inválido de las reglas en un `400`. */
function exigir(resultado: ResultadoValidacion): void {
  if (!resultado.valido) {
    throw new ErrorAplicacion(400, resultado.mensaje);
  }
}

/**
 * Crea el pedido con precios y nombres leídos de la base (nunca del cliente),
 * totales calculados en el servidor y el estado inicial `recibido`.
 */
export async function crearPedido(
  db: Db,
  usuario: UsuarioAutenticado,
  datos: DatosCrearPedido,
  ahora: Date
): Promise<PedidoPublico> {
  exigir(validarCantidades(datos.items));
  exigir(validarHoraRecogida(datos.horaRecogida, ahora));

  const productos = await db
    .collection<ProductoDocumento>("productos")
    .find({ _id: { $in: datos.items.map((item) => item.productoId) } })
    .toArray();
  const porId = new Map(productos.map((producto) => [producto._id.toHexString(), producto]));

  const lineas = datos.items.map(({ productoId, cantidad }) => {
    const producto = porId.get(productoId.toHexString());
    if (!producto) {
      throw new ErrorAplicacion(400, "Uno de los productos del pedido no existe");
    }
    if (!producto.disponible) {
      throw new ErrorAplicacion(400, `El producto «${producto.nombre}» no está disponible`);
    }
    return {
      productoId: producto._id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad
    };
  });

  const { items, total } = calcularTotales(lineas);

  const pedido: PedidoDocumento = {
    _id: new ObjectId(),
    usuario: { _id: new ObjectId(usuario._id), nombre: usuario.nombre },
    items,
    total,
    horaRecogida: datos.horaRecogida,
    estado: "recibido",
    historialEstados: [{ estado: "recibido", fecha: ahora }],
    creadoEn: ahora
  };

  await db.collection<PedidoDocumento>("pedidos").insertOne(pedido);
  return aPedidoPublico(pedido);
}
