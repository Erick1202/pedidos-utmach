import type { EstadoPedido, Pedido } from '../models/pedido';
import { accionSiguiente, CLASES_ESTADO, pedidosQuePasaronAListo } from './estados';

const pedido = (_id: string, estado: EstadoPedido) => ({ _id, estado }) as Pedido;

describe('estados del pedido', () => {
  it('asigna el texto del botón según el estado actual', () => {
    expect(accionSiguiente('recibido')).toBe('Empezar a preparar');
    expect(accionSiguiente('preparando')).toBe('Marcar listo');
    expect(accionSiguiente('listo')).toBe('Entregar');
    expect(accionSiguiente('entregado')).toBeNull();
  });

  it('usa gris, ámbar, verde y azul para cada estado', () => {
    expect(CLASES_ESTADO.recibido).toContain('slate');
    expect(CLASES_ESTADO.preparando).toContain('amber');
    expect(CLASES_ESTADO.listo).toContain('emerald');
    expect(CLASES_ESTADO.entregado).toContain('blue');
  });

  describe('pedidosQuePasaronAListo', () => {
    it('detecta los pedidos que cambiaron a listo', () => {
      const anteriores = [pedido('a', 'preparando'), pedido('b', 'recibido'), pedido('c', 'listo')];
      const actuales = [pedido('a', 'listo'), pedido('b', 'preparando'), pedido('c', 'listo')];

      expect(pedidosQuePasaronAListo(anteriores, actuales)).toEqual(['a']);
    });

    it('ignora los pedidos que no estaban en la carga anterior', () => {
      expect(pedidosQuePasaronAListo([], [pedido('n', 'listo')])).toEqual([]);
    });
  });
});
