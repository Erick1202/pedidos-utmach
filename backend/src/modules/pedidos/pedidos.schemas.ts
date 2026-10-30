import { z } from "zod";
import { idMongo } from "../../utils/validacion.js";

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
