"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const [balance, setBalance] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (token) {
      // Traer balance
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setBalance);

      // Traer libro diario
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/partidas?skip=0&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setMovimientos);
    }
  }, [token]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8">Home</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            title="Ingresos Totales"
            value={balance?.ingresos || "$0.00"}
            color="text-green-600"
          />
          <Card
            title="Egresos Totales"
            value={balance?.egresos || "$0.00"}
            color="text-red-600"
          />
          <Card
            title="Saldo Actual"
            value={balance?.saldo || "$0.00"}
            color="text-blue-600"
          />
        </div>

        <div className="bg-gray-50 p-6 rounded shadow">
  <h2 className="text-xl font-bold mb-4">
    Últimos Movimientos (Libro Diario)
  </h2>
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-gray-900">
      <thead className="bg-blue-600 text-white uppercase text-xs">
        <tr>
          <th className="px-4 py-3 text-left">ID</th>
          <th className="px-4 py-3 text-left">Fecha</th>
          <th className="px-4 py-3 text-left">Cuenta</th>
          <th className="px-4 py-3 text-left">Detalle</th>
          <th className="px-4 py-3 text-left">Comprobante</th>
          <th className="px-4 py-3 text-left">Ingreso</th>
          <th className="px-4 py-3 text-left">Egreso</th>
          <th className="px-4 py-3 text-left">Saldo</th>
          <th className="px-4 py-3 text-left">Usuario</th>
          <th className="px-4 py-3 text-left">Descripción</th>
        </tr>
      </thead>
      <tbody>
        {movimientos.map((m, idx) => (
          <tr
            key={m.id}
            className={
              idx % 2 === 0
                ? "bg-white hover:bg-gray-100"
                : "bg-gray-50 hover:bg-gray-100"
            }
          >
            <td className="px-4 py-3">{m.id}</td>
            <td className="px-4 py-3">
              {m.fecha
                ? new Date(m.fecha).toLocaleDateString()
                : ""}
            </td>
            <td className="px-4 py-3">
              {m.ingreso > 0 ? (
                <span className="text-green-600 font-medium">INGRESO</span>
              ) : (
                <span className="text-red-600 font-medium">EGRESO</span>
              )}
            </td>
            <td className="px-4 py-3">{m.detalle || "-"}</td>
            <td className="px-4 py-3">{m.recibo_factura || "-"}</td>
            <td className="px-4 py-3 text-green-600">
              {m.ingreso > 0 ? `$${m.ingreso.toFixed(2)}` : "-"}
            </td>
            <td className="px-4 py-3 text-red-600">
              {m.egreso > 0 ? `$${m.egreso.toFixed(2)}` : "-"}
            </td>
            <td className="px-4 py-3 font-semibold">
              {m.saldo !== undefined
                ? `$${m.saldo.toFixed(2)}`
                : "-"}
            </td>
            <td className="px-4 py-3">{m.usuario?.nombre || "-"}</td>
            <td className="px-4 py-3">{m.descripcion || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      </main>
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
