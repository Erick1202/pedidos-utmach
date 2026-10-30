import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import type { RangoFechas, Reportes } from '../../../core/models/reporte';
import { rangoRapido, type RangoRapido, validarRango } from '../../../core/reportes/rangos';
import { ReportesService } from '../../../core/reportes/reportes.service';
import { type ConfigGrafico, Grafico } from '../../../shared/grafico/grafico';

/** Paleta UTMACH: azul institucional, azul claro, amarillo y tonos de apoyo. */
const AZUL = '#003087';
const AZUL_CLARO = '#1d4ed8';
const AMARILLO = '#f2b705';
const COLORES_DONA = [AZUL, AMARILLO, AZUL_CLARO, '#60a5fa', '#94a3b8', '#001f5c'];

const formatoMoneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

/** Eje y cuadrícula sobrios, comunes a los gráficos de barras. */
const ESCALAS = {
  grid: { color: '#e2e8f0' },
  ticks: { color: '#475569' },
};

@Component({
  selector: 'app-admin-reportes',
  imports: [CurrencyPipe, Grafico],
  templateUrl: './admin-reportes.html',
})
export class AdminReportes {
  private readonly reportesService = inject(ReportesService);

  protected readonly botonesRapidos: Array<{ tipo: RangoRapido; etiqueta: string }> = [
    { tipo: 'todo', etiqueta: 'Todo' },
    { tipo: 'semana', etiqueta: 'Últimos 7 días' },
    { tipo: 'mes', etiqueta: 'Este mes' },
  ];

  protected readonly rango = signal<RangoFechas>({});
  /** Botón rápido activo; `null` cuando el rango se eligió a mano. */
  protected readonly rapido = signal<RangoRapido | null>('todo');
  protected readonly errorFiltro = signal<string | null>(null);

  protected readonly datos = signal<Reportes | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cargando = signal(true);

  protected readonly sinDatos = computed(() => this.datos()?.resumen.totales.pedidos === 0);

  protected readonly graficoMasVendidos = computed<ConfigGrafico | null>(() => {
    const productos = this.datos()?.masVendidos;
    if (!productos?.length) return null;
    return {
      type: 'bar',
      data: {
        labels: productos.map((p) => p.producto),
        datasets: [
          {
            label: 'Unidades',
            data: productos.map((p) => p.unidades),
            backgroundColor: AZUL,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (item) =>
                `Ingresos: ${formatoMoneda.format(productos[item.dataIndex]?.ingresos ?? 0)}`,
            },
          },
        },
        scales: {
          x: { ...ESCALAS, beginAtZero: true, ticks: { ...ESCALAS.ticks, precision: 0 } },
          y: ESCALAS,
        },
      },
    };
  });

  protected readonly graficoVentasPorDia = computed<ConfigGrafico | null>(() => {
    const dias = this.datos()?.ventasPorDia;
    if (!dias?.length) return null;
    return {
      type: 'bar',
      data: {
        // `AAAA-MM-DD` → `DD/MM`, sin pasar por la zona horaria del navegador.
        labels: dias.map((d) => `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`),
        datasets: [
          {
            label: 'Ventas',
            data: dias.map((d) => d.total),
            backgroundColor: AZUL_CLARO,
            borderRadius: 6,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Ventas: ${formatoMoneda.format(Number(item.raw))}`,
              afterLabel: (item) => `Pedidos: ${dias[item.dataIndex]?.pedidos ?? 0}`,
            },
          },
        },
        scales: {
          x: ESCALAS,
          y: {
            ...ESCALAS,
            beginAtZero: true,
            ticks: { ...ESCALAS.ticks, callback: (valor) => `$${valor}` },
          },
        },
      },
    };
  });

  protected readonly graficoHoraPico = computed<ConfigGrafico | null>(() => {
    const horas = this.datos()?.horaPico;
    if (!horas?.length) return null;
    // La API ordena por pedidos; el gráfico muestra las horas en orden y resalta la pico.
    const enOrden = [...horas].sort((a, b) => a.hora - b.hora);
    const maximo = Math.max(...horas.map((h) => h.pedidos));
    return {
      type: 'bar',
      data: {
        labels: enOrden.map((h) => `${String(h.hora).padStart(2, '0')}:00`),
        datasets: [
          {
            label: 'Pedidos',
            data: enOrden.map((h) => h.pedidos),
            backgroundColor: enOrden.map((h) => (h.pedidos === maximo ? AMARILLO : AZUL)),
            borderRadius: 6,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: ESCALAS,
          y: { ...ESCALAS, beginAtZero: true, ticks: { ...ESCALAS.ticks, precision: 0 } },
        },
      },
    };
  });

  protected readonly graficoCategorias = computed<ConfigGrafico | null>(() => {
    const categorias = this.datos()?.ventasPorCategoria;
    if (!categorias?.length) return null;
    return {
      type: 'doughnut',
      data: {
        labels: categorias.map((c) => `${c.categoria} (${c.porcentaje}%)`),
        datasets: [
          {
            data: categorias.map((c) => c.ingresos),
            backgroundColor: categorias.map(
              (_, i) => COLORES_DONA[i % COLORES_DONA.length] ?? AZUL,
            ),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#334155', boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => {
                const categoria = categorias[item.dataIndex];
                return categoria
                  ? `${formatoMoneda.format(categoria.ingresos)} · ${categoria.porcentaje}% · ${categoria.unidades} u.`
                  : '';
              },
            },
          },
        },
      },
    };
  });

  constructor() {
    toObservable(this.rango)
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap((rango) =>
          this.reportesService.todos(rango).pipe(
            map((datos) => ({ datos, error: null })),
            catchError((respuesta: HttpErrorResponse) =>
              of({ datos: null, error: mensajeDeError(respuesta) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ datos, error }) => {
        this.cargando.set(false);
        this.datos.set(datos);
        this.error.set(error);
      });
  }

  protected elegirRapido(tipo: RangoRapido): void {
    this.rapido.set(tipo);
    this.errorFiltro.set(null);
    this.rango.set(rangoRapido(tipo, new Date()));
  }

  protected cambiarFecha(campo: keyof RangoFechas, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    const rango: RangoFechas = { ...this.rango(), [campo]: valor || undefined };

    const mensaje = validarRango(rango);
    this.errorFiltro.set(mensaje);
    if (mensaje) return;

    this.rapido.set(null);
    this.rango.set(rango);
  }

  protected reintentar(): void {
    this.rango.set({ ...this.rango() });
  }
}
