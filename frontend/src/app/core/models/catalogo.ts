export interface Categoria {
  _id: string;
  nombre: string;
  slug: string;
}

export interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  disponible: boolean;
  categoria: { _id: string; nombre: string };
  creadoEn: string;
}

/** Cuerpo de `POST` y `PUT /productos`: la categoría se envía solo como id. */
export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  disponible: boolean;
  categoriaId: string;
}

export interface FiltrosProductos {
  categoria?: string | null;
  q?: string | null;
  /** Solo admin: incluye los productos no disponibles. */
  todos?: boolean;
}
