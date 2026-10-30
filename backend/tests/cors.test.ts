import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import { esquemaOrigenesCors, ORIGENES_CORS_POR_DEFECTO } from "../src/config/cors.js";
import {
  crearEntornoPruebas,
  SECRETO_PRUEBAS,
  type EntornoPruebas
} from "./helpers/base.js";

describe("CORS", () => {
  let entorno: EntornoPruebas;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  describe("esquemaOrigenesCors", () => {
    it("usa el frontend local y GitHub Pages si la variable falta o está vacía", () => {
      const esperado = ["http://localhost:4200", "https://erick1202.github.io"];

      expect(esquemaOrigenesCors.parse(undefined)).toEqual(esperado);
      expect(esquemaOrigenesCors.parse("  ,  ")).toEqual(esperado);
      expect(ORIGENES_CORS_POR_DEFECTO).toEqual(esperado);
    });

    it("separa por comas y recorta espacios", () => {
      expect(
        esquemaOrigenesCors.parse(" http://localhost:4200 , https://demo.example:8443 ")
      ).toEqual(["http://localhost:4200", "https://demo.example:8443"]);
    });

    it("rechaza valores que no son orígenes http(s) sin ruta", () => {
      for (const invalido of [
        "localhost:4200",
        "ftp://servidor.example",
        "https://erick1202.github.io/pedidos-utmach",
        "https://erick1202.github.io/",
        "*"
      ]) {
        const resultado = esquemaOrigenesCors.safeParse(invalido);
        expect(resultado.success, invalido).toBe(false);
      }
    });
  });

  describe("crearApp", () => {
    it("por defecto permite localhost:4200 y GitHub Pages, y no otros orígenes", async () => {
      const app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS });

      for (const origen of ["http://localhost:4200", "https://erick1202.github.io"]) {
        const respuesta = await request(app).get("/api/salud").set("Origin", origen);
        expect(respuesta.headers["access-control-allow-origin"]).toBe(origen);
      }

      const ajena = await request(app)
        .get("/api/salud")
        .set("Origin", "http://sitio-no-permitido.example");
      expect(ajena.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("responde la petición previa (preflight) con Authorization permitido", async () => {
      const app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS });

      const respuesta = await request(app)
        .options("/api/pedidos")
        .set("Origin", "https://erick1202.github.io")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "authorization,content-type");

      expect(respuesta.status).toBe(204);
      expect(respuesta.headers["access-control-allow-origin"]).toBe(
        "https://erick1202.github.io"
      );
      expect(respuesta.headers["access-control-allow-headers"]).toContain("Authorization");
    });

    it("respeta una lista personalizada de orígenes", async () => {
      const app = crearApp(entorno.db, {
        jwtSecret: SECRETO_PRUEBAS,
        origenesCors: ["https://demo.example"]
      });

      const permitida = await request(app)
        .get("/api/salud")
        .set("Origin", "https://demo.example");
      expect(permitida.headers["access-control-allow-origin"]).toBe("https://demo.example");

      const local = await request(app)
        .get("/api/salud")
        .set("Origin", "http://localhost:4200");
      expect(local.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });
});
