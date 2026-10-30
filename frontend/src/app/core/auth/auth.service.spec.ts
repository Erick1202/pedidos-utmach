import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Usuario } from '../models/usuario';
import { AuthService } from './auth.service';

const USUARIO: Usuario = {
  _id: '64a100000000000000000001',
  nombre: 'Ana Torres',
  email: 'ana.torres@utmachala.edu.ec',
  rol: 'estudiante',
  creadoEn: '2026-10-02T14:00:00.000Z',
};

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('guarda el token y el usuario al iniciar sesión', () => {
    const servicio = TestBed.inject(AuthService);

    servicio
      .iniciarSesion({
        email: USUARIO.email,
        password: 'Estudiante123*',
      })
      .subscribe();

    const peticion = http.expectOne('http://localhost:3000/api/auth/login');
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ token: 'token-de-prueba', usuario: USUARIO });

    expect(servicio.autenticado()).toBe(true);
    expect(servicio.usuario()).toEqual(USUARIO);
    expect(localStorage.getItem('pedidos_utmach_token')).toBe('token-de-prueba');
    expect(localStorage.getItem('pedidos_utmach_usuario')).toContain('Ana Torres');
  });

  it('registra un estudiante y guarda la sesión', () => {
    const servicio = TestBed.inject(AuthService);

    servicio
      .registrar({
        nombre: USUARIO.nombre,
        email: USUARIO.email,
        password: 'Estudiante123*',
      })
      .subscribe();

    const peticion = http.expectOne('http://localhost:3000/api/auth/registro');
    expect(peticion.request.method).toBe('POST');
    peticion.flush(
      { token: 'token-registro', usuario: USUARIO },
      { status: 201, statusText: 'Created' },
    );

    expect(servicio.autenticado()).toBe(true);
    expect(localStorage.getItem('pedidos_utmach_token')).toBe('token-registro');
  });

  it('restaura la sesión consultando el perfil', async () => {
    localStorage.setItem('pedidos_utmach_token', 'token-guardado');
    localStorage.setItem('pedidos_utmach_usuario', JSON.stringify(USUARIO));

    const servicio = TestBed.inject(AuthService);
    const restauracion = servicio.restaurarSesion();

    const peticion = http.expectOne('http://localhost:3000/api/auth/perfil');
    peticion.flush({
      usuario: { ...USUARIO, nombre: 'Ana Torres Actualizada' },
    });

    await restauracion;

    expect(servicio.autenticado()).toBe(true);
    expect(servicio.usuario()?.nombre).toBe('Ana Torres Actualizada');
  });

  it('limpia la sesión si el token ya no es válido', async () => {
    localStorage.setItem('pedidos_utmach_token', 'token-vencido');
    localStorage.setItem('pedidos_utmach_usuario', JSON.stringify(USUARIO));

    const servicio = TestBed.inject(AuthService);
    const restauracion = servicio.restaurarSesion();

    http
      .expectOne('http://localhost:3000/api/auth/perfil')
      .flush({ error: 'Token inválido o expirado' }, { status: 401, statusText: 'Unauthorized' });

    await restauracion;

    expect(servicio.autenticado()).toBe(false);
    expect(servicio.usuario()).toBeNull();
    expect(localStorage.getItem('pedidos_utmach_token')).toBeNull();
  });

  it('limpia el almacenamiento al cerrar sesión', () => {
    localStorage.setItem('pedidos_utmach_token', 'token');
    localStorage.setItem('pedidos_utmach_usuario', JSON.stringify(USUARIO));

    const servicio = TestBed.inject(AuthService);
    servicio.cerrarSesion();

    expect(servicio.autenticado()).toBe(false);
    expect(localStorage.getItem('pedidos_utmach_token')).toBeNull();
    expect(localStorage.getItem('pedidos_utmach_usuario')).toBeNull();
  });
});
