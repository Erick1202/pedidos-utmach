import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CarritoService } from '../core/carrito/carrito.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
})
export class Layout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly carrito = inject(CarritoService);

  protected readonly usuario = this.auth.usuario;
  protected readonly esAdmin = this.auth.esAdmin;
  protected readonly cantidadEnCarrito = this.carrito.cantidadItems;

  protected cerrarSesion(): void {
    // El carrito pertenece a la sesión: no debe heredarlo el siguiente usuario.
    this.carrito.vaciar();
    this.auth.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
