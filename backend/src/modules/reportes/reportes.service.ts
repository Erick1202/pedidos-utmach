import type { Db, Document } from "mongodb";
import {
  ESTADOS_ACTIVOS,
  rangoDiaEcuador,
  ZONA_HORARIA
} from "../pedidos/pedidos.reglas.js";
import type { RangoFechas } from "./reportes.schemas.js";

/**
 * Reportes del administrador. Los pipelines son los B1–B6 de
 * `database/consultas_pedidos_utmach.js`: solo se antepone el `$match` de
 * fechas y se agregan los ajustes documentados en `specs/006-reportes/plan.md`.
 * Todo el cálculo ocurre en MongoDB.
 */

export interface ProductoMasVendido {
  producto: string;
  unidades: number;
  ingresos: number;
}

export interface VentaPorDia {
  dia: string;
  pedidos: number;
  total: number;
}

export interface PedidosPorHora {
  hora: number;
  pedidos: number;
}

export interface VentaPorCategoria {
  categoria: string;
  unidades: number;
  ingresos: number;
  porcentaje: number;
}

export interface GastoPorEstudiante {
  estudiante: string;
  pedidos: number;
  gasto: number;
  ticket: number;
}

export interface Resumen {
  porEstado: Array<{ estado: string; pedidos: number }>;
  totales: { pedidos: number; ventas: number; ticketPromedio: number };
  hoy: number;
  activos: number;
}

/** Fecha `AAAA-MM-DD` de `ahora` en Ecuador. */
const formatoFechaEcuador = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

/**
 * `$match` inicial sobre `horaRecogida` (campo de `ix_estado_hora`): desde el
 * inicio de `desde` hasta el inicio del día siguiente a `hasta`, en Ecuador.
 * Sin fechas no se agrega ninguna etapa.
 */
export function etapaFiltroFechas({ desde, hasta }: RangoFechas): Document[] {
  if (!desde && !hasta) {
    return [];
  }

  const horaRecogida: Document = {};
  if (desde) {
    horaRecogida.$gte = rangoDiaEcuador(desde).desde;
  }
  if (hasta) {
    horaRecogida.$lt = rangoDiaEcuador(hasta).hasta;
  }

  return [{ $match: { horaRecogida } }];
}

const pedidos = (db: Db) => db.collection("pedidos");

/** B1. Productos más vendidos. */
export function masVendidos(
  db: Db,
  rango: RangoFechas,
  limite: number
): Promise<ProductoMasVendido[]> {
  return pedidos(db)
    .aggregate<ProductoMasVendido>([
      ...etapaFiltroFechas(rango),
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.nombre",
          unidades: { $sum: "$items.cantidad" },
          ingresos: { $sum: "$items.subtotal" }
        }
      },
      { $project: { _id: 0, producto: "$_id", unidades: 1, ingresos: { $round: ["$ingresos", 2] } } },
      { $sort: { unidades: -1, producto: 1 } },
      { $limit: limite }
    ])
    .toArray();
}

/** B2. Ventas por día de recogida en Ecuador. */
export function ventasPorDia(db: Db, rango: RangoFechas): Promise<VentaPorDia[]> {
  return pedidos(db)
    .aggregate<VentaPorDia>([
      ...etapaFiltroFechas(rango),
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$horaRecogida", timezone: ZONA_HORARIA }
          },
          pedidos: { $sum: 1 },
          total: { $sum: "$total" }
        }
      },
      { $project: { _id: 0, dia: "$_id", pedidos: 1, total: { $round: ["$total", 2] } } },
      { $sort: { dia: 1 } }
    ])
    .toArray();
}

/** B3. Hora pico de recogida en Ecuador. */
export function horaPico(db: Db, rango: RangoFechas): Promise<PedidosPorHora[]> {
  return pedidos(db)
    .aggregate<PedidosPorHora>([
      ...etapaFiltroFechas(rango),
      {
        $group: {
          _id: { $hour: { date: "$horaRecogida", timezone: ZONA_HORARIA } },
          pedidos: { $sum: 1 }
        }
      },
      { $project: { _id: 0, hora: "$_id", pedidos: 1 } },
      { $sort: { pedidos: -1, hora: 1 } }
    ])
    .toArray();
}

/** B4. Ventas por categoría con `$lookup` a productos y su porcentaje de ingresos. */
export function ventasPorCategoria(db: Db, rango: RangoFechas): Promise<VentaPorCategoria[]> {
  return pedidos(db)
    .aggregate<VentaPorCategoria>([
      ...etapaFiltroFechas(rango),
      { $unwind: "$items" },
      {
        $lookup: {
          from: "productos",
          localField: "items.productoId",
          foreignField: "_id",
          as: "producto"
        }
      },
      { $unwind: "$producto" },
      {
        $group: {
          _id: "$producto.categoria.nombre",
          unidades: { $sum: "$items.cantidad" },
          ingresos: { $sum: "$items.subtotal" }
        }
      },
      // Total de ingresos del rango para calcular la participación de cada categoría.
      {
        $group: {
          _id: null,
          categorias: { $push: "$$ROOT" },
          totalIngresos: { $sum: "$ingresos" }
        }
      },
      { $unwind: "$categorias" },
      {
        $project: {
          _id: 0,
          categoria: "$categorias._id",
          unidades: "$categorias.unidades",
          ingresos: { $round: ["$categorias.ingresos", 2] },
          porcentaje: {
            $cond: [
              { $gt: ["$totalIngresos", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$categorias.ingresos", "$totalIngresos"] }, 100] },
                  2
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { ingresos: -1, categoria: 1 } }
    ])
    .toArray();
}

/** B5. Pedidos, gasto y ticket promedio por estudiante. */
export function porEstudiante(db: Db, rango: RangoFechas): Promise<GastoPorEstudiante[]> {
  return pedidos(db)
    .aggregate<GastoPorEstudiante>([
      ...etapaFiltroFechas(rango),
      {
        $group: {
          _id: "$usuario.nombre",
          pedidos: { $sum: 1 },
          gasto: { $sum: "$total" },
          ticket: { $avg: "$total" }
        }
      },
      {
        $project: {
          _id: 0,
          estudiante: "$_id",
          pedidos: 1,
          gasto: { $round: ["$gasto", 2] },
          ticket: { $round: ["$ticket", 2] }
        }
      },
      { $sort: { gasto: -1, estudiante: 1 } }
    ])
    .toArray();
}

interface FacetasResumen {
  porEstado: Resumen["porEstado"];
  totales: Array<Resumen["totales"]>;
  hoy: Array<{ pedidos: number }>;
  activos: Array<{ pedidos: number }>;
}

/** B6. Resumen general en una sola consulta con `$facet`. */
export async function resumen(db: Db, rango: RangoFechas, ahora: Date): Promise<Resumen> {
  const hoy = rangoDiaEcuador(formatoFechaEcuador.format(ahora));

  const [facetas] = await pedidos(db)
    .aggregate<FacetasResumen>([
      ...etapaFiltroFechas(rango),
      {
        $facet: {
          porEstado: [
            { $group: { _id: "$estado", pedidos: { $sum: 1 } } },
            { $project: { _id: 0, estado: "$_id", pedidos: 1 } },
            { $sort: { pedidos: -1, estado: 1 } }
          ],
          totales: [
            {
              $group: {
                _id: null,
                pedidos: { $sum: 1 },
                ventas: { $sum: "$total" },
                ticketPromedio: { $avg: "$total" }
              }
            },
            {
              $project: {
                _id: 0,
                pedidos: 1,
                ventas: { $round: ["$ventas", 2] },
                ticketPromedio: { $round: ["$ticketPromedio", 2] }
              }
            }
          ],
          hoy: [
            { $match: { horaRecogida: { $gte: hoy.desde, $lt: hoy.hasta } } },
            { $count: "pedidos" }
          ],
          activos: [
            { $match: { estado: { $in: ESTADOS_ACTIVOS } } },
            { $count: "pedidos" }
          ]
        }
      }
    ])
    .toArray();

  // `$facet` devuelve listas vacías cuando no hay pedidos en el rango.
  return {
    porEstado: facetas?.porEstado ?? [],
    totales: facetas?.totales[0] ?? { pedidos: 0, ventas: 0, ticketPromedio: 0 },
    hoy: facetas?.hoy[0]?.pedidos ?? 0,
    activos: facetas?.activos[0]?.pedidos ?? 0
  };
}
