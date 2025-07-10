"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function PagosPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
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

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setPagos);
    }
  }, [token]);

  const handleSubmit = () => {
    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
      descripcion: form.descripcion,
      tipo_documento: "orden_pago",
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos`, {
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
        <h1 className="text-3xl font-bold mb-6">Pagos</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 rounded ${
              activeTab === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Registrar Pago
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded ${
              activeTab === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Listado de Pagos
          </button>
        </div>

        {activeTab === "form" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Registrar Pago</h2>
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
                onChange={(e) =>
                  setForm({ ...form, monto: e.target.value })
                }
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
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Registrar
            </button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Listado de Pagos</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 border text-gray-900">ID</th>
                  <th className="p-2 border text-gray-900">Fecha</th>
                  <th className="p-2 border text-gray-900">Árbitro</th>
                  <th className="p-2 border text-gray-900">Monto</th>
                  <th className="p-2 border text-gray-900">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{p.id}</td>
                    <td className="p-2 border">
                      {new Date(p.fecha).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      {p.usuario?.nombre || "Desconocido"}
                    </td>
                    <td className="p-2 border">${p.monto.toFixed(2)}</td>
                    <td className="p-2 border">{p.descripcion}</td>
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
