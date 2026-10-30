import type { UsuarioAutenticado } from "../middleware/autenticacion.js";

declare module "express-serve-static-core" {
  interface Request {
    usuario?: UsuarioAutenticado;
  }
}
