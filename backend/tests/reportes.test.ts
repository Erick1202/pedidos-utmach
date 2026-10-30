import { ObjectId, type Document } from "mongodb";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import {
  crearEntornoPruebas,
  IDS,
  SECRETO_PRUEBAS,
  type EntornoPruebas
} from "./helpers/base.js";
import { bearer, reiniciarDatos, TOKENS } from "./helpers/tokens.js";

/** Reloj fijo: 29 de octubre de 2026 a las 09:00 en Ecuador. */
const AHORA = new Date("2026-10-29T14:00:00Z");

const JUGO = new ObjectId("64d000000000000000000007");
const ANA = { _id: IDS.estudiante, nombre: "Ana Torres" };
const LUIS = { _id: new ObjectId("64a100000000000000000002"), nombre: "Luis Ramírez" };

const PRODUCTOS = {
  almuerzo: { productoId: IDS.almuerzo, nombre: "Almuerzo del día", precioUnitario: 2.75 },
  bolon: { productoId: IDS.bolon, nombre: "Bolón de verde", precioUnitario: 1.5 },
  tigrillo: { productoId: IDS.tigrillo, nombre: "Tigrillo", precioUnitario: 2 },
  jugo: { productoId: JUGO, nombre: "Jugo natural", precioUnitario: 0.75 }
} as const;

type Linea = [keyof typeof PRODUCTOS, number];

/** Pedido válido para el validador real; subtotales y total con montos exactos. */
function pedido(
  usuario: { _id: ObjectId; nombre: string },
  lineas: Linea[],
  horaRecogida: string,
  estado: string
): Document {
  const orden = ["recibido", "preparando", "listo", "entregado"];
  const items = lineas.map(([clave, cantidad]) => ({
    ...PRODUCTOS[clave],
    cantidad,
    subtotal: Math.round(PRODUCTOS[clave].precioUnitario * cantidad * 100) / 100
  }));
  const creadoEn = new Date(new Date(horaRecogida).getTime() - 3600 * 1000);

  return {
    usuario,
    items,
    total: Math.round(items.reduce((suma, item) => suma + item.subtotal, 0) * 100) / 100,
    horaRecogida: new Date(horaRecogida),
    estado,
    historialEstados: orden
      .slice(0, orden.indexOf(estado) + 1)
      .map((paso) => ({ estado: paso, fecha: creadoEn })),
    creadoEn
  };
}

/**
 * Cinco pedidos (horas de Ecuador entre paréntesis):
 * - P1 Ana   20/10 (12:30): 2 almuerzos + 1 jugo = 6.25, entregado.
 * - P2 Luis  20/10 (08:00): 3 bolones = 4.50, entregado.
 * - P3 Ana   21/10 (12:00): 1 almuerzo = 2.75, listo.
 * - P4 Luis  21/10 (23:30, 04:30Z del 22): 1 tigrillo + 2 jugos = 3.50, recibido.
 * - P5 Luis  29/10 (12:00, hoy): 3 almuerzos = 8.25, preparando.
 */
const PEDIDOS: Document[] = [
  pedido(ANA, [["almuerzo", 2], ["jugo", 1]], "2026-10-20T17:30:00Z", "entregado"),
  pedido(LUIS, [["bolon", 3]], "2026-10-20T13:00:00Z", "entregado"),
  pedido(ANA, [["almuerzo", 1]], "2026-10-21T17:00:00Z", "listo"),
  pedido(LUIS, [["tigrillo", 1], ["jugo", 2]], "2026-10-22T04:30:00Z", "recibido"),
  pedido(LUIS, [["almuerzo", 3]], "2026-10-29T17:00:00Z", "preparando")
];

const RUTAS = [
  "/api/reportes/mas-vendidos",
  "/api/reportes/ventas-por-dia",
  "/api/reportes/hora-pico",
  "/api/reportes/ventas-por-categoria",
  "/api/reportes/por-estudiante",
  "/api/reportes/resumen"
];

