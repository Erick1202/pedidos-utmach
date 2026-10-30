import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import { redondearMonto } from "../../utils/validacion.js";

/**
 * Reglas de negocio puras del pedido: no acceden a la base ni al reloj del
 * sistema, para poder probarlas de forma determinista.
 */

/** Orden único de los estados: no se retrocede ni se saltan pasos. */
export const ESTADOS_PEDIDO = ["recibido", "preparando", "listo", "entregado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type ResultadoValidacion = { valido: true } | { valido: false; mensaje: string };

export interface LineaConPrecio {
  precioUnitario: number;
  cantidad: number;
}

export interface TotalesPedido<T extends LineaConPrecio> {
  items: Array<T & { subtotal: number }>;
  total: number;
}

export const ZONA_HORARIA = "America/Guayaquil";
export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 20;

const APERTURA_SEGUNDOS = 7 * 3600;
const CIERRE_SEGUNDOS = 16 * 3600;

const VALIDO: ResultadoValidacion = { valido: true };
const invalido = (mensaje: string): ResultadoValidacion => ({ valido: false, mensaje });

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

/**
 * La hora de recogida debe ser posterior a `ahora` y estar entre las 07:00
 * y las 16:00 (inclusive) en la zona `America/Guayaquil`.
 */
export function validarHoraRecogida(fecha: Date, ahora: Date): ResultadoValidacion {
  if (Number.isNaN(fecha.getTime())) {
    return invalido("La hora de recogida no es válida");
  }

  if (fecha.getTime() <= ahora.getTime()) {
    return invalido("La hora de recogida debe ser posterior a la hora actual");
  }

  const segundos = segundosDelDiaEnEcuador(fecha);
  if (segundos < APERTURA_SEGUNDOS || segundos > CIERRE_SEGUNDOS) {
    return invalido("La hora de recogida debe estar entre las 07:00 y las 16:00");
  }

  return VALIDO;
}

/** Al menos una línea y cada cantidad entera entre 1 y 20. */
export function validarCantidades(items: Array<{ cantidad: number }>): ResultadoValidacion {
  if (items.length === 0) {
    return invalido("El pedido debe tener al menos un producto");
  }

  const cantidadInvalida = items.some(
    ({ cantidad }) =>
      !Number.isInteger(cantidad) || cantidad < CANTIDAD_MINIMA || cantidad > CANTIDAD_MAXIMA
  );

  if (cantidadInvalida) {
    return invalido("La cantidad de cada producto debe ser un entero entre 1 y 20");
  }

  return VALIDO;
}

/**
 * Estado que sigue a `estadoActual`. Lanza `409` si el pedido ya fue
 * entregado y `400` si el valor no es un estado conocido.
 */
export function siguienteEstado(estadoActual: string): EstadoPedido {
  const posicion = ESTADOS_PEDIDO.findIndex((estado) => estado === estadoActual);

  if (posicion === -1) {
    throw new ErrorAplicacion(400, `El estado «${estadoActual}» no es válido`);
  }

  const siguiente = ESTADOS_PEDIDO[posicion + 1];
  if (!siguiente) {
    throw new ErrorAplicacion(409, "El pedido ya fue entregado y no puede avanzar");
  }

  return siguiente;
}

/** Estados que el bar todavía debe atender. */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ["recibido", "preparando", "listo"];

/**
 * Límites de un día de calendario (`AAAA-MM-DD`) en Ecuador: de 05:00Z a
 * 05:00Z del día siguiente. Ecuador continental no usa horario de verano.
 */
export function rangoDiaEcuador(fecha: string): { desde: Date; hasta: Date } {
  const desde = new Date(`${fecha}T00:00:00-05:00`);
  return { desde, hasta: new Date(desde.getTime() + 24 * 3600 * 1000) };
}
