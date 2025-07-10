"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function CuotasPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [form, setForm] = useState({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
  });
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setUsuarios);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setCuotas);
    }
  }, [token]);

  const handleSubmit = () => {
    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
      pagado: false,
      monto_pagado: 0,
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then(() => {
      window.location.reload();
    });
  };

  const handlePagarCuota = (cuotaId: number) => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuotaId}/pagar?monto_pagado=1000`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    ).then(() => window.location.reload());
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Cuotas Societarias</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 rounded ${
              activeTab === "form"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Registrar Cuota
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded ${
              activeTab === "list"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Listado de Cuotas
          </button>
        </div>

        {activeTab === "form" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Registrar Cuota</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={form.usuarioId}
                onChange={(e) =>
                  setForm({ ...form, usuarioId: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="">Seleccione Árbitro</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="border p-2 rounded"
                value={form.fecha}
                onChange={(e) =>
                  setForm({ ...form, fecha: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Monto"
                className="border p-2 rounded"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Registrar Cuota
            </button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Listado de Cuotas</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="p-2 border text-gray-900">ID</th>
                  <th className="p-2 border text-gray-900">Fecha</th>
                  <th className="p-2 border text-gray-900">Árbitro</th>
                  <th className="p-2 border text-gray-900">Monto</th>
                  <th className="p-2 border text-gray-900">Estado</th>
                  <th className="p-2 border text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{c.id}</td>
                    <td className="p-2 border">
                      {new Date(c.fecha).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      {c.usuario?.nombre || "Desconocido"}
                    </td>
                    <td className="p-2 border">${c.monto.toFixed(2)}</td>
                    <td className="p-2 border">
                      {c.pagado ? "Pagada" : "Pendiente"}
                    </td>
                    <td className="p-2 border">
                      {!c.pagado && (
                        <button
                          onClick={() => handlePagarCuota(c.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
