import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  GastoPorEstudiante,
  PedidosPorHora,
  ProductoMasVendido,
  RangoFechas,
  Reportes,
  Resumen,
  VentaPorCategoria,
  VentaPorDia,
} from '../models/reporte';

/** Reportes del administrador; las agregaciones las calcula MongoDB en la API. */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  resumen(rango: RangoFechas = {}): Observable<Resumen> {
    return this.obtener<{ resumen: Resumen }>('resumen', rango).pipe(map((r) => r.resumen));
  }

  masVendidos(rango: RangoFechas = {}, limite?: number): Observable<ProductoMasVendido[]> {
    return this.obtener<{ productos: ProductoMasVendido[] }>('mas-vendidos', rango, limite).pipe(
      map((r) => r.productos),
    );
  }

  ventasPorDia(rango: RangoFechas = {}): Observable<VentaPorDia[]> {
    return this.obtener<{ dias: VentaPorDia[] }>('ventas-por-dia', rango).pipe(map((r) => r.dias));
  }

  horaPico(rango: RangoFechas = {}): Observable<PedidosPorHora[]> {
    return this.obtener<{ horas: PedidosPorHora[] }>('hora-pico', rango).pipe(map((r) => r.horas));
  }

  ventasPorCategoria(rango: RangoFechas = {}): Observable<VentaPorCategoria[]> {
    return this.obtener<{ categorias: VentaPorCategoria[] }>('ventas-por-categoria', rango).pipe(
      map((r) => r.categorias),
    );
  }

  porEstudiante(rango: RangoFechas = {}): Observable<GastoPorEstudiante[]> {
    return this.obtener<{ estudiantes: GastoPorEstudiante[] }>('por-estudiante', rango).pipe(
      map((r) => r.estudiantes),
    );
  }

  /** Los seis reportes del mismo rango en paralelo; falla si alguno falla. */
  todos(rango: RangoFechas = {}): Observable<Reportes> {
    return forkJoin({
      resumen: this.resumen(rango),
      masVendidos: this.masVendidos(rango),
      ventasPorDia: this.ventasPorDia(rango),
      horaPico: this.horaPico(rango),
      ventasPorCategoria: this.ventasPorCategoria(rango),
      porEstudiante: this.porEstudiante(rango),
    });
  }

  private obtener<T>(ruta: string, rango: RangoFechas, limite?: number): Observable<T> {
    let params = new HttpParams();
    if (rango.desde) {
      params = params.set('desde', rango.desde);
    }
    if (rango.hasta) {
      params = params.set('hasta', rango.hasta);
    }
    if (limite) {
      params = params.set('limite', limite);
    }
    return this.http.get<T>(`${this.url}/${ruta}`, { params });
  }
}
