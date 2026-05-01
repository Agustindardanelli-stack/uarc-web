export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email?: string;
  rol_id?: number;
  rol?: Rol;
}

export interface Retencion {
  id: number;
  nombre: string;
  monto: number;
}

export interface Cobranza {
  id: number;
  usuario_id: number;
  fecha: string;
  tipo_documento: string;
  numero_factura?: string;
  razon_social?: string;
  monto: number;
  descripcion?: string;
  retencion?: Retencion;
  retencion_id?: number;
}

export interface Cuota {
  id: number;
  usuario_id: number;
  fecha: string;
  monto: number;
  pagado: boolean;
  monto_pagado?: number;
  usuario?: Usuario;
}

export interface Pago {
  id: number;
  usuario_id: number;
  fecha: string;
  monto: number;
  descripcion?: string;
  tipo_documento: "orden_pago" | "factura";
  numero_factura?: string;
  razon_social?: string;
  usuario?: Usuario;
}

export interface Movimiento {
  id: number;
  fecha: string;
  detalle?: string;
  recibo_factura?: string;
  ingreso: number;
  egreso: number;
  saldo?: number;
  descripcion?: string;
  usuario?: Pick<Usuario, "nombre">;
}

export interface Balance {
  ingresos: string | number;
  egresos: string | number;
  saldo: string | number;
}
