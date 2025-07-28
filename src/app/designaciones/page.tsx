"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DesignacionesPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [designaciones, setDesignaciones] = useState<any[]>([]);
  const [form, setForm] = useState({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    partido: "",
    categoriaId: "",
    arbitros: [""],
  });

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (token) {
      // ✅ Cargar usuarios
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setUsuarios);

      // ✅ Cargar categorías
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setCategorias);

      // ✅ Cargar designaciones (si ya existe endpoint)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/designaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setDesignaciones);
    }
  }, [token]);

  const handleArbitroChange = (index: number, value: string) => {
    const nuevos = [...form.arbitros];
    nuevos[index] = value;
    setForm({ ...form, arbitros: nuevos });
  };

  const addArbitro = () => {
    setForm({ ...form, arbitros: [...form.arbitros, ""] });
  };

  const handleSubmit = () => {
    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      partido: form.partido,
      categoria_id: Number(form.categoriaId),
      arbitros: form.arbitros.filter((a) => a.trim() !== ""),
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/designaciones`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then(() => {
      window.location.reload(); // Actualizamos lista
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Designaciones</h1>

        <div className="bg-gray-50 p-6 rounded shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Nueva Designación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Árbitro */}
            <select
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">Seleccione Árbitro</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>

            {/* Fecha */}
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="border p-2 rounded"
            />

            {/* Partido */}
            <input
              type="text"
              placeholder="Partido"
              value={form.partido}
              onChange={(e) => setForm({ ...form, partido: e.target.value })}
              className="border p-2 rounded"
            />

            {/* Categoría */}
            <select
              value={form.categoriaId}
              onChange={(e) =>
                setForm({ ...form, categoriaId: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option value="">Seleccione Categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Árbitros adicionales */}
          <div className="mt-4">
            <label className="block mb-2 font-semibold">
              Árbitros asistentes:
            </label>
            {form.arbitros.map((arb, i) => (
              <input
                key={i}
                type="text"
                value={arb}
                onChange={(e) => handleArbitroChange(i, e.target.value)}
                placeholder={`Árbitro ${i + 1}`}
                className="border p-2 rounded mb-2 w-full"
              />
            ))}
            <button
              type="button"
              onClick={addArbitro}
              className="text-blue-600 text-sm"
            >
              + Agregar Árbitro
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Guardar Designación
          </button>
        </div>

        {/* Tabla de Designaciones */}
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Listado de Designaciones</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2 border">Fecha</th>
                <th className="p-2 border">Partido</th>
                <th className="p-2 border">Árbitro</th>
                <th className="p-2 border">Categoría</th>
                <th className="p-2 border">Asistentes</th>
              </tr>
            </thead>
            {/* <tbody>
              {designaciones.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-100">
                  <td className="p-2 border">
                    {new Date(d.fecha).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">{d.partido}</td>
                  <td className="p-2 border">{d.usuario?.nombre}</td>
                  <td className="p-2 border">{d.categoria?.nombre}</td>
                  <td className="p-2 border">{d.arbitros?.join(", ")}</td>
                </tr>
              ))}
            </tbody> */}
          </table>
        </div>
      </main>
    </div>
  );
}
