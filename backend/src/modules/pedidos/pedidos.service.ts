import { ObjectId, type Db, type Filter } from "mongodb";
import type { UsuarioAutenticado } from "../../middleware/autenticacion.js";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import type { ProductoDocumento } from "../productos/productos.service.js";
import {
  calcularTotales,
  ESTADOS_ACTIVOS,
  rangoDiaEcuador,
  siguienteEstado,
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

/** Máximo de pedidos activos que se devuelven al tablero. */
const LIMITE_ACTIVOS = 200;

/**
 * Pedidos del estudiante, del más reciente al más antiguo. El filtro por
 * `usuario._id` y el orden por `creadoEn` coinciden con `ix_usuario_fecha`.
 */
export async function listarMisPedidos(
  db: Db,
  usuarioId: string,
  limite: number
): Promise<PedidoPublico[]> {
  const pedidos = await db
    .collection<PedidoDocumento>("pedidos")
    .find({ "usuario._id": new ObjectId(usuarioId) })
    .sort({ creadoEn: -1 })
    .limit(limite)
    .toArray();

  return pedidos.map(aPedidoPublico);
}

/**
 * Pedidos pendientes de atender ordenados por hora de recogida
 * (`ix_estado_hora`). Con `fecha`, solo los que se recogen ese día en Ecuador.
 */
export async function listarActivos(db: Db, fecha?: string): Promise<PedidoPublico[]> {
  const filtro: Filter<PedidoDocumento> = { estado: { $in: ESTADOS_ACTIVOS } };
  if (fecha) {
    const { desde, hasta } = rangoDiaEcuador(fecha);
    filtro.horaRecogida = { $gte: desde, $lt: hasta };
  }

  const pedidos = await db
    .collection<PedidoDocumento>("pedidos")
    .find(filtro)
    .sort({ horaRecogida: 1 })
    .limit(LIMITE_ACTIVOS)
    .toArray();

  return pedidos.map(aPedidoPublico);
}

/**
 * Avanza el pedido al estado siguiente. La actualización es condicional al
 * estado leído: si otra petición lo cambió antes, `matchedCount` es 0 y se
 * responde `409` en lugar de sobrescribirlo.
 */
export async function avanzarEstado(db: Db, _id: ObjectId, ahora: Date): Promise<PedidoPublico> {
  const coleccion = db.collection<PedidoDocumento>("pedidos");

  const pedido = await coleccion.findOne({ _id });
  if (!pedido) {
    throw new ErrorAplicacion(404, "Pedido no encontrado");
  }

  const estado = siguienteEstado(pedido.estado);

  const { matchedCount } = await coleccion.updateOne(
    { _id, estado: pedido.estado },
    {
      $set: { estado },
      $push: { historialEstados: { estado, fecha: ahora } }
    }
  );
  if (matchedCount === 0) {
    throw new ErrorAplicacion(409, "El pedido ya cambió de estado");
  }

  const actualizado = await coleccion.findOne({ _id });
  if (!actualizado) {
    throw new ErrorAplicacion(404, "Pedido no encontrado");
  }
  return aPedidoPublico(actualizado);
}
