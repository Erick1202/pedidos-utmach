import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { DatosProducto, FiltrosProductos, Producto } from '../models/catalogo';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  /** Solo envía los filtros con valor; la búsqueda se recorta. */
  listar(filtros: FiltrosProductos = {}): Observable<Producto[]> {
    let params = new HttpParams();
    const busqueda = filtros.q?.trim();

    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (busqueda) {
      params = params.set('q', busqueda);
    }
    if (filtros.todos) {
      params = params.set('todos', 'true');
    }

    return this.http
      .get<{ productos: Producto[] }>(this.url, { params })
      .pipe(map((respuesta) => respuesta.productos));
  }

  crear(datos: DatosProducto): Observable<Producto> {
    return this.http
      .post<{ producto: Producto }>(this.url, datos)
      .pipe(map((respuesta) => respuesta.producto));
  }

  actualizar(id: string, datos: DatosProducto): Observable<Producto> {
    return this.http
      .put<{ producto: Producto }>(`${this.url}/${id}`, datos)
      .pipe(map((respuesta) => respuesta.producto));
  }

  cambiarDisponibilidad(id: string, disponible: boolean): Observable<Producto> {
    return this.http
      .patch<{ producto: Producto }>(`${this.url}/${id}/disponible`, { disponible })
      .pipe(map((respuesta) => respuesta.producto));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
