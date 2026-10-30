import {
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartConfiguration,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

// Solo se registran las piezas que usa el panel de reportes (tree-shaking).
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
);

export type ConfigGrafico = ChartConfiguration<'bar'> | ChartConfiguration<'doughnut'>;

/**
 * Envoltorio mínimo de Chart.js: crea el gráfico sobre el canvas después del
 * render, lo recrea cuando cambia la configuración y lo destruye al salir.
 */
@Component({
  selector: 'app-grafico',
  template: `
    <div class="relative h-64 w-full sm:h-72">
      <canvas #lienzo role="img" [attr.aria-label]="descripcion()"></canvas>
    </div>
  `,
})
export class Grafico {
  readonly config = input.required<ConfigGrafico>();
  /** Texto alternativo para lectores de pantalla. */
  readonly descripcion = input('');

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico: Chart | null = null;

  constructor() {
    afterRenderEffect(() => {
      const config = this.config();
      this.grafico?.destroy();
      this.grafico = new Chart(this.lienzo().nativeElement, config as ChartConfiguration);
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }
}
