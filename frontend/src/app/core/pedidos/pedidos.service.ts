import { HttpClient } from '@angular/common/http';
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
}
