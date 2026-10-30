import { describe, expect, it } from "vitest";
import {
  calcularTotales,
  validarCantidades,
  validarHoraRecogida
} from "../src/modules/pedidos/pedidos.reglas.js";

/** 09:00 en Ecuador (UTC-5). */
const AHORA = new Date("2026-10-29T14:00:00Z");

/** Construye una fecha con la hora local de Ecuador del 29 de octubre de 2026. */
const enEcuador = (hora: string, dia = "2026-10-29") => new Date(`${dia}T${hora}-05:00`);

describe("calcularTotales", () => {
  it("calcula el subtotal de cada línea y el total", () => {
    const resultado = calcularTotales([
      { nombre: "Bolón de verde", precioUnitario: 1.5, cantidad: 2 },
      { nombre: "Café pasado", precioUnitario: 0.6, cantidad: 1 }
    ]);

    expect(resultado.items).toEqual([
      { nombre: "Bolón de verde", precioUnitario: 1.5, cantidad: 2, subtotal: 3 },
      { nombre: "Café pasado", precioUnitario: 0.6, cantidad: 1, subtotal: 0.6 }
    ]);
    expect(resultado.total).toBe(3.6);
  });

  it("redondea los subtotales a dos decimales", () => {
    const resultado = calcularTotales([
      { precioUnitario: 0.1, cantidad: 3 },
      { precioUnitario: 1.15, cantidad: 3 }
    ]);

    // 0.1 * 3 = 0.30000000000000004 y 1.15 * 3 = 3.4499999999999997
    expect(resultado.items.map((item) => item.subtotal)).toEqual([0.3, 3.45]);
  });

  it("redondea el total a dos decimales", () => {
    const resultado = calcularTotales([
      { precioUnitario: 0.1, cantidad: 1 },
      { precioUnitario: 0.2, cantidad: 1 }
    ]);

    // 0.1 + 0.2 = 0.30000000000000004
    expect(resultado.total).toBe(0.3);
  });

  it("conserva los demás campos de cada línea", () => {
    const resultado = calcularTotales([
      { productoId: "abc", nombre: "Chifles", precioUnitario: 0.5, cantidad: 20 }
    ]);

    expect(resultado.items[0]).toEqual({
      productoId: "abc",
      nombre: "Chifles",
      precioUnitario: 0.5,
      cantidad: 20,
      subtotal: 10
    });
    expect(resultado.total).toBe(10);
  });
});

describe("validarHoraRecogida", () => {
  const MENSAJE_HORARIO = "La hora de recogida debe estar entre las 07:00 y las 16:00";
  const MENSAJE_FUTURO = "La hora de recogida debe ser posterior a la hora actual";

  it("acepta una hora futura dentro del horario", () => {
    expect(validarHoraRecogida(enEcuador("12:30:00"), AHORA)).toEqual({ valido: true });
  });

  it("acepta los límites 07:00 y 16:00 de Ecuador", () => {
    const temprano = new Date("2026-10-29T11:00:00Z"); // 06:00 en Ecuador

    expect(validarHoraRecogida(enEcuador("07:00:00"), temprano)).toEqual({ valido: true });
    expect(validarHoraRecogida(enEcuador("16:00:00"), AHORA)).toEqual({ valido: true });
  });

  it("rechaza las 06:59 y las 16:01 de Ecuador", () => {
    const temprano = new Date("2026-10-29T11:00:00Z");

    expect(validarHoraRecogida(enEcuador("06:59:00"), temprano)).toEqual({
      valido: false,
      mensaje: MENSAJE_HORARIO
    });
    expect(validarHoraRecogida(enEcuador("16:01:00"), AHORA)).toEqual({
      valido: false,
      mensaje: MENSAJE_HORARIO
    });
    expect(validarHoraRecogida(enEcuador("16:00:01"), AHORA)).toEqual({
      valido: false,
      mensaje: MENSAJE_HORARIO
    });
  });

  it("usa la hora de Ecuador y no la UTC", () => {
    // 15:00Z es 10:00 en Ecuador (válida); 22:00Z es 17:00 en Ecuador (inválida)
    expect(validarHoraRecogida(new Date("2026-10-29T15:00:00Z"), AHORA)).toEqual({
      valido: true
    });
    expect(validarHoraRecogida(new Date("2026-10-29T22:00:00Z"), AHORA)).toEqual({
      valido: false,
      mensaje: MENSAJE_HORARIO
    });
  });

  it("rechaza una hora pasada o igual a la actual", () => {
    expect(validarHoraRecogida(enEcuador("08:30:00"), AHORA)).toEqual({
      valido: false,
      mensaje: MENSAJE_FUTURO
    });
    expect(validarHoraRecogida(AHORA, AHORA)).toEqual({
      valido: false,
      mensaje: MENSAJE_FUTURO
    });
  });

  it("acepta un día futuro dentro del horario", () => {
    expect(validarHoraRecogida(enEcuador("07:30:00", "2026-10-30"), AHORA)).toEqual({
      valido: true
    });
  });

  it("rechaza una fecha inválida", () => {
    expect(validarHoraRecogida(new Date("no es fecha"), AHORA)).toEqual({
      valido: false,
      mensaje: "La hora de recogida no es válida"
    });
  });
});

describe("validarCantidades", () => {
  const MENSAJE_CANTIDAD = "La cantidad de cada producto debe ser un entero entre 1 y 20";

  it("acepta cantidades enteras entre 1 y 20", () => {
    expect(validarCantidades([{ cantidad: 1 }, { cantidad: 7 }, { cantidad: 20 }])).toEqual({
      valido: true
    });
  });

  it("exige al menos una línea", () => {
    expect(validarCantidades([])).toEqual({
      valido: false,
      mensaje: "El pedido debe tener al menos un producto"
    });
  });

  it.each([0, -1, 21, 1.5, Number.NaN])("rechaza la cantidad %s", (cantidad) => {
    expect(validarCantidades([{ cantidad: 2 }, { cantidad }])).toEqual({
      valido: false,
      mensaje: MENSAJE_CANTIDAD
    });
  });
});
