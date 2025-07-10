"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function CobranzasPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cobranzas, setCobranzas] = useState<any[]>([]);
  const [form, setForm] = useState({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
    descripcion: "",
  });
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setUsuarios);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cobranzas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setCobranzas);
    }
  }, [token]);

  const handleSubmit = () => {
    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
      descripcion: form.descripcion,
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cobranzas`, {
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Cobranzas</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 rounded ${
              activeTab === "form"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Registrar Cobranza
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded ${
              activeTab === "list"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Listado de Cobranzas
          </button>
        </div>

        {activeTab === "form" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Registrar Cobranza</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <input
                type="text"
                placeholder="Descripción"
                className="border p-2 rounded"
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </div>
            <button
              onClick={handleSubmit}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Registrar
            </button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Listado de Cobranzas</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="p-2 border text-gray-900">ID</th>
                  <th className="p-2 border text-gray-900">Fecha</th>
                  <th className="p-2 border text-gray-900">Árbitro</th>
                  <th className="p-2 border text-gray-900">Monto</th>
                  <th className="p-2 border text-gray-900">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {cobranzas.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{c.id}</td>
                    <td className="p-2 border">
                      {new Date(c.fecha).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      {c.usuario?.nombre || "Desconocido"}
                    </td>
                    <td className="p-2 border">${c.monto.toFixed(2)}</td>
                    <td className="p-2 border">{c.descripcion}</td>
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
