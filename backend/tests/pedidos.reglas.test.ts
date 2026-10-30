import { describe, expect, it } from "vitest";
import { calcularTotales } from "../src/modules/pedidos/pedidos.reglas.js";

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
