import bcrypt from "bcryptjs";
import express from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearApp } from "../src/app.js";
import {
  autorizarPorRol,
  crearAutenticacion
} from "../src/middleware/autenticacion.js";
import { manejadorErrores } from "../src/middleware/errores.js";
import {
  crearEntornoPruebas,
  IDS,
  SECRETO_PRUEBAS,
  type EntornoPruebas
} from "./helpers/base.js";

const ADMIN = {
  email: "admin@utmachala.edu.ec",
  password: "Admin123*"
} as const;

const ANA = {
  email: "ana.torres@utmachala.edu.ec",
  password: "Estudiante123*"
} as const;

describe("autenticación", () => {
  let entorno: EntornoPruebas;
  let app: ReturnType<typeof crearApp>;

  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    app = crearApp(entorno.db, { jwtSecret: SECRETO_PRUEBAS });
  });

  afterAll(async () => {
    await entorno.cerrar();
  });

  async function login(email: string, password: string) {
    return request(app).post("/api/auth/login").send({ email, password });
  }

  describe("POST /api/auth/registro", () => {
    it("crea un estudiante con correo normalizado y contraseña cifrada", async () => {
      const respuesta = await request(app).post("/api/auth/registro").send({
        nombre: "Nuevo Estudiante",
        email: "Nuevo.Estudiante@UTMACHALA.EDU.EC",
        password: "ClaveSegura123*"
      });

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.token).toEqual(expect.any(String));
      expect(respuesta.body.usuario).toMatchObject({
        nombre: "Nuevo Estudiante",
        email: "nuevo.estudiante@utmachala.edu.ec",
        rol: "estudiante"
      });
      expect(respuesta.body.usuario).not.toHaveProperty("passwordHash");

      const guardado = await entorno.db
        .collection("usuarios")
        .findOne({ email: "nuevo.estudiante@utmachala.edu.ec" });

      expect(guardado).not.toBeNull();
      expect(guardado?.rol).toBe("estudiante");
      expect(guardado?.creadoEn).toBeInstanceOf(Date);
      expect(guardado?.passwordHash).toMatch(/^\$2b\$10\$/);
      expect(guardado?.passwordHash).not.toBe("ClaveSegura123*");
      expect(
        await bcrypt.compare("ClaveSegura123*", guardado?.passwordHash ?? "")
      ).toBe(true);

      const payload = jwt.verify(
        respuesta.body.token,
        SECRETO_PRUEBAS
      ) as JwtPayload;
      expect(payload._id).toBe(respuesta.body.usuario._id);
      expect(payload.rol).toBe("estudiante");
    });

    it("responde 409 si el correo ya está registrado", async () => {
      const datos = {
        nombre: "Correo Duplicado",
        email: "duplicado@utmachala.edu.ec",
        password: "ClaveSegura123*"
      };

      await request(app).post("/api/auth/registro").send(datos).expect(201);

      const respuesta = await request(app)
        .post("/api/auth/registro")
        .send(datos);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body).toEqual({
        error: "El correo ya está registrado"
      });
    });

    it("rechaza una contraseña sin mayúscula, número o símbolo", async () => {
      const respuesta = await request(app).post("/api/auth/registro").send({
        nombre: "Clave Débil",
        email: "clave.debil@utmachala.edu.ec",
        password: "solominusculas"
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe("Datos inválidos");

      const detalles = respuesta.body.detalles as Array<{
        campo: string;
        mensaje: string;
      }>;
      expect(detalles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: "password",
            mensaje:
              "La contraseña debe incluir mayúscula, minúscula, número y símbolo"
          })
        ])
      );
    });

    it("rechaza datos inválidos y un rol enviado por el cliente", async () => {
      const respuesta = await request(app).post("/api/auth/registro").send({
        nombre: "Al",
        email: "correo-invalido",
        password: "corta",
        rol: "admin"
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe("Datos inválidos");
      expect(Array.isArray(respuesta.body.detalles)).toBe(true);

      const campos = (
        respuesta.body.detalles as Array<{ campo: string }>
      ).map((detalle) => detalle.campo);

      expect(campos).toEqual(
        expect.arrayContaining(["nombre", "email", "password", "cuerpo"])
      );

      const guardado = await entorno.db
        .collection("usuarios")
        .findOne({ email: "correo-invalido" });
      expect(guardado).toBeNull();
    });
  });

  describe("POST /api/auth/login", () => {
    it("inicia sesión con el administrador existente y firma un JWT de 8 horas", async () => {
      const respuesta = await login(ADMIN.email, ADMIN.password);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.usuario).toMatchObject({
        _id: IDS.admin.toHexString(),
        nombre: "Administrador Bar UTMACH",
        email: ADMIN.email,
        rol: "admin"
      });
      expect(respuesta.body.usuario).not.toHaveProperty("passwordHash");

      const payload = jwt.verify(
        respuesta.body.token,
        SECRETO_PRUEBAS
      ) as JwtPayload;

      expect(payload).toMatchObject({
        _id: IDS.admin.toHexString(),
        nombre: "Administrador Bar UTMACH",
        rol: "admin"
      });
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(8 * 60 * 60);
    });

    it("inicia sesión con la estudiante Ana Torres existente", async () => {
      const respuesta = await login(ANA.email, ANA.password);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.usuario).toMatchObject({
        _id: IDS.estudiante.toHexString(),
        nombre: "Ana Torres",
        email: ANA.email,
        rol: "estudiante"
      });
      expect(respuesta.body.usuario).not.toHaveProperty("passwordHash");
    });

    it("responde el mismo 401 para contraseña incorrecta y correo inexistente", async () => {
      const claveIncorrecta = await login(ANA.email, "Incorrecta123*");
      const correoInexistente = await login(
        "nadie@utmachala.edu.ec",
        ANA.password
      );

      expect(claveIncorrecta.status).toBe(401);
      expect(correoInexistente.status).toBe(401);
      expect(claveIncorrecta.body).toEqual({
        error: "Correo o contraseña incorrectos"
      });
      expect(correoInexistente.body).toEqual({
        error: "Correo o contraseña incorrectos"
      });
    });
  });

  describe("GET /api/auth/perfil", () => {
    it("devuelve el usuario del token sin el hash", async () => {
      const sesion = await login(ANA.email, ANA.password);

      const respuesta = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", `Bearer ${sesion.body.token}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.usuario).toMatchObject({
        _id: IDS.estudiante.toHexString(),
        nombre: "Ana Torres",
        email: ANA.email,
        rol: "estudiante"
      });
      expect(respuesta.body.usuario).not.toHaveProperty("passwordHash");
    });

    it("responde 401 sin token, con token inválido o con token expirado", async () => {
      const sinToken = await request(app).get("/api/auth/perfil");
      const invalido = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", "Bearer esto-no-es-un-jwt");

      const expirado = jwt.sign(
        {
          _id: IDS.estudiante.toHexString(),
          nombre: "Ana Torres",
          rol: "estudiante"
        },
        SECRETO_PRUEBAS,
        { expiresIn: -10 }
      );
      const conExpirado = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", `Bearer ${expirado}`);

      expect(sinToken.status).toBe(401);
      expect(sinToken.body).toEqual({
        error: "Token de autenticación requerido"
      });
      expect(invalido.status).toBe(401);
      expect(invalido.body).toEqual({ error: "Token inválido o expirado" });
      expect(conExpirado.status).toBe(401);
      expect(conExpirado.body).toEqual({ error: "Token inválido o expirado" });
    });

    it("responde 401 si el usuario del token ya no existe", async () => {
      const registro = await request(app).post("/api/auth/registro").send({
        nombre: "Usuario Temporal",
        email: "temporal@utmachala.edu.ec",
        password: "ClaveSegura123*"
      });

      await entorno.db
        .collection("usuarios")
        .deleteOne({ email: "temporal@utmachala.edu.ec" });

      const respuesta = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", `Bearer ${registro.body.token}`);

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toEqual({ error: "La sesión ya no es válida" });
    });
  });

  describe("autorizarPorRol", () => {
    const appRoles = express();
    appRoles.get(
      "/solo-admin",
      crearAutenticacion(SECRETO_PRUEBAS),
      autorizarPorRol("admin"),
      (_req, res) => {
        res.json({ ok: true });
      }
    );
    appRoles.use(manejadorErrores);

    it("permite el acceso al administrador", async () => {
      const sesion = await login(ADMIN.email, ADMIN.password);

      const respuesta = await request(appRoles)
        .get("/solo-admin")
        .set("Authorization", `Bearer ${sesion.body.token}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual({ ok: true });
    });

    it("responde 403 al estudiante", async () => {
      const sesion = await login(ANA.email, ANA.password);

      const respuesta = await request(appRoles)
        .get("/solo-admin")
        .set("Authorization", `Bearer ${sesion.body.token}`);

      expect(respuesta.status).toBe(403);
      expect(respuesta.body).toEqual({
        error: "No tienes permisos para realizar esta acción"
      });
    });
  });
});
