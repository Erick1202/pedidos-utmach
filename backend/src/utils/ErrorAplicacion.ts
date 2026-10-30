/**
 * Error controlado de la aplicación. El middleware central lo traduce
 * a una respuesta JSON con el código HTTP indicado.
 */
export class ErrorAplicacion extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
    public readonly detalles?: unknown
  ) {
    super(mensaje);
    this.name = "ErrorAplicacion";
  }
}
