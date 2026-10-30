import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Reportes } from '../models/reporte';
import { ReportesService } from './reportes.service';

const URL = 'http://localhost:3000/api/reportes';

describe('ReportesService', () => {
  let http: HttpTestingController;
  let servicio: ReportesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(ReportesService);
  });

  afterEach(() => http.verify());

  it('envía desde, hasta y limite solo cuando existen', () => {
    servicio.masVendidos({ desde: '2026-10-01', hasta: '2026-10-29' }, 3).subscribe();
    servicio.masVendidos().subscribe();

    http
      .expectOne(`${URL}/mas-vendidos?desde=2026-10-01&hasta=2026-10-29&limite=3`)
      .flush({ productos: [] });
    http.expectOne(`${URL}/mas-vendidos`).flush({ productos: [] });
  });

  it('extrae la lista de cada respuesta', () => {
    let dias: unknown;
    servicio.ventasPorDia({ hasta: '2026-10-29' }).subscribe((valor) => (dias = valor));

    http
      .expectOne(`${URL}/ventas-por-dia?hasta=2026-10-29`)
      .flush({ dias: [{ dia: '2026-10-29', pedidos: 1, total: 2.75 }] });

    expect(dias).toEqual([{ dia: '2026-10-29', pedidos: 1, total: 2.75 }]);
  });

  it('carga los seis reportes del mismo rango en paralelo', () => {
    let resultado: Reportes | undefined;
    servicio.todos({ desde: '2026-10-20' }).subscribe((valor) => (resultado = valor));

    const resumen = {
      porEstado: [],
      totales: { pedidos: 0, ventas: 0, ticketPromedio: 0 },
      hoy: 0,
      activos: 0,
    };
    http.expectOne(`${URL}/resumen?desde=2026-10-20`).flush({ resumen });
    http.expectOne(`${URL}/mas-vendidos?desde=2026-10-20`).flush({ productos: [] });
    http.expectOne(`${URL}/ventas-por-dia?desde=2026-10-20`).flush({ dias: [] });
    http.expectOne(`${URL}/hora-pico?desde=2026-10-20`).flush({ horas: [] });
    http.expectOne(`${URL}/ventas-por-categoria?desde=2026-10-20`).flush({ categorias: [] });
    http.expectOne(`${URL}/por-estudiante?desde=2026-10-20`).flush({ estudiantes: [] });

    expect(resultado).toEqual({
      resumen,
      masVendidos: [],
      ventasPorDia: [],
      horaPico: [],
      ventasPorCategoria: [],
      porEstudiante: [],
    });
  });
});
