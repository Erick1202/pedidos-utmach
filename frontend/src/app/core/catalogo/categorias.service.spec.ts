import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Categoria } from '../models/catalogo';
import { CategoriasService } from './categorias.service';

const URL = 'http://localhost:3000/api/categorias';

const CATEGORIA: Categoria = {
  _id: '64c000000000000000000003',
  nombre: 'Bebidas',
  slug: 'bebidas',
};

describe('CategoriasService', () => {
  let http: HttpTestingController;
  let servicio: CategoriasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(CategoriasService);
  });

  afterEach(() => http.verify());

  it('extrae la lista de categorías', () => {
    let resultado: Categoria[] = [];
    servicio.listar().subscribe((categorias) => (resultado = categorias));

    http.expectOne(URL).flush({ categorias: [CATEGORIA] });
    expect(resultado).toEqual([CATEGORIA]);
  });

  it('crea, renombra y elimina con el verbo correcto', () => {
    servicio.crear('Bebidas').subscribe();
    const crear = http.expectOne(URL);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual({ nombre: 'Bebidas' });
    crear.flush({ categoria: CATEGORIA });

    servicio.actualizar(CATEGORIA._id, 'Bebidas frías').subscribe();
    const actualizar = http.expectOne(`${URL}/${CATEGORIA._id}`);
    expect(actualizar.request.method).toBe('PUT');
    actualizar.flush({ categoria: { ...CATEGORIA, nombre: 'Bebidas frías' } });

    servicio.eliminar(CATEGORIA._id).subscribe();
    const eliminar = http.expectOne(`${URL}/${CATEGORIA._id}`);
    expect(eliminar.request.method).toBe('DELETE');
    eliminar.flush(null, { status: 204, statusText: 'No Content' });
  });
});
