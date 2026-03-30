'use client'

import React, { useEffect, useState } from 'react';

interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  monto: number;
}

const Page = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // 🔥 Traer datos (ajustá la URL a tu API)
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/movimientos')
      .then(res => res.json())
      .then(data => setMovimientos(data))
      .catch(err => console.error(err));
  }, []);

  // ✅ FORMATEADOR SIN BUG
  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    return fecha.split('-').reverse().join('/');
  };

  return (
    <div className="container mt-4">
      
      {/* CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Ingresos" value="$0" color="text-green-600" />
        <Card title="Egresos" value="$0" color="text-red-600" />
        <Card title="Balance" value="$0" color="text-blue-600" />
      </div>

      {/* TABLA */}
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
};

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