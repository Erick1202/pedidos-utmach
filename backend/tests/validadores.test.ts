import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  crearEntornoPruebas,
  IDS,
  type EntornoPruebas
} from "./helpers/base.js";

function pedidoValido() {
  return {
    usuario: { _id: IDS.estudiante, nombre: "Ana Torres" },
    items: [
      {
        productoId: IDS.bolon,
        nombre: "Bolón de verde",
        precioUnitario: 1.5,
        cantidad: 2,
        subtotal: 3
      }
    ],
    total: 3,
    horaRecogida: new Date("2026-10-30T15:00:00Z"),
    estado: "recibido",
    historialEstados: [
      { estado: "recibido", fecha: new Date("2026-10-29T13:00:00Z") }
    ],
    creadoEn: new Date("2026-10-29T13:00:00Z")
  };
}

describe("validadores e índices del helper de pruebas", () => {
  let entorno: EntornoPruebas;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  it("acepta un pedido construido como lo hará la API", async () => {
    const resultado = await entorno.db
      .collection("pedidos")
      .insertOne(pedidoValido());

    expect(resultado.acknowledged).toBe(true);
  });

  it("rechaza una cantidad fuera del rango 1..20", async () => {
    const pedido = pedidoValido();
    pedido.items[0]!.cantidad = 0;

    await expect(
      entorno.db.collection("pedidos").insertOne(pedido)
    ).rejects.toMatchObject({ code: 121 });
  });

  it("rechaza un precio menor o igual a cero", async () => {
    const producto = {
      nombre: "Producto inválido",
      precio: 0,
      disponible: true,
      categoria: { _id: IDS.categoriaDesayunos, nombre: "Desayunos" },
      creadoEn: new Date()
    };

    await expect(
      entorno.db.collection("productos").insertOne(producto)
    ).rejects.toMatchObject({ code: 121 });
  });

  it("mantiene el correo único con el índice ux_email", async () => {
    const usuarioDuplicado = {
      nombre: "Otra Ana",
      email: "ana.torres@utmachala.edu.ec",
      passwordHash: "hash-de-prueba",
      rol: "estudiante",
      creadoEn: new Date()
    };

    await expect(
      entorno.db.collection("usuarios").insertOne(usuarioDuplicado)
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("crea los índices con los nombres de la base real", async () => {
    const indicesProductos = (await entorno.db.collection("productos").indexes()).map(
      (indice) => indice.name
    );
    const indicesPedidos = (await entorno.db.collection("pedidos").indexes()).map(
      (indice) => indice.name
    );

    expect(indicesProductos).toEqual(
      expect.arrayContaining(["ix_categoria_disponible", "tx_busqueda"])
    );
    expect(indicesPedidos).toEqual(
      expect.arrayContaining(["ix_usuario_fecha", "ix_estado_hora"])
    );
  });
});
