import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { DatosPedido, Pedido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pedidos`;

  crear(datos: DatosPedido): Observable<Pedido> {
    return this.http
      .post<{ pedido: Pedido }>(this.url, datos)
      .pipe(map((respuesta) => respuesta.pedido));
  }

  /** Pedidos del estudiante autenticado, del más reciente al más antiguo. */
  misPedidos(limite?: number): Observable<Pedido[]> {
    const params = limite ? new HttpParams().set('limite', limite) : undefined;
    return this.http
      .get<{ pedidos: Pedido[] }>(`${this.url}/mios`, { params })
      .pipe(map((respuesta) => respuesta.pedidos));
  }

  /** Pedidos por atender (admin), ordenados por hora de recogida. `fecha` en `AAAA-MM-DD`. */
  activos(fecha?: string): Observable<Pedido[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http
      .get<{ pedidos: Pedido[] }>(`${this.url}/activos`, { params })
      .pipe(map((respuesta) => respuesta.pedidos));
  }

  /** Avanza el pedido al estado siguiente; el servidor decide cuál es. */
  avanzarEstado(id: string): Observable<Pedido> {
    return this.http
      .patch<{ pedido: Pedido }>(`${this.url}/${id}/estado`, {})
      .pipe(map((respuesta) => respuesta.pedido));
  }
}
