import { z } from "zod";
import { fechaCalendario, idMongo } from "../../utils/validacion.js";

/**
 * Sin `.strict()` a propósito: zod descarta las claves desconocidas, de modo
 * que `precioUnitario`, `subtotal`, `total` o `usuario` enviados por el
 * cliente se ignoran. El rango de cantidades y la hora se validan con las
 * reglas puras de `pedidos.reglas.ts`.
 */
export const esquemaCrearPedido = z.object({
  items: z
    .array(
      z.object({
        productoId: idMongo,
        cantidad: z.number({ error: "La cantidad debe ser un número" })
      }),
      { error: "Los productos del pedido deben ser una lista" }
    )
    .max(50, "El pedido no puede tener más de 50 productos distintos")
    // zod v4 ejecuta el refine aunque un id haya fallado (queda como texto),
    // por eso se compara con `String()` y no con `toHexString()`.
    .refine(
      (items) => new Set(items.map((item) => String(item.productoId))).size === items.length,
      "No repitas un producto en el pedido"
    ),
  horaRecogida: z.iso
    .datetime({ offset: true, error: "La hora de recogida debe ser una fecha ISO 8601" })
    .transform((valor) => new Date(valor))
});

export type DatosCrearPedido = z.infer<typeof esquemaCrearPedido>;

/** `GET /mios?limite`: paginación simple, por defecto 20 pedidos. */
export const esquemaMisPedidos = z.object({
  limite: z.coerce
    .number({ error: "El límite debe ser un número" })
    .int("El límite debe ser un número entero")
    .min(1, "El límite debe estar entre 1 y 50")
    .max(50, "El límite debe estar entre 1 y 50")
    .default(20)
});

/** `GET /activos?fecha=AAAA-MM-DD`: día de recogida en Ecuador (opcional). */
export const esquemaPedidosActivos = z.object({
  fecha: fechaCalendario.optional()
});
