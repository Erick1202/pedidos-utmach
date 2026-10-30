import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Producto } from '../models/catalogo';
import { ProductosService } from './productos.service';

const URL = 'http://localhost:3000/api/productos';

const PRODUCTO: Producto = {
  _id: '64d000000000000000000001',
  nombre: 'Bolón de verde',
  descripcion: 'Bolón de plátano verde con queso o chicharrón',
  precio: 1.5,
  disponible: true,
  categoria: { _id: '64c000000000000000000001', nombre: 'Desayunos' },
  creadoEn: '2026-10-01T13:00:00.000Z',
};

describe('ProductosService', () => {
  let http: HttpTestingController;
  let servicio: ProductosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(ProductosService);
  });

  afterEach(() => http.verify());

  it('lista sin parámetros cuando no hay filtros', () => {
    let resultado: Producto[] = [];
    servicio.listar().subscribe((productos) => (resultado = productos));

    const peticion = http.expectOne(URL);
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush({ productos: [PRODUCTO] });

    expect(resultado).toEqual([PRODUCTO]);
  });

  it('envía categoría, búsqueda recortada y todos', () => {
    servicio.listar({ categoria: 'abc', q: '  verde ', todos: true }).subscribe();

    const peticion = http.expectOne((req) => req.url === URL);
    expect(peticion.request.params.get('categoria')).toBe('abc');
    expect(peticion.request.params.get('q')).toBe('verde');
    expect(peticion.request.params.get('todos')).toBe('true');
    peticion.flush({ productos: [] });
  });

  it('omite una búsqueda en blanco', () => {
    servicio.listar({ q: '   ', categoria: null }).subscribe();

    const peticion = http.expectOne(URL);
    expect(peticion.request.params.has('q')).toBe(false);
    expect(peticion.request.params.has('categoria')).toBe(false);
    peticion.flush({ productos: [] });
  });

  it('cambia la disponibilidad con PATCH', () => {
    servicio.cambiarDisponibilidad(PRODUCTO._id, false).subscribe();

    const peticion = http.expectOne(`${URL}/${PRODUCTO._id}/disponible`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ disponible: false });
    peticion.flush({ producto: { ...PRODUCTO, disponible: false } });
  });
});
