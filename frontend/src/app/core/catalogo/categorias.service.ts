import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Categoria } from '../models/catalogo';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http
      .get<{ categorias: Categoria[] }>(this.url)
      .pipe(map((respuesta) => respuesta.categorias));
  }

  crear(nombre: string): Observable<Categoria> {
    return this.http
      .post<{ categoria: Categoria }>(this.url, { nombre })
      .pipe(map((respuesta) => respuesta.categoria));
  }

  actualizar(id: string, nombre: string): Observable<Categoria> {
    return this.http
      .put<{ categoria: Categoria }>(`${this.url}/${id}`, { nombre })
      .pipe(map((respuesta) => respuesta.categoria));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
