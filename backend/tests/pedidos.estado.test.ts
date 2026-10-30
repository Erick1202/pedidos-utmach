import jwt from "jsonwebtoken";
import { Collection, ObjectId, type Document } from "mongodb";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

const OTRO_ESTUDIANTE = new ObjectId("64a100000000000000000002");
const TOKEN_OTRO_ESTUDIANTE = jwt.sign(
  { _id: OTRO_ESTUDIANTE.toHexString(), nombre: "Luis Ramírez", rol: "estudiante" },
  SECRETO_PRUEBAS,
  { algorithm: "HS256", expiresIn: "1h" }
);

const PEDIDOS = {
  anaAntiguo: new ObjectId("64e000000000000000000010"),
  anaReciente: new ObjectId("64e000000000000000000011"),
  luisPreparando: new ObjectId("64e000000000000000000012"),
  luisListoManana: new ObjectId("64e000000000000000000013"),
  anaEntregado: new ObjectId("64e000000000000000000014")
} as const;

/** Pedido válido para el validador real con los campos indicados. */
function pedido(
  _id: ObjectId,
  usuario: { _id: ObjectId; nombre: string },
  estado: string,
  horaRecogida: string,
  creadoEn: string
): Document {
  const orden = ["recibido", "preparando", "listo", "entregado"];
  const historialEstados = orden
    .slice(0, orden.indexOf(estado) + 1)
    .map((paso) => ({ estado: paso, fecha: new Date(creadoEn) }));

  return {
    _id,
    usuario,
    items: [
      {
        productoId: IDS.bolon,
        nombre: "Bolón de verde",
        precioUnitario: 1.5,
        cantidad: 1,
        subtotal: 1.5
      }
    ],
    total: 1.5,
    horaRecogida: new Date(horaRecogida),
    estado,
    historialEstados,
    creadoEn: new Date(creadoEn)
  };
}

const ANA = { _id: IDS.estudiante, nombre: "Ana Torres" };
const LUIS = { _id: OTRO_ESTUDIANTE, nombre: "Luis Ramírez" };

