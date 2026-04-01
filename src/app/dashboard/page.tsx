"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

interface Balance {
  ingresos: string;
  egresos: string;
  saldo: string;
}

interface Usuario {
  nombre: string;
}

interface Movimiento {
  id: number;
  fecha: string;
  detalle?: string;
  recibo_factura?: string;
  ingreso: number;
  egreso: number;
  saldo?: number;
  descripcion?: string;
  usuario?: Usuario;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Balance) => setBalance(data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/partidas?skip=0&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Movimiento[]) => setMovimientos(data));
  }, []);

  function formatCurrency(value: string | number | undefined): string {
    if (!value && value !== 0) return "$0,00";

    const num =
      typeof value === "string"
        ? parseFloat(value.replace(/[$,]/g, ""))
        : value;

    if (isNaN(num)) return "$0,00";

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // 🔥 FIX DE FECHA (SIN TIMEZONE)
  const formatFecha = (fecha?: string) => {
    if (!fecha) return "";

    if (fecha.includes("T")) {
      return fecha.split("T")[0].split("-").reverse().join("/");
    }

    return fecha.split("-").reverse().join("/");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8">Home</h1>

        <button
          onClick={() => {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/partidas/recalcular-saldos`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              }
            )
              .then((res) => res.json())
              .then((data) => {
                alert(data.message);
                window.location.reload();
              })
              .catch(() => alert("Error al recalcular saldos"));
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
        >
          🔄 Recalcular Saldos
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            title="Ingresos Totales"
            value={formatCurrency(balance?.ingresos)}
            color="text-green-600"
          />
          <Card
            title="Egresos Totales"
            value={formatCurrency(balance?.egresos)}
            color="text-red-600"
          />
          <Card
            title="Saldo Actual"
            value={formatCurrency(balance?.saldo)}
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

                    {/* ✅ FIX APLICADO ACÁ */}
                    <td className="px-4 py-3">
                      {formatFecha(m.fecha)}
                    </td>

                    <td className="px-4 py-3">
                      {m.ingreso > 0 ? (
                        <span className="text-green-600 font-medium">
                          INGRESO
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          EGRESO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.detalle || "-"}</td>
                    <td className="px-4 py-3">
                      {m.recibo_factura || "-"}
                    </td>
                    <td className="px-4 py-3 text-green-600">
                      {formatCurrency(m.ingreso)}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {formatCurrency(m.egreso)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(m.saldo)}
                    </td>
                    <td className="px-4 py-3">
                      {m.usuario?.nombre || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {m.descripcion || "-"}
                    </td>
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