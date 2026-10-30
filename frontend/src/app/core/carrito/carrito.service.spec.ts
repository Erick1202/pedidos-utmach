import { TestBed } from '@angular/core/testing';
import type { Producto } from '../models/catalogo';
import { CarritoService } from './carrito.service';

const CLAVE = 'pedidos_utmach_carrito';

const producto = (id: string, nombre: string, precio: number): Producto => ({
  _id: id,
  nombre,
  descripcion: '',
  precio,
  disponible: true,
  categoria: { _id: 'c1', nombre: 'Desayunos' },
  creadoEn: '2026-10-01T13:00:00.000Z',
});

const BOLON = producto('p1', 'Bolón de verde', 1.5);
const CAFE = producto('p2', 'Café pasado', 0.6);

function nuevaInstancia(): CarritoService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(CarritoService);
}

describe('CarritoService', () => {
  let carrito: CarritoService;

  beforeEach(() => {
    localStorage.clear();
    carrito = nuevaInstancia();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('empieza vacío', () => {
    expect(carrito.vacio()).toBe(true);
    expect(carrito.cantidadItems()).toBe(0);
    expect(carrito.total()).toBe(0);
  });

  it('agrega productos e incrementa la cantidad si ya están', () => {
    carrito.agregar(BOLON);
    carrito.agregar(CAFE);
    carrito.agregar(BOLON);

    expect(carrito.lineas().map((linea) => [linea.nombre, linea.cantidad])).toEqual([
      ['Bolón de verde', 2],
      ['Café pasado', 1],
    ]);
    expect(carrito.cantidadItems()).toBe(3);
    expect(carrito.cantidadDe('p1')).toBe(2);
    expect(carrito.total()).toBe(3.6);
  });

  it('calcula el total redondeado a dos decimales', () => {
    carrito.agregar(producto('p3', 'Chifles', 0.1));
    carrito.cambiarCantidad('p3', 3);
    carrito.agregar(producto('p4', 'Pan de yuca', 1.15));
    carrito.cambiarCantidad('p4', 3);

    expect(carrito.total()).toBe(3.75);
  });

  it('acota la cantidad entre 1 y 20 y a un entero', () => {
    carrito.agregar(BOLON);

    carrito.cambiarCantidad('p1', 25);
    expect(carrito.cantidadDe('p1')).toBe(20);

    carrito.agregar(BOLON);
    expect(carrito.cantidadDe('p1')).toBe(20);

    carrito.cambiarCantidad('p1', 0);
    expect(carrito.cantidadDe('p1')).toBe(1);

    carrito.cambiarCantidad('p1', 4.7);
    expect(carrito.cantidadDe('p1')).toBe(4);
  });

  it('quita una línea y vacía el carrito', () => {
    carrito.agregar(BOLON);
    carrito.agregar(CAFE);

    carrito.quitar('p1');
    expect(carrito.lineas().map((linea) => linea.productoId)).toEqual(['p2']);

    carrito.vaciar();
    expect(carrito.vacio()).toBe(true);
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });

  it('persiste en localStorage y se restaura en una nueva instancia', () => {
    carrito.agregar(BOLON);
    carrito.cambiarCantidad('p1', 3);

    const restaurado = nuevaInstancia();

    expect(restaurado.cantidadItems()).toBe(3);
    expect(restaurado.total()).toBe(4.5);
  });

  it('descarta datos corruptos al iniciar', () => {
    localStorage.setItem(CLAVE, '{no es json');

    expect(nuevaInstancia().vacio()).toBe(true);
  });
});
