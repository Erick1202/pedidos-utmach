import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { manejadorErrores } from "../src/middleware/errores.js";
import { noEncontrado } from "../src/middleware/no-encontrado.js";
import { ErrorAplicacion } from "../src/utils/ErrorAplicacion.js";
import {
  crearEntornoPruebas,
  IDS,
  type EntornoPruebas
} from "./helpers/base.js";

describe("manejo centralizado de errores", () => {
  let entorno: EntornoPruebas;
  let app: express.Express;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();

    app = express();
    app.use(express.json());

    app.get("/error-controlado", () => {
      throw new ErrorAplicacion(409, "El pedido ya cambió de estado");
    });

    app.get("/error-zod", () => {
      z.object({
        nombre: z.string().min(5, "El nombre debe tener al menos 5 caracteres")
      }).parse({ nombre: "Ana" });
    });

    app.get("/error-121", async () => {
      await entorno.db.collection("pedidos").insertOne({
        usuario: { _id: IDS.estudiante, nombre: "Ana Torres" },
        items: [],
        total: 0,
        horaRecogida: new Date(),
        estado: "inventado",
        historialEstados: [],
        creadoEn: new Date()
      });
    });

    app.get("/error-11000", async () => {
      await entorno.db.collection("usuarios").insertOne({
        nombre: "Otra Ana",
        email: "ana.torres@utmachala.edu.ec",
        passwordHash: "hash-de-prueba",
        rol: "estudiante",
        creadoEn: new Date()
      });
    });

    app.post("/json", (_req, res) => {
      res.json({ ok: true });
    });

    app.use(noEncontrado);
    app.use(manejadorErrores);
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  it("respeta el código y el mensaje de ErrorAplicacion", async () => {
    const respuesta = await request(app).get("/error-controlado");

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toEqual({ error: "El pedido ya cambió de estado" });
  });

  it("traduce ZodError a 400 con el campo y el mensaje", async () => {
    const respuesta = await request(app).get("/error-zod");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe("Datos inválidos");
    expect(respuesta.body.detalles).toEqual([
      {
        campo: "nombre",
        mensaje: "El nombre debe tener al menos 5 caracteres"
      }
    ]);
  });

  it("traduce el error 121 de MongoDB a 400", async () => {
    const respuesta = await request(app).get("/error-121");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      error: "Los datos no cumplen el esquema de la base de datos"
    });
  });

  it("traduce el duplicado de correo a 409", async () => {
    const respuesta = await request(app).get("/error-11000");

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toEqual({ error: "El correo ya está registrado" });
  });

  it("responde 400 cuando el cuerpo no es JSON válido", async () => {
    const respuesta = await request(app)
      .post("/json")
      .set("Content-Type", "application/json")
      .send("{esto no es json");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      error: "El cuerpo de la solicitud no es un JSON válido"
    });
  });

  it("responde 404 en JSON para una ruta inexistente", async () => {
    const respuesta = await request(app).get("/ruta-inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ error: "Ruta no encontrada" });
  });
});
