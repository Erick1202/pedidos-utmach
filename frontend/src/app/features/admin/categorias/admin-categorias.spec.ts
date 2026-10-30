import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Categoria } from '../../../core/models/catalogo';
import { AdminCategorias } from './admin-categorias';

const URL = 'http://localhost:3000/api/categorias';
const DESAYUNOS: Categoria = { _id: 'c1', nombre: 'Desayunos', slug: 'desayunos' };

describe('AdminCategorias', () => {
  let fixture: ComponentFixture<AdminCategorias>;
  let http: HttpTestingController;
  let elemento: HTMLElement;

  const escribir = (selector: string, valor: string) => {
    const campo = elemento.querySelector<HTMLInputElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  };

  const enviar = (formulario: HTMLFormElement) => {
    formulario.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminCategorias);
    elemento = fixture.nativeElement as HTMLElement;
    http.expectOne(URL).flush({ categorias: [DESAYUNOS] });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('crea una categoría al enviar el formulario', () => {
    escribir('#nueva-categoria', 'Postres');
    enviar(elemento.querySelector('form')!);

    const peticion = http.expectOne(URL);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ nombre: 'Postres' });
    peticion.flush({ categoria: { _id: 'c2', nombre: 'Postres', slug: 'postres' } });
    fixture.detectChanges();

    expect(elemento.textContent).toContain('Categoría «Postres» creada.');
  });

  it('edita una categoría al guardar el formulario en línea', () => {
    const editar = [...elemento.querySelectorAll('button')].find(
      (boton) => boton.textContent?.trim() === 'Editar',
    )!;
    editar.click();
    fixture.detectChanges();

    escribir('#editar-c1', 'Desayunos UTMACH');
    enviar(elemento.querySelectorAll('form')[1] as HTMLFormElement);

    const peticion = http.expectOne(`${URL}/c1`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ nombre: 'Desayunos UTMACH' });
    peticion.flush({
      categoria: { _id: 'c1', nombre: 'Desayunos UTMACH', slug: 'desayunos-utmach' },
    });
    fixture.detectChanges();

    expect(elemento.textContent).toContain('Desayunos UTMACH');
  });
});
