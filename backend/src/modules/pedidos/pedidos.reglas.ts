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

export type ResultadoValidacion = { valido: true } | { valido: false; mensaje: string };

export const ZONA_HORARIA = "America/Guayaquil";
const APERTURA_SEGUNDOS = 7 * 3600;
const CIERRE_SEGUNDOS = 16 * 3600;

const formatoHoraEcuador = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_HORARIA,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

/** Segundos transcurridos desde la medianoche en la hora de Ecuador. */
function segundosDelDiaEnEcuador(fecha: Date): number {
  const partes = formatoHoraEcuador.formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  return valor("hour") * 3600 + valor("minute") * 60 + valor("second");
}

/**
 * La hora de recogida debe ser posterior a `ahora` y estar entre las 07:00
 * y las 16:00 (inclusive) en la zona `America/Guayaquil`.
 */
export function validarHoraRecogida(fecha: Date, ahora: Date): ResultadoValidacion {
  if (Number.isNaN(fecha.getTime())) {
    return { valido: false, mensaje: "La hora de recogida no es válida" };
  }

  if (fecha.getTime() <= ahora.getTime()) {
    return {
      valido: false,
      mensaje: "La hora de recogida debe ser posterior a la hora actual"
    };
  }

  const segundos = segundosDelDiaEnEcuador(fecha);
  if (segundos < APERTURA_SEGUNDOS || segundos > CIERRE_SEGUNDOS) {
    return {
      valido: false,
      mensaje: "La hora de recogida debe estar entre las 07:00 y las 16:00"
    };
  }

  return { valido: true };
}

export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 20;

/** Al menos una línea y cada cantidad entera entre 1 y 20. */
export function validarCantidades(items: Array<{ cantidad: number }>): ResultadoValidacion {
  if (items.length === 0) {
    return { valido: false, mensaje: "El pedido debe tener al menos un producto" };
  }

  const cantidadInvalida = items.some(
    ({ cantidad }) =>
      !Number.isInteger(cantidad) || cantidad < CANTIDAD_MINIMA || cantidad > CANTIDAD_MAXIMA
  );

  if (cantidadInvalida) {
    return {
      valido: false,
      mensaje: "La cantidad de cada producto debe ser un entero entre 1 y 20"
    };
  }

  return { valido: true };
}
