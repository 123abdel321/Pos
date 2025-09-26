// types/ubicacion.ts
export interface Pedido {
  id: number;
  id_venta: string | null;
  // otras propiedades del pedido...
}

export interface Ubicacion {
  id: number;
  nombre: string;
  text?: string;
  codigo: string;
  pedido?: Pedido | null;
  // otras propiedades de ubicación...
}