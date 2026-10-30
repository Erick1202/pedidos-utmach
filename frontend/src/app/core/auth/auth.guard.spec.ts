import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { estudianteGuard } from './estudiante.guard';
import { guestGuard } from './guest.guard';

function preparar(autenticado: boolean, esAdmin: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          autenticado: signal(autenticado),
          esAdmin: signal(esAdmin),
        },
      },
    ],
  });

  const router = TestBed.inject(Router);
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  return { router, ruta, estado };
}

describe('guards de autenticación', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('authGuard redirige a /login cuando no hay sesión', () => {
    const { router, ruta, estado } = preparar(false, false);

    const resultado = TestBed.runInInjectionContext(() => authGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('authGuard permite el acceso con sesión', () => {
    const { ruta, estado } = preparar(true, false);

    const resultado = TestBed.runInInjectionContext(() => authGuard(ruta, estado));

    expect(resultado).toBe(true);
  });

  it('adminGuard envía al login cuando no hay sesión', () => {
    const { router, ruta, estado } = preparar(false, false);

    const resultado = TestBed.runInInjectionContext(() => adminGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('adminGuard redirige al menú a un estudiante', () => {
    const { router, ruta, estado } = preparar(true, false);

    const resultado = TestBed.runInInjectionContext(() => adminGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/menu');
  });

  it('adminGuard permite el acceso al administrador', () => {
    const { ruta, estado } = preparar(true, true);

    const resultado = TestBed.runInInjectionContext(() => adminGuard(ruta, estado));

    expect(resultado).toBe(true);
  });

  it('guestGuard permite el acceso a un visitante', () => {
    const { ruta, estado } = preparar(false, false);

    const resultado = TestBed.runInInjectionContext(() => guestGuard(ruta, estado));

    expect(resultado).toBe(true);
  });

  it('guestGuard envía al administrador a /admin', () => {
    const { router, ruta, estado } = preparar(true, true);

    const resultado = TestBed.runInInjectionContext(() => guestGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/admin');
  });

  it('guestGuard envía al estudiante a /menu', () => {
    const { router, ruta, estado } = preparar(true, false);

    const resultado = TestBed.runInInjectionContext(() => guestGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/menu');
  });

  it('estudianteGuard permite el acceso al estudiante', () => {
    const { ruta, estado } = preparar(true, false);

    const resultado = TestBed.runInInjectionContext(() => estudianteGuard(ruta, estado));

    expect(resultado).toBe(true);
  });

  it('estudianteGuard envía al administrador a /admin', () => {
    const { router, ruta, estado } = preparar(true, true);

    const resultado = TestBed.runInInjectionContext(() => estudianteGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/admin');
  });

  it('estudianteGuard envía al login cuando no hay sesión', () => {
    const { router, ruta, estado } = preparar(false, false);

    const resultado = TestBed.runInInjectionContext(() => estudianteGuard(ruta, estado));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
