'use client'

import React from 'react';

interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  monto: number;
}

interface Props {
  movimientos: Movimiento[];
}

const Page = ({ movimientos }: Props) => {

  // ✅ FORMATEADOR CORRECTO (SIN DATE)
  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    return fecha.split('-').reverse().join('/');
  };

  return (
    <div className="container mt-4">
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Monto</th>
          </tr>
        </thead>

        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>

              {/* 🔥 ACÁ ESTÁ EL FIX */}
              <td>{formatFecha(m.fecha)}</td>

              <td>{m.tipo}</td>
              <td>{m.descripcion}</td>
              <td>${m.monto.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded shadow p-6">
      <h3 className="text-gray-700 text-sm mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default Page;
export {Card} ;