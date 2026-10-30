import type { EstadoPedido } from './pedido';

/** Días de recogida en Ecuador (`AAAA-MM-DD`), ambos opcionales e inclusivos. */
export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

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
  /** Hora de recogida en Ecuador (0–23). */
  hora: number;
  pedidos: number;
}

export interface VentaPorCategoria {
  categoria: string;
  unidades: number;
  ingresos: number;
  /** Participación en los ingresos del rango (0–100). */
  porcentaje: number;
}

export interface GastoPorEstudiante {
  estudiante: string;
  pedidos: number;
  gasto: number;
  ticket: number;
}

export interface Resumen {
  porEstado: Array<{ estado: EstadoPedido; pedidos: number }>;
  totales: { pedidos: number; ventas: number; ticketPromedio: number };
  /** Pedidos que se recogen hoy en Ecuador. */
  hoy: number;
  /** Pedidos en recibido, preparando o listo. */
  activos: number;
}

/** Los seis reportes del panel, cargados en paralelo. */
export interface Reportes {
  resumen: Resumen;
  masVendidos: ProductoMasVendido[];
  ventasPorDia: VentaPorDia[];
  horaPico: PedidosPorHora[];
  ventasPorCategoria: VentaPorCategoria[];
  porEstudiante: GastoPorEstudiante[];
}
