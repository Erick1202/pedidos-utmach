import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controlador.verify();
    localStorage.clear();
  });

  it('agrega el token a las peticiones de la API', () => {
    localStorage.setItem('pedidos_utmach_token', 'token-123');

    http.get('http://localhost:3000/api/auth/perfil').subscribe();

    const peticion = controlador.expectOne('http://localhost:3000/api/auth/perfil');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-123');
    peticion.flush({});
  });

  it('no agrega encabezado cuando no hay sesión', () => {
    http.get('http://localhost:3000/api/salud').subscribe();

    const peticion = controlador.expectOne('http://localhost:3000/api/salud');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({});
  });

  it('no envía el token a una URL externa', () => {
    localStorage.setItem('pedidos_utmach_token', 'token-123');

    http.get('https://ejemplo.com/datos').subscribe();

    const peticion = controlador.expectOne('https://ejemplo.com/datos');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({});
  });
});
