import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import { generarSlug } from "../src/modules/categorias/categorias.service.js";
import {
  crearEntornoPruebas,
  IDS,
  SECRETO_PRUEBAS,
  type EntornoPruebas
} from "./helpers/base.js";
import { bearer, reiniciarDatos, TOKENS } from "./helpers/tokens.js";

describe("categorías", () => {
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

  describe("generarSlug", () => {
    it("quita tildes, pasa a minúsculas y une con guiones", () => {
      expect(generarSlug("Bebidas Frías")).toBe("bebidas-frias");
      expect(generarSlug("  Platos   del día!! ")).toBe("platos-del-dia");
      expect(generarSlug("Ñoquis & Más")).toBe("noquis-mas");
    });
  });

  describe("GET /api/categorias", () => {
    it("es público y ordena por nombre", async () => {
      const respuesta = await request(app).get("/api/categorias");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.categorias.map((c: { nombre: string }) => c.nombre)).toEqual([
        "Almuerzos",
        "Bebidas",
        "Desayunos"
      ]);
      expect(respuesta.body.categorias[0]).toEqual({
        _id: IDS.categoriaAlmuerzos.toHexString(),
        nombre: "Almuerzos",
        slug: "almuerzos"
      });
    });
  });

  describe("POST /api/categorias", () => {
    it("crea la categoría con slug generado y _id ObjectId", async () => {
      const respuesta = await request(app)
        .post("/api/categorias")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "  Postres Típicos " });

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.categoria).toMatchObject({
        nombre: "Postres Típicos",
        slug: "postres-tipicos"
      });

      const guardada = await entorno.db
        .collection("categorias")
        .findOne({ slug: "postres-tipicos" });
      expect(guardada?._id.constructor.name).toBe("ObjectId");
    });

    it("responde 409 si el slug ya existe, aunque cambien tildes o mayúsculas", async () => {
      for (const nombre of ["Bebidas", "BÉBIDAS"]) {
        const respuesta = await request(app)
          .post("/api/categorias")
          .set("Authorization", bearer(TOKENS.admin))
          .send({ nombre });

        expect(respuesta.status).toBe(409);
        expect(respuesta.body).toEqual({ error: "Ya existe una categoría con ese nombre" });
      }

      expect(await entorno.db.collection("categorias").countDocuments()).toBe(3);
    });

    it("valida el nombre y rechaza campos desconocidos", async () => {
      for (const cuerpo of [{ nombre: "ab" }, { nombre: "Snacks", slug: "x" }, { nombre: "---" }]) {
        const respuesta = await request(app)
          .post("/api/categorias")
          .set("Authorization", bearer(TOKENS.admin))
          .send(cuerpo);

        expect(respuesta.status).toBe(400);
      }
    });
  });

  describe("PUT /api/categorias/:id", () => {
    it("renombra y actualiza la copia embebida en todos sus productos", async () => {
      const respuesta = await request(app)
        .put(`/api/categorias/${IDS.categoriaDesayunos.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "Desayunos Criollos" });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.categoria).toEqual({
        _id: IDS.categoriaDesayunos.toHexString(),
        nombre: "Desayunos Criollos",
        slug: "desayunos-criollos"
      });

      const productos = await entorno.db
        .collection("productos")
        .find({ "categoria._id": IDS.categoriaDesayunos })
        .toArray();
      expect(productos).toHaveLength(2);
      for (const producto of productos) {
        expect(producto.categoria.nombre).toBe("Desayunos Criollos");
      }

      const almuerzo = await entorno.db.collection("productos").findOne({ _id: IDS.almuerzo });
      expect(almuerzo?.categoria.nombre).toBe("Almuerzos");
    });

    it("permite conservar su propio slug y responde 409 si choca con otra", async () => {
      const mismo = await request(app)
        .put(`/api/categorias/${IDS.categoriaBebidas.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "bebidas" });
      expect(mismo.status).toBe(200);

      const choque = await request(app)
        .put(`/api/categorias/${IDS.categoriaBebidas.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "Almuerzos" });
      expect(choque.status).toBe(409);
    });

    it("responde 404 si no existe y 400 si el id es inválido", async () => {
      const inexistente = await request(app)
        .put("/api/categorias/64c0000000000000000000ff")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "Otra" });
      expect(inexistente.status).toBe(404);

      const invalido = await request(app)
        .put("/api/categorias/abc")
        .set("Authorization", bearer(TOKENS.admin))
        .send({ nombre: "Otra" });
      expect(invalido.status).toBe(400);
    });
  });

  describe("DELETE /api/categorias/:id", () => {
    it("responde 409 si la categoría tiene productos", async () => {
      const respuesta = await request(app)
        .delete(`/api/categorias/${IDS.categoriaDesayunos.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin));

      expect(respuesta.status).toBe(409);
      expect(respuesta.body).toEqual({
        error: "No se puede eliminar una categoría con productos"
      });
      expect(await entorno.db.collection("categorias").countDocuments()).toBe(3);
    });

    it("elimina una categoría sin productos", async () => {
      const respuesta = await request(app)
        .delete(`/api/categorias/${IDS.categoriaBebidas.toHexString()}`)
        .set("Authorization", bearer(TOKENS.admin));

      expect(respuesta.status).toBe(204);
      expect(
        await entorno.db.collection("categorias").findOne({ _id: IDS.categoriaBebidas })
      ).toBeNull();
    });

    it("responde 404 si no existe", async () => {
      const respuesta = await request(app)
        .delete("/api/categorias/64c0000000000000000000ff")
        .set("Authorization", bearer(TOKENS.admin));
      expect(respuesta.status).toBe(404);
    });
  });

  describe("permisos", () => {
    const escrituras = [
      { metodo: "post", ruta: "/api/categorias" },
      { metodo: "put", ruta: `/api/categorias/${IDS.categoriaBebidas.toHexString()}` },
      { metodo: "delete", ruta: `/api/categorias/${IDS.categoriaBebidas.toHexString()}` }
    ] as const;

    it.each(escrituras)("$metodo $ruta: estudiante recibe 403", async ({ metodo, ruta }) => {
      const respuesta = await request(app)[metodo](ruta)
        .set("Authorization", bearer(TOKENS.estudiante))
        .send({ nombre: "Prohibida" });

      expect(respuesta.status).toBe(403);
    });

    it.each(escrituras)("$metodo $ruta: sin token recibe 401", async ({ metodo, ruta }) => {
      const respuesta = await request(app)[metodo](ruta).send({ nombre: "Prohibida" });
      expect(respuesta.status).toBe(401);
    });

    it("no modifica nada cuando se rechaza", async () => {
      await request(app)
        .delete(`/api/categorias/${IDS.categoriaBebidas.toHexString()}`)
        .set("Authorization", bearer(TOKENS.estudiante));
      expect(await entorno.db.collection("categorias").countDocuments()).toBe(3);
    });
  });
});
