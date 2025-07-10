"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

type Retencion = {
  id: number;
  nombre: string;
  monto: number;
};

export default function ImportesPage() {
  const [retenciones, setRetenciones] = useState<Retencion[]>([]);
  const [form, setForm] = useState({ nombre: "", monto: "" });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setToken(token);
    if (token) {
      fetchRetenciones(token);
    }
  }, []);

  const fetchRetenciones = (token: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/retenciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRetenciones(data))
      .catch(console.error);
  };

  const handleSubmit = () => {
    if (!token) return;

    const payload = {
      nombre: form.nombre,
      monto: Number(form.monto),
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/retenciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(() => {
        fetchRetenciones(token);
        setForm({ nombre: "", monto: "" });
      })
      .catch(console.error);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Importes</h1>

        <div className="bg-white rounded shadow p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">Registrar Retención</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nombre"
              className="border p-2 rounded"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSubmit}
          >
            Registrar Retención
          </button>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Listado de Retenciones</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">ID</th>
                <th className="text-left p-2 border">Nombre</th>
                <th className="text-left p-2 border">Monto</th>
              </tr>
            </thead>
            <tbody>
              {retenciones.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{r.id}</td>
                  <td className="p-2 border">{r.nombre}</td>
                  <td className="p-2 border">${r.monto?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
