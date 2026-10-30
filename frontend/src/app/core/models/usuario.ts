export type Rol = 'estudiante' | 'admin';

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: Rol;
  creadoEn: string;
}

export interface Credenciales {
  email: string;
  password: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

export interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}
