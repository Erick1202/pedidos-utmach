import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import { crearEntornoPruebas, type EntornoPruebas } from "./helpers/base.js";

describe("GET /api/salud", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db);
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  it("responde 200 con la base y los conteos reales", async () => {
    const respuesta = await request(app).get("/api/salud");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      estado: "ok",
      baseDatos: "pedidos_utmach",
      colecciones: {
        usuarios: 2,
        categorias: 2,
        productos: 3,
        pedidos: 1
      }
    });
  });

  it("responde 404 en JSON para una ruta inexistente", async () => {
    const respuesta = await request(app).get("/api/no-existe");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ error: "Ruta no encontrada" });
  });

  it("solo permite CORS desde http://localhost:4200", async () => {
    const permitida = await request(app)
      .get("/api/salud")
      .set("Origin", "http://localhost:4200");

    expect(permitida.headers["access-control-allow-origin"]).toBe(
      "http://localhost:4200"
    );

    const ajena = await request(app)
      .get("/api/salud")
      .set("Origin", "http://sitio-no-permitido.example");

    expect(ajena.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
