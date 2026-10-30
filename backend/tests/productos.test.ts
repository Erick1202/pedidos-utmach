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
import { bearer, reiniciarDatos, TOKENS } from "./helpers/tokens.js";

interface ProductoRespuesta {
  _id: string;
  nombre: string;
  disponible: boolean;
  categoria: { _id: string; nombre: string };
}

const nombres = (productos: ProductoRespuesta[]) => productos.map((p) => p.nombre);

const NUEVO = {
  nombre: "Chifles",
  descripcion: "Funda de chifles de plátano verde",
  precio: 0.5,
  imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
  disponible: true,
  categoriaId: IDS.categoriaBebidas.toHexString()
};

describe("productos", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS });
  });

  beforeEach(async () => {
    await reiniciarDatos(entorno.db);
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  describe("GET /api/productos", () => {
    it("por defecto devuelve solo los disponibles", async () => {
      const respuesta = await request(app).get("/api/productos");

      expect(respuesta.status).toBe(200);
      expect(nombres(respuesta.body.productos)).toEqual(["Almuerzo del día", "Bolón de verde"]);
      expect(respuesta.body.productos[1]).toMatchObject({
        _id: IDS.bolon.toHexString(),
        precio: 1.5,
        disponible: true,
        categoria: { _id: IDS.categoriaDesayunos.toHexString(), nombre: "Desayunos" }
      });
    });

    it("filtra por categoría", async () => {
      const respuesta = await request(app)
        .get("/api/productos")
        .query({ categoria: IDS.categoriaAlmuerzos.toHexString() });

      expect(respuesta.status).toBe(200);
      expect(nombres(respuesta.body.productos)).toEqual(["Almuerzo del día"]);
    });

    it("responde 400 si la categoría del filtro no es un id válido", async () => {
      const respuesta = await request(app).get("/api/productos").query({ categoria: "bebidas" });
      expect(respuesta.status).toBe(400);
    });

    describe("búsqueda $text", () => {
      beforeEach(async () => {
        await entorno.db.collection("productos").insertOne({
          _id: new ObjectId(),
          nombre: "Chifles",
          descripcion: "Funda de chifles de plátano verde",
          precio: 0.5,
          disponible: true,
          categoria: { _id: IDS.categoriaBebidas, nombre: "Bebidas" },
          creadoEn: new Date("2026-10-01T13:00:00Z")
        });
      });

      it("usa el índice tx_busqueda, ordena por textScore y excluye no disponibles", async () => {
        const respuesta = await request(app).get("/api/productos").query({ q: "verde" });

        expect(respuesta.status).toBe(200);
        // Bolón tiene "verde" en el nombre (peso 3); Chifles solo en la descripción.
        // Tigrillo coincide, pero no está disponible.
        expect(nombres(respuesta.body.productos)).toEqual(["Bolón de verde", "Chifles"]);
        expect(respuesta.body.productos[0]).not.toHaveProperty("score");
      });

      it("aplica stemming en español", async () => {
        const respuesta = await request(app).get("/api/productos").query({ q: "Chifle" });
        expect(nombres(respuesta.body.productos)).toEqual(["Chifles"]);
      });

      it("combina búsqueda y categoría", async () => {
        const respuesta = await request(app)
          .get("/api/productos")
          .query({ q: "verde", categoria: IDS.categoriaBebidas.toHexString() });
        expect(nombres(respuesta.body.productos)).toEqual(["Chifles"]);
      });

      it("devuelve una lista vacía si nada coincide", async () => {
        const respuesta = await request(app).get("/api/productos").query({ q: "pizza" });
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.productos).toEqual([]);
      });

      it("rechaza una búsqueda vacía", async () => {
        const respuesta = await request(app).get("/api/productos").query({ q: "   " });
        expect(respuesta.status).toBe(400);
      });
    });

    describe("?todos=true", () => {
      it("incluye los no disponibles para el admin", async () => {
        const respuesta = await request(app)
          .get("/api/productos")
          .query({ todos: "true" })
          .set("Authorization", bearer(TOKENS.admin));

        expect(respuesta.status).toBe(200);
        expect(nombres(respuesta.body.productos)).toEqual([
          "Almuerzo del día",
          "Bolón de verde",
          "Tigrillo"
        ]);
      });

      it("responde 403 al estudiante y 401 sin token", async () => {
        const estudiante = await request(app)
          .get("/api/productos")
          .query({ todos: "true" })
          .set("Authorization", bearer(TOKENS.estudiante));
        expect(estudiante.status).toBe(403);

        const anonimo = await request(app).get("/api/productos").query({ todos: "true" });
        expect(anonimo.status).toBe(401);
      });
    });
  });

  describe("GET /api/productos/:id", () => {
    it("devuelve el producto", async () => {
      const respuesta = await request(app).get(`/api/productos/${IDS.bolon.toHexString()}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.producto.nombre).toBe("Bolón de verde");
    });

    it("responde 404 si no existe y 400 si el id es inválido", async () => {
      const inexistente = await request(app).get("/api/productos/64d0000000000000000000ff");
      expect(inexistente.status).toBe(404);
      expect(inexistente.body).toEqual({ error: "Producto no encontrado" });

      const invalido = await request(app).get("/api/productos/no-es-un-id");
      expect(invalido.status).toBe(400);
    });
  });

  describe("POST /api/productos", () => {
    it("toma la categoría de la base, redondea el precio y guarda ObjectId y Date", async () => {
      const respuesta = await request(app)
        .post("/api/productos")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ ...NUEVO, precio: 0.499 });

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.producto).toMatchObject({
        nombre: "Chifles",
        precio: 0.5,
        disponible: true,
        categoria: { _id: IDS.categoriaBebidas.toHexString(), nombre: "Bebidas" }
      });

      const guardado = await entorno.db
        .collection("productos")
        .findOne({ _id: new ObjectId(respuesta.body.producto._id as string) });
      expect(guardado?.categoria._id).toBeInstanceOf(ObjectId);
      expect(guardado?.categoria._id.equals(IDS.categoriaBebidas)).toBe(true);
      expect(guardado?.creadoEn).toBeInstanceOf(Date);
      expect(guardado?.precio).toBe(0.5);
      expect(guardado).not.toHaveProperty("categoriaId");
    });

    it("usa valores por defecto para descripción, imagen y disponibilidad", async () => {
      const respuesta = await request(app)
        .post("/api/productos")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "Agua", precio: 0.5, categoriaId: NUEVO.categoriaId });

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.producto).toMatchObject({ descripcion: "", disponible: true });
      expect(respuesta.body.producto).not.toHaveProperty("imagenUrl");
    });

    it("responde 400 si la categoría no existe", async () => {
      const respuesta = await request(app)
        .post("/api/productos")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ ...NUEVO, categoriaId: "64c0000000000000000000ff" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body).toEqual({ error: "La categoría indicada no existe" });
    });

    it.each([
      ["precio cero", { precio: 0 }],
      ["precio negativo", { precio: -1 }],
      ["precio que se redondea a cero", { precio: 0.001 }],
      ["precio como texto", { precio: "1.50" }],
      ["URL inválida", { imagenUrl: "no-es-url" }],
      ["URL no http", { imagenUrl: "javascript:alert(1)" }],
      ["nombre corto", { nombre: "Té" }],
      ["campo desconocido", { categoria: { nombre: "Falsa" } }]
    ])("responde 400 con %s", async (_caso, cambio) => {
      const respuesta = await request(app)
        .post("/api/productos")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ ...NUEVO, ...cambio });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe("Datos inválidos");
    });
  });

  describe("PUT /api/productos/:id", () => {
    it("reemplaza los campos, cambia la categoría y conserva creadoEn", async () => {
      const respuesta = await request(app)
        .put(`/api/productos/${IDS.bolon.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({
          nombre: "Bolón mixto",
          descripcion: "Con queso y chicharrón",
          precio: 1.755,
          imagenUrl: "",
          disponible: false,
          categoriaId: IDS.categoriaAlmuerzos.toHexString()
        });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.producto).toMatchObject({
        nombre: "Bolón mixto",
        precio: 1.76,
        disponible: false,
        categoria: { _id: IDS.categoriaAlmuerzos.toHexString(), nombre: "Almuerzos" },
        creadoEn: "2026-10-01T13:00:00.000Z"
      });

      const guardado = await entorno.db.collection("productos").findOne({ _id: IDS.bolon });
      expect(guardado).not.toHaveProperty("imagenUrl");
      expect(guardado?.categoria._id).toBeInstanceOf(ObjectId);
    });

    it("responde 404 si el producto no existe", async () => {
      const respuesta = await request(app)
        .put("/api/productos/64d0000000000000000000ff")
        .set("Authorization", bearer(TOKENS.admin))
        .send(NUEVO);
      expect(respuesta.status).toBe(404);
    });
  });

  describe("PATCH /api/productos/:id/disponible", () => {
    it("cambia la disponibilidad y el producto aparece en el menú", async () => {
      const respuesta = await request(app)
        .patch(`/api/productos/${IDS.tigrillo.toHexString()}/disponible`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({ disponible: true });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.producto.disponible).toBe(true);

      const menu = await request(app).get("/api/productos");
      expect(nombres(menu.body.productos)).toContain("Tigrillo");
    });

    it("exige un booleano", async () => {
      const respuesta = await request(app)
        .patch(`/api/productos/${IDS.tigrillo.toHexString()}/disponible`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({ disponible: "si" });
      expect(respuesta.status).toBe(400);
    });
  });

  describe("DELETE /api/productos/:id", () => {
    it("elimina el producto y luego responde 404", async () => {
      const ruta = `/api/productos/${IDS.almuerzo.toHexString()}`;

      const primera = await request(app).delete(ruta).set("Authorization", bearer(TOKENS.admin));
      expect(primera.status).toBe(204);

      const segunda = await request(app).delete(ruta).set("Authorization", bearer(TOKENS.admin));
      expect(segunda.status).toBe(404);
    });
  });

  describe("permisos del CRUD", () => {
    const id = IDS.bolon.toHexString();
    const escrituras = [
      { metodo: "post", ruta: "/api/productos", cuerpo: NUEVO },
      { metodo: "put", ruta: `/api/productos/${id}`, cuerpo: NUEVO },
      { metodo: "patch", ruta: `/api/productos/${id}/disponible`, cuerpo: { disponible: false } },
      { metodo: "delete", ruta: `/api/productos/${id}`, cuerpo: {} }
    ] as const;

    it.each(escrituras)("$metodo $ruta: estudiante recibe 403", async ({ metodo, ruta, cuerpo }) => {
      const respuesta = await request(app)[metodo](ruta)
        .set("Authorization", bearer(TOKENS.estudiante))
        .send(cuerpo);

      expect(respuesta.status).toBe(403);
      expect(respuesta.body).toEqual({ error: "No tienes permisos para realizar esta acción" });
    });

    it.each(escrituras)("$metodo $ruta: sin token recibe 401", async ({ metodo, ruta, cuerpo }) => {
      const respuesta = await request(app)[metodo](ruta).send(cuerpo);
      expect(respuesta.status).toBe(401);
    });

    it("el producto queda intacto tras los intentos rechazados", async () => {
      await request(app)
        .delete(`/api/productos/${id}`)
        .set("Authorization", bearer(TOKENS.estudiante));
      const producto = await entorno.db.collection("productos").findOne({ _id: IDS.bolon });
      expect(producto?.disponible).toBe(true);
    });
  });
});
