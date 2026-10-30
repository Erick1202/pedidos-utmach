import { ObjectId } from "mongodb";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import {
  crearEntornoPruebas,
  IDS,
  SECRETO_PRUEBAS,
  type EntornoPruebas
} from "./helpers/base.js";
import { VALIDADORES } from "./helpers/esquema.js";
import { bearer, reiniciarDatos, TOKENS } from "./helpers/tokens.js";

/** Reloj fijo: 29 de octubre de 2026 a las 09:00 en Ecuador. */
const AHORA = new Date("2026-10-29T14:00:00Z");
const HORA_VALIDA = "2026-10-29T12:30:00-05:00";

const cuerpoValido = () => ({
  items: [
    { productoId: IDS.bolon.toHexString(), cantidad: 2 },
    { productoId: IDS.almuerzo.toHexString(), cantidad: 1 }
  ],
  horaRecogida: HORA_VALIDA
});

describe("pedidos", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  const pedidos = () => entorno.db.collection("pedidos");
  const crear = (cuerpo: unknown, token: string = TOKENS.estudiante) =>
    request(app).post("/api/pedidos").set("Authorization", bearer(token)).send(cuerpo as object);

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS, ahora: () => AHORA });
  });

  beforeEach(async () => {
    await reiniciarDatos(entorno.db);
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  describe("POST /api/pedidos", () => {
    it("crea el pedido con precios de la base, usuario del token y estado recibido", async () => {
      const respuesta = await crear(cuerpoValido());

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.pedido).toMatchObject({
        usuario: { _id: IDS.estudiante.toHexString(), nombre: "Ana Torres" },
        items: [
          {
            productoId: IDS.bolon.toHexString(),
            nombre: "Bolón de verde",
            precioUnitario: 1.5,
            cantidad: 2,
            subtotal: 3
          },
          {
            productoId: IDS.almuerzo.toHexString(),
            nombre: "Almuerzo del día",
            precioUnitario: 2.75,
            cantidad: 1,
            subtotal: 2.75
          }
        ],
        total: 5.75,
        horaRecogida: "2026-10-29T17:30:00.000Z",
        estado: "recibido",
        historialEstados: [{ estado: "recibido", fecha: AHORA.toISOString() }],
        creadoEn: AHORA.toISOString()
      });
      expect(await pedidos().countDocuments()).toBe(2);
    });

    it("guarda un documento que cumple el validador real con ObjectId y Date", async () => {
      const respuesta = await crear(cuerpoValido());
      const _id = new ObjectId(respuesta.body.pedido._id as string);

      const cumpleEsquema = await pedidos().countDocuments({
        $and: [{ _id }, VALIDADORES.pedidos as object]
      });
      const tiposCorrectos = await pedidos().countDocuments({
        _id,
        "usuario._id": { $type: "objectId" },
        "items.productoId": { $type: "objectId" },
        horaRecogida: { $type: "date" },
        creadoEn: { $type: "date" },
        "historialEstados.fecha": { $type: "date" }
      });

      expect(cumpleEsquema).toBe(1);
      expect(tiposCorrectos).toBe(1);
    });

    it("ignora el precio, subtotal y total enviados por el cliente", async () => {
      const respuesta = await crear({
        items: [
          { productoId: IDS.bolon.toHexString(), cantidad: 2, precioUnitario: 0.01, subtotal: 0.02 }
        ],
        horaRecogida: HORA_VALIDA,
        total: 0.02,
        usuario: { _id: IDS.admin.toHexString(), nombre: "Intruso" }
      });

      expect(respuesta.status).toBe(201);
      const guardado = await pedidos().findOne({
        _id: new ObjectId(respuesta.body.pedido._id as string)
      });
      expect(guardado?.items[0]).toMatchObject({ precioUnitario: 1.5, subtotal: 3 });
      expect(guardado?.total).toBe(3);
      expect(guardado?.usuario).toEqual({ _id: IDS.estudiante, nombre: "Ana Torres" });
    });

    it("rechaza un producto no disponible con su nombre y no inserta nada", async () => {
      const respuesta = await crear({
        items: [
          { productoId: IDS.bolon.toHexString(), cantidad: 1 },
          { productoId: IDS.tigrillo.toHexString(), cantidad: 1 }
        ],
        horaRecogida: HORA_VALIDA
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body).toEqual({ error: "El producto «Tigrillo» no está disponible" });
      expect(await pedidos().countDocuments()).toBe(1);
    });

    it("rechaza un producto inexistente", async () => {
      const respuesta = await crear({
        items: [{ productoId: new ObjectId().toHexString(), cantidad: 1 }],
        horaRecogida: HORA_VALIDA
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe("Uno de los productos del pedido no existe");
    });

    it.each([
      [[], "El pedido debe tener al menos un producto"],
      [[{ cantidad: 0 }], "La cantidad de cada producto debe ser un entero entre 1 y 20"],
      [[{ cantidad: 21 }], "La cantidad de cada producto debe ser un entero entre 1 y 20"],
      [[{ cantidad: 1.5 }], "La cantidad de cada producto debe ser un entero entre 1 y 20"]
    ])("valida las cantidades %j", async (lineas, mensaje) => {
      const items = lineas.map((linea) => ({ productoId: IDS.bolon.toHexString(), ...linea }));

      const respuesta = await crear({ items, horaRecogida: HORA_VALIDA });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe(mensaje);
    });

    it.each([
      ["2026-10-29T08:00:00-05:00", "La hora de recogida debe ser posterior a la hora actual"],
      ["2026-10-29T16:30:00-05:00", "La hora de recogida debe estar entre las 07:00 y las 16:00"]
    ])("valida la hora de recogida %s", async (horaRecogida, mensaje) => {
      const respuesta = await crear({ ...cuerpoValido(), horaRecogida });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe(mensaje);
    });

    it("rechaza productos repetidos, ids inválidos y horas que no son ISO", async () => {
      const repetido = await crear({
        items: [
          { productoId: IDS.bolon.toHexString(), cantidad: 1 },
          { productoId: IDS.bolon.toHexString(), cantidad: 2 }
        ],
        horaRecogida: HORA_VALIDA
      });
      const idInvalido = await crear({
        items: [{ productoId: "123", cantidad: 1 }],
        horaRecogida: HORA_VALIDA
      });
      const horaInvalida = await crear({ ...cuerpoValido(), horaRecogida: "mañana" });

      for (const respuesta of [repetido, idInvalido, horaInvalida]) {
        expect(respuesta.status).toBe(400);
        expect(respuesta.body.error).toBe("Datos inválidos");
      }
      expect(repetido.body.detalles[0].mensaje).toBe("No repitas un producto en el pedido");
    });

    it("responde 403 a un administrador", async () => {
      const respuesta = await crear(cuerpoValido(), TOKENS.admin);

      expect(respuesta.status).toBe(403);
      expect(await pedidos().countDocuments()).toBe(1);
    });

    it("responde 401 sin token", async () => {
      const respuesta = await request(app).post("/api/pedidos").send(cuerpoValido());

      expect(respuesta.status).toBe(401);
    });
  });
});
