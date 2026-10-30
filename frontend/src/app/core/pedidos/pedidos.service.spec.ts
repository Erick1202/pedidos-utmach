import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Pedido } from '../models/pedido';
import { PedidosService } from './pedidos.service';

describe('PedidosService', () => {
  let http: HttpTestingController;
  let servicio: PedidosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(PedidosService);
  });

  afterEach(() => http.verify());

  it('envía solo ids, cantidades y hora, y devuelve el pedido', () => {
    const datos = {
      items: [{ productoId: 'p1', cantidad: 2 }],
      horaRecogida: '2026-10-29T12:30:00-05:00',
    };
    let resultado: Partial<Pedido> | undefined;

    servicio.crear(datos).subscribe((pedido) => (resultado = pedido));

    const peticion = http.expectOne('http://localhost:3000/api/pedidos');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(datos);
    peticion.flush({ pedido: { _id: 'x', total: 3 } });

    expect(resultado).toEqual({ _id: 'x', total: 3 });
  });
});