describe("reportes del administrador", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  const get = (ruta: string, token: string = TOKENS.admin) =>
    request(app).get(ruta).set("Authorization", bearer(token));

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS, ahora: () => AHORA });
  });

  beforeEach(async () => {
    await reiniciarDatos(entorno.db);
    await entorno.db.collection("pedidos").deleteMany({});
    await entorno.db.collection("productos").insertOne({
      _id: JUGO,
      nombre: "Jugo natural",
      descripcion: "Jugo de fruta de temporada",
      precio: 0.75,
      disponible: true,
      categoria: { _id: IDS.categoriaBebidas, nombre: "Bebidas" },
      creadoEn: new Date("2026-10-01T13:00:00Z")
    });
    await entorno.db.collection("pedidos").insertMany(PEDIDOS.map((p) => ({ ...p })));
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  describe("GET /mas-vendidos", () => {
    it("ordena por unidades y desempata por nombre, con ingresos redondeados", async () => {
      const respuesta = await get("/api/reportes/mas-vendidos");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.productos).toEqual([
        { producto: "Almuerzo del día", unidades: 6, ingresos: 16.5 },
        { producto: "Bolón de verde", unidades: 3, ingresos: 4.5 },
        { producto: "Jugo natural", unidades: 3, ingresos: 2.25 },
        { producto: "Tigrillo", unidades: 1, ingresos: 2 }
      ]);
    });

    it("respeta ?limite", async () => {
      const respuesta = await get("/api/reportes/mas-vendidos?limite=2");

      expect(respuesta.status).toBe(200);
      expect(
        (respuesta.body.productos as Array<{ producto: string }>).map((p) => p.producto)
      ).toEqual(["Almuerzo del día", "Bolón de verde"]);
    });

    it.each(["0", "21", "abc", "1.5"])("rechaza ?limite=%s con 400", async (limite) => {
      const respuesta = await get(`/api/reportes/mas-vendidos?limite=${limite}`);
      expect(respuesta.status).toBe(400);
    });
  });

  describe("GET /ventas-por-dia", () => {
    it("agrupa por día de Ecuador y ordena por fecha", async () => {
      const respuesta = await get("/api/reportes/ventas-por-dia");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.dias).toEqual([
        { dia: "2026-10-20", pedidos: 2, total: 10.75 },
        { dia: "2026-10-21", pedidos: 2, total: 6.25 },
        { dia: "2026-10-29", pedidos: 1, total: 8.25 }
      ]);
    });
  });

  describe("GET /hora-pico", () => {
    it("agrupa por hora de Ecuador, de la más concurrida a la menos", async () => {
      const respuesta = await get("/api/reportes/hora-pico");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.horas).toEqual([
        { hora: 12, pedidos: 3 },
        { hora: 8, pedidos: 1 },
        { hora: 23, pedidos: 1 }
      ]);
    });
  });

  describe("GET /ventas-por-categoria", () => {
    it("usa la categoría del producto con $lookup y calcula el porcentaje de ingresos", async () => {
      const respuesta = await get("/api/reportes/ventas-por-categoria");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.categorias).toEqual([
        { categoria: "Almuerzos", unidades: 6, ingresos: 16.5, porcentaje: 65.35 },
        { categoria: "Desayunos", unidades: 4, ingresos: 6.5, porcentaje: 25.74 },
        { categoria: "Bebidas", unidades: 3, ingresos: 2.25, porcentaje: 8.91 }
      ]);
    });

    it("recalcula el porcentaje sobre el rango filtrado", async () => {
      const respuesta = await get("/api/reportes/ventas-por-categoria?desde=2026-10-29");

      expect(respuesta.body.categorias).toEqual([
        { categoria: "Almuerzos", unidades: 3, ingresos: 8.25, porcentaje: 100 }
      ]);
    });
  });

  describe("GET /por-estudiante", () => {
    it("calcula pedidos, gasto y ticket promedio, ordenado por gasto", async () => {
      const respuesta = await get("/api/reportes/por-estudiante");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.estudiantes).toEqual([
        { estudiante: "Luis Ramírez", pedidos: 3, gasto: 16.25, ticket: 5.42 },
        { estudiante: "Ana Torres", pedidos: 2, gasto: 9, ticket: 4.5 }
      ]);
    });
  });

  describe("GET /resumen", () => {
    it("devuelve estados, totales, pedidos de hoy y activos en una sola consulta", async () => {
      const respuesta = await get("/api/reportes/resumen");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resumen).toEqual({
        porEstado: [
          { estado: "entregado", pedidos: 2 },
          { estado: "listo", pedidos: 1 },
          { estado: "preparando", pedidos: 1 },
          { estado: "recibido", pedidos: 1 }
        ],
        totales: { pedidos: 5, ventas: 25.25, ticketPromedio: 5.05 },
        hoy: 1,
        activos: 3
      });
    });

    it("con un rango vacío devuelve ceros", async () => {
      const respuesta = await get("/api/reportes/resumen?desde=2026-11-01&hasta=2026-11-30");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resumen).toEqual({
        porEstado: [],
        totales: { pedidos: 0, ventas: 0, ticketPromedio: 0 },
        hoy: 0,
        activos: 0
      });
    });
  });

  describe("filtro de fechas", () => {
    it("desde y hasta incluyen ambos días completos de Ecuador", async () => {
      const respuesta = await get("/api/reportes/ventas-por-dia?desde=2026-10-20&hasta=2026-10-21");

      expect(respuesta.body.dias).toEqual([
        { dia: "2026-10-20", pedidos: 2, total: 10.75 },
        { dia: "2026-10-21", pedidos: 2, total: 6.25 }
      ]);
    });

    it("acepta solo desde o solo hasta", async () => {
      const desde = await get("/api/reportes/por-estudiante?desde=2026-10-29");
      const hasta = await get("/api/reportes/por-estudiante?hasta=2026-10-20");

      expect(desde.body.estudiantes).toEqual([
        { estudiante: "Luis Ramírez", pedidos: 1, gasto: 8.25, ticket: 8.25 }
      ]);
      expect(hasta.body.estudiantes).toEqual([
        { estudiante: "Ana Torres", pedidos: 1, gasto: 6.25, ticket: 6.25 },
        { estudiante: "Luis Ramírez", pedidos: 1, gasto: 4.5, ticket: 4.5 }
      ]);
    });

    it("un rango sin pedidos devuelve listas vacías", async () => {
      const respuesta = await get("/api/reportes/mas-vendidos?desde=2026-11-01&hasta=2026-11-30");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.productos).toEqual([]);
    });

    it.each([
      ["desde=2026-02-30", "no existe"],
      ["hasta=29-10-2026", "formato"],
      ["desde=2026-10-22&hasta=2026-10-21", "posterior"]
    ])("rechaza ?%s con 400", async (query, fragmento) => {
      const respuesta = await get(`/api/reportes/ventas-por-dia?${query}`);

      expect(respuesta.status).toBe(400);
      expect(JSON.stringify(respuesta.body)).toContain(fragmento);
    });
  });

  describe("zona horaria America/Guayaquil", () => {
    it("un pedido a las 23:30 en Ecuador cuenta en ese día y en la hora 23", async () => {
      const dia = await get("/api/reportes/ventas-por-dia?desde=2026-10-21&hasta=2026-10-21");
      const siguiente = await get("/api/reportes/ventas-por-dia?desde=2026-10-22&hasta=2026-10-22");
      const horas = await get("/api/reportes/hora-pico?desde=2026-10-21&hasta=2026-10-21");

      expect(dia.body.dias).toEqual([{ dia: "2026-10-21", pedidos: 2, total: 6.25 }]);
      expect(siguiente.body.dias).toEqual([]);
      expect(horas.body.horas).toEqual([
        { hora: 12, pedidos: 1 },
        { hora: 23, pedidos: 1 }
      ]);
    });
  });

  describe("permisos", () => {
    it.each(RUTAS)("%s responde 403 a un estudiante", async (ruta) => {
      const respuesta = await get(ruta, TOKENS.estudiante);
      expect(respuesta.status).toBe(403);
    });

    it.each(RUTAS)("%s responde 401 sin token", async (ruta) => {
      const respuesta = await request(app).get(ruta);
      expect(respuesta.status).toBe(401);
    });
  });
});
