import type { EstadoPedido, Pedido } from '../models/pedido';

/**
 * Presentación de los estados del pedido. El orden y las transiciones los
 * decide el servidor (`siguienteEstado`); aquí solo se muestran.
 */

export const ESTADOS_PEDIDO: readonly EstadoPedido[] = [
  'recibido',
  'preparando',
  'listo',
  'entregado',
];

/** Cada cuánto se consulta de nuevo el estado de los pedidos (sondeo). */
export const INTERVALO_REFRESCO_MS = 15_000;

/** Columnas del tablero del administrador. */
export const ESTADOS_ACTIVOS: readonly EstadoPedido[] = ['recibido', 'preparando', 'listo'];

export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
};

/** Colores: recibido gris, preparando ámbar, listo verde, entregado azul. */
export const CLASES_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'bg-slate-100 text-slate-700 ring-slate-300',
  preparando: 'bg-amber-100 text-amber-800 ring-amber-300',
  listo: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  entregado: 'bg-blue-100 text-blue-800 ring-blue-300',
};

/** Color del punto en la línea de tiempo. */
export const PUNTOS_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'bg-slate-400',
  preparando: 'bg-amber-500',
  listo: 'bg-emerald-500',
  entregado: 'bg-blue-600',
};

const ACCIONES: Record<EstadoPedido, string | null> = {
  recibido: 'Empezar a preparar',
  preparando: 'Marcar listo',
  listo: 'Entregar',
  entregado: null,
};

/** Texto del botón que avanza el pedido, o `null` si ya no puede avanzar. */
export function accionSiguiente(estado: EstadoPedido): string | null {
  return ACCIONES[estado];
}

/**
 * Ids de los pedidos que estaban en otro estado en `anteriores` y ahora están
 * en `listo`. Los pedidos nuevos no cuentan: no hubo un cambio que avisar.
 */
export function pedidosQuePasaronAListo(
  anteriores: readonly Pedido[],
  actuales: readonly Pedido[],
): string[] {
  const estadoAnterior = new Map(anteriores.map((pedido) => [pedido._id, pedido.estado]));

  return actuales
    .filter((pedido) => {
      const antes = estadoAnterior.get(pedido._id);
      return pedido.estado === 'listo' && antes !== undefined && antes !== 'listo';
    })
    .map((pedido) => pedido._id);
}
