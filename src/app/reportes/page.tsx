"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

type MesData = {
  nombre_mes: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

export default function ReportesPage() {
  const [meses, setMeses] = useState<MesData[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setToken(token);
    if (token) {
      fetchIngresosEgresos(token);
    }
  }, [anio]);

  const fetchIngresosEgresos = (token: string) => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reportes/ingresos_egresos_mensuales?anio=${anio}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.datos) {
          setMeses(data.datos);
        }
      })
      .catch(console.error);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Reportes Financieros
        </h1>

        <div className="bg-white rounded shadow p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">
            Ingresos y Egresos Mensuales - {anio}
          </h2>

          <div className="mb-4">
            <label className="mr-2">Seleccionar año:</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border p-2 rounded"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Mes</th>
                <th className="text-left p-2 border">Ingresos</th>
                <th className="text-left p-2 border">Egresos</th>
                <th className="text-left p-2 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.nombre_mes} className="hover:bg-gray-50">
                  <td className="p-2 border">{m.nombre_mes}</td>
                  <td className="p-2 border text-green-600">
                    ${m.ingresos?.toFixed(2)}
                  </td>
                  <td className="p-2 border text-red-600">
                    ${m.egresos?.toFixed(2)}
                  </td>
                  <td
                    className={`p-2 border ${
                      m.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${m.balance?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
