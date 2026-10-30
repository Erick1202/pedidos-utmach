export type EstadoPedido = 'recibido' | 'preparando' | 'listo' | 'entregado';

/** Línea del carrito en el navegador. El precio es informativo: el servidor lo recalcula. */
export interface LineaCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  imagenUrl?: string;
  cantidad: number;
}

/** Cuerpo de `POST /pedidos`: solo ids y cantidades, nunca precios. */
export interface DatosPedido {
  items: Array<{ productoId: string; cantidad: number }>;
  /** Fecha ISO 8601 con zona horaria. */
  horaRecogida: string;
}

export interface ItemPedido {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  _id: string;
  usuario: { _id: string; nombre: string };
  items: ItemPedido[];
  total: number;
  horaRecogida: string;
  estado: EstadoPedido;
  historialEstados: Array<{ estado: EstadoPedido; fecha: string }>;
  creadoEn: string;
}
