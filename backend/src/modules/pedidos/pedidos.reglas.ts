import { redondearMonto } from "../../utils/validacion.js";

/**
 * Reglas de negocio puras del pedido: no acceden a la base ni al reloj del
 * sistema, para poder probarlas de forma determinista.
 */

export interface LineaConPrecio {
  precioUnitario: number;
  cantidad: number;
}

export interface TotalesPedido<T extends LineaConPrecio> {
  items: Array<T & { subtotal: number }>;
  total: number;
}

/** Subtotal por línea y total del pedido, redondeados a dos decimales. */
export function calcularTotales<T extends LineaConPrecio>(items: T[]): TotalesPedido<T> {
  const conSubtotal = items.map((item) => ({
    ...item,
    subtotal: redondearMonto(item.precioUnitario * item.cantidad)
  }));

  const total = redondearMonto(
    conSubtotal.reduce((suma, item) => suma + item.subtotal, 0)
  );

  return { items: conSubtotal, total };
}