describe("estado de los pedidos", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  const pedidos = () => entorno.db.collection("pedidos");
  const get = (ruta: string, token: string) =>
    request(app).get(ruta).set("Authorization", bearer(token));
  const avanzar = (id: string, token: string = TOKENS.admin) =>
    request(app).patch(`/api/pedidos/${id}/estado`).set("Authorization", bearer(token));

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS, ahora: () => AHORA });
  });

  beforeEach(async () => {
    await reiniciarDatos(entorno.db);
    // El helper ya inserta IDS.pedido: Ana, recibido, recoge 2026-10-28 10:00 en Ecuador.
    await pedidos().insertMany([
      pedido(PEDIDOS.anaAntiguo, ANA, "recibido", "2026-10-29T19:00:00Z", "2026-10-20T13:00:00Z"),
      pedido(PEDIDOS.anaReciente, ANA, "listo", "2026-10-29T16:00:00Z", "2026-10-29T13:30:00Z"),
      pedido(PEDIDOS.luisPreparando, LUIS, "preparando", "2026-10-29T13:00:00Z", "2026-10-29T12:00:00Z"),
      pedido(PEDIDOS.luisListoManana, LUIS, "listo", "2026-10-30T14:00:00Z", "2026-10-29T12:30:00Z"),
      pedido(PEDIDOS.anaEntregado, ANA, "entregado", "2026-10-27T15:00:00Z", "2026-10-27T13:00:00Z")
    ]);
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  describe("GET /api/pedidos/mios", () => {
    it("devuelve solo los pedidos del estudiante, del más reciente al más antiguo", async () => {
      const respuesta = await get("/api/pedidos/mios", TOKENS.estudiante);

      expect(respuesta.status).toBe(200);
      const ids = (respuesta.body.pedidos as Array<{ _id: string }>).map((p) => p._id);
      expect(ids).toEqual([
        PEDIDOS.anaReciente.toHexString(),
        IDS.pedido.toHexString(),
        PEDIDOS.anaEntregado.toHexString(),
        PEDIDOS.anaAntiguo.toHexString()
      ]);
      expect(
        (respuesta.body.pedidos as Array<{ usuario: { _id: string } }>).every(
          (p) => p.usuario._id === IDS.estudiante.toHexString()
        )
      ).toBe(true);
    });

    it("otro estudiante no ve los pedidos de Ana", async () => {
      const respuesta = await get("/api/pedidos/mios", TOKEN_OTRO_ESTUDIANTE);

      expect(respuesta.status).toBe(200);
      expect(
        (respuesta.body.pedidos as Array<{ _id: string }>).map((p) => p._id).sort()
      ).toEqual([PEDIDOS.luisPreparando.toHexString(), PEDIDOS.luisListoManana.toHexString()].sort());
    });

    it("respeta ?limite", async () => {
      const respuesta = await get("/api/pedidos/mios?limite=2", TOKENS.estudiante);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.pedidos).toHaveLength(2);
      expect(respuesta.body.pedidos[0]._id).toBe(PEDIDOS.anaReciente.toHexString());
    });

    it.each(["0", "51", "abc", "1.5"])("rechaza ?limite=%s con 400", async (limite) => {
      const respuesta = await get(`/api/pedidos/mios?limite=${limite}`, TOKENS.estudiante);
      expect(respuesta.status).toBe(400);
    });

    it("la consulta usa el índice ix_usuario_fecha", async () => {
      const plan = await pedidos()
        .find({ "usuario._id": IDS.estudiante })
        .sort({ creadoEn: -1 })
        .limit(20)
        .explain("queryPlanner");

      expect(JSON.stringify(plan.queryPlanner.winningPlan)).toContain("ix_usuario_fecha");
    });

    it("un administrador recibe 403 y sin token 401", async () => {
      expect((await get("/api/pedidos/mios", TOKENS.admin)).status).toBe(403);
      expect((await request(app).get("/api/pedidos/mios")).status).toBe(401);
    });
  });

  describe("GET /api/pedidos/activos", () => {
    it("devuelve recibido, preparando y listo ordenados por hora de recogida", async () => {
      const respuesta = await get("/api/pedidos/activos", TOKENS.admin);

      expect(respuesta.status).toBe(200);
      const lista = respuesta.body.pedidos as Array<{ _id: string; estado: string }>;
      expect(lista.map((p) => p._id)).toEqual([
        IDS.pedido.toHexString(),
        PEDIDOS.luisPreparando.toHexString(),
        PEDIDOS.anaReciente.toHexString(),
        PEDIDOS.anaAntiguo.toHexString(),
        PEDIDOS.luisListoManana.toHexString()
      ]);
      expect(lista.some((p) => p.estado === "entregado")).toBe(false);
    });

    it("filtra por el día de recogida en Ecuador", async () => {
      const respuesta = await get("/api/pedidos/activos?fecha=2026-10-29", TOKENS.admin);

      expect(respuesta.status).toBe(200);
      expect((respuesta.body.pedidos as Array<{ _id: string }>).map((p) => p._id)).toEqual([
        PEDIDOS.luisPreparando.toHexString(),
        PEDIDOS.anaReciente.toHexString(),
        PEDIDOS.anaAntiguo.toHexString()
      ]);
    });

    it("incluye las 23:59 de Ecuador (04:59Z del día siguiente) en el mismo día", async () => {
      await pedidos().insertOne(
        pedido(new ObjectId(), LUIS, "recibido", "2026-10-30T04:59:00Z", "2026-10-29T12:00:00Z")
      );
      const respuesta = await get("/api/pedidos/activos?fecha=2026-10-29", TOKENS.admin);
      expect(respuesta.body.pedidos).toHaveLength(4);
    });

    it.each(["29-10-2026", "2026-02-30", "hoy"])("rechaza ?fecha=%s con 400", async (fecha) => {
      const respuesta = await get(`/api/pedidos/activos?fecha=${fecha}`, TOKENS.admin);
      expect(respuesta.status).toBe(400);
    });

    it("la consulta usa el índice ix_estado_hora", async () => {
      const plan = await pedidos()
        .find({ estado: { $in: ["recibido", "preparando", "listo"] } })
        .sort({ horaRecogida: 1 })
        .explain("queryPlanner");

      expect(JSON.stringify(plan.queryPlanner.winningPlan)).toContain("ix_estado_hora");
    });

    it("un estudiante recibe 403", async () => {
      expect((await get("/api/pedidos/activos", TOKENS.estudiante)).status).toBe(403);
    });
  });

  describe("PATCH /api/pedidos/:id/estado", () => {
    it("recorre la secuencia completa hasta entregado y cumple el validador", async () => {
      const id = IDS.pedido.toHexString();

      for (const esperado of ["preparando", "listo", "entregado"]) {
        const respuesta = await avanzar(id);
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.pedido.estado).toBe(esperado);

        const cumpleEsquema = await pedidos().countDocuments({
          $and: [{ _id: IDS.pedido }, VALIDADORES.pedidos as object]
        });
        expect(cumpleEsquema).toBe(1);
      }

      const documento = await pedidos().findOne({ _id: IDS.pedido });
      expect(documento?.historialEstados).toEqual([
        { estado: "recibido", fecha: new Date("2026-10-28T13:00:00Z") },
        { estado: "preparando", fecha: AHORA },
        { estado: "listo", fecha: AHORA },
        { estado: "entregado", fecha: AHORA }
      ]);
      expect(documento?.historialEstados).toHaveLength(4);
    });

    it("no avanza un pedido entregado (409) ni modifica el documento", async () => {
      const antes = await pedidos().findOne({ _id: PEDIDOS.anaEntregado });
      const respuesta = await avanzar(PEDIDOS.anaEntregado.toHexString());

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.error).toBe("El pedido ya fue entregado y no puede avanzar");
      expect(await pedidos().findOne({ _id: PEDIDOS.anaEntregado })).toEqual(antes);
    });

    it("responde 409 al segundo de dos PATCH concurrentes sobre el mismo estado", async () => {
      // Barrera: ninguna petición pasa de su lectura hasta que ambas leyeron
      // `recibido`; así los dos updateOne compiten siempre por el mismo estado.
      const findOneOriginal = Collection.prototype.findOne;
      let lecturas = 0;
      let liberar: () => void = () => undefined;
      const barrera = new Promise<void>((resolver) => (liberar = resolver));

      const espia = vi
        .spyOn(Collection.prototype, "findOne")
        .mockImplementation(async function (this: Collection, ...argumentos: unknown[]) {
          const resultado: unknown = await (
            findOneOriginal as (...args: unknown[]) => Promise<unknown>
          ).apply(this, argumentos);
          lecturas += 1;
          if (lecturas === 2) liberar();
          await barrera;
          return resultado;
        } as typeof findOneOriginal);

      try {
        const id = IDS.pedido.toHexString();
        const respuestas = await Promise.all([avanzar(id), avanzar(id)]);
        const estados = respuestas.map((r) => r.status).sort();

        expect(estados).toEqual([200, 409]);
        const conflicto = respuestas.find((r) => r.status === 409);
        expect(conflicto?.body.error).toBe("El pedido ya cambió de estado");
      } finally {
        espia.mockRestore();
      }

      const documento = await pedidos().findOne({ _id: IDS.pedido });
      expect(documento?.estado).toBe("preparando");
      expect(documento?.historialEstados).toHaveLength(2);
    });

    it("responde 400 con un id inválido y 404 si el pedido no existe", async () => {
      expect((await avanzar("no-es-un-id")).status).toBe(400);

      const inexistente = await avanzar(new ObjectId().toHexString());
      expect(inexistente.status).toBe(404);
      expect(inexistente.body.error).toBe("Pedido no encontrado");
    });

    it("un estudiante recibe 403 y el pedido no cambia", async () => {
      const respuesta = await avanzar(IDS.pedido.toHexString(), TOKENS.estudiante);

      expect(respuesta.status).toBe(403);
      expect((await pedidos().findOne({ _id: IDS.pedido }))?.estado).toBe("recibido");
    });
  });
});
