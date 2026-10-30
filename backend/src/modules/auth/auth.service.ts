import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId, type Db } from "mongodb";
import { ErrorAplicacion } from "../../utils/ErrorAplicacion.js";
import type { DatosLogin, DatosRegistro } from "./auth.schemas.js";

export type Rol = "estudiante" | "admin";

export interface UsuarioDocumento {
  _id: ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  creadoEn: Date;
}

export interface UsuarioPublico {
  _id: string;
  nombre: string;
  email: string;
  rol: Rol;
  creadoEn: Date;
}

export interface RespuestaSesion {
  token: string;
  usuario: UsuarioPublico;
}

function aUsuarioPublico(usuario: UsuarioDocumento): UsuarioPublico {
  return {
    _id: usuario._id.toHexString(),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    creadoEn: usuario.creadoEn
  };
}

function firmarToken(usuario: UsuarioDocumento, jwtSecret: string): string {
  return jwt.sign(
    {
      _id: usuario._id.toHexString(),
      nombre: usuario.nombre,
      rol: usuario.rol
    },
    jwtSecret,
    { algorithm: "HS256", expiresIn: 8 * 60 * 60 }
  );
}

/** Registra siempre como estudiante, con correo normalizado y hash bcrypt. */
export async function registrarUsuario(
  db: Db,
  datos: DatosRegistro,
  jwtSecret: string
): Promise<RespuestaSesion> {
  const usuarios = db.collection<UsuarioDocumento>("usuarios");

  const existente = await usuarios.findOne(
    { email: datos.email },
    { projection: { _id: 1 } }
  );
  if (existente) {
    throw new ErrorAplicacion(409, "El correo ya está registrado");
  }

  const usuario: UsuarioDocumento = {
    _id: new ObjectId(),
    nombre: datos.nombre,
    email: datos.email,
    passwordHash: await bcrypt.hash(datos.password, 10),
    rol: "estudiante",
    creadoEn: new Date()
  };

  await usuarios.insertOne(usuario);

  return {
    token: firmarToken(usuario, jwtSecret),
    usuario: aUsuarioPublico(usuario)
  };
}

/** Verifica correo y contraseña sin revelar cuál de los dos falló. */
export async function iniciarSesion(
  db: Db,
  datos: DatosLogin,
  jwtSecret: string
): Promise<RespuestaSesion> {
  const usuario = await db
    .collection<UsuarioDocumento>("usuarios")
    .findOne({ email: datos.email });

  if (!usuario) {
    throw new ErrorAplicacion(401, "Correo o contraseña incorrectos");
  }

  const coincide = await bcrypt.compare(datos.password, usuario.passwordHash);
  if (!coincide) {
    throw new ErrorAplicacion(401, "Correo o contraseña incorrectos");
  }

  return {
    token: firmarToken(usuario, jwtSecret),
    usuario: aUsuarioPublico(usuario)
  };
}

/** Devuelve los datos actuales del usuario autenticado. */
export async function obtenerPerfil(
  db: Db,
  id: string
): Promise<UsuarioPublico> {
  if (!ObjectId.isValid(id)) {
    throw new ErrorAplicacion(401, "Token inválido o expirado");
  }

  const usuario = await db
    .collection<UsuarioDocumento>("usuarios")
    .findOne({ _id: new ObjectId(id) });

  if (!usuario) {
    throw new ErrorAplicacion(401, "La sesión ya no es válida");
  }

  return aUsuarioPublico(usuario);
}
