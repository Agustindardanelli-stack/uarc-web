"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

interface Usuario {
  id: number;
  nombre: string;
  email?: string;
}

interface Cuota {
  id: number;
  usuario_id: number;
  fecha: string;
  monto: number;
  pagado: boolean;
  monto_pagado?: number;
  usuario?: Usuario;
}

interface Form {
  usuarioId: string;
  fecha: string;
  monto: string;
}

interface SearchForm {
  usuarioId: string;
  desde: string;
  hasta: string;
}

interface PagoForm {
  cuotaId: number;
  montoPagado: string;
}

export default function CuotasPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list" | "search">("form");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [cuotasFiltradas, setCuotasFiltradas] = useState<Cuota[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [form, setForm] = useState<Form>({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
  });
  const [searchForm, setSearchForm] = useState<SearchForm>({
    usuarioId: "",
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    hasta: new Date().toISOString().slice(0, 10),
  });
  const [pagoForm, setPagoForm] = useState<PagoForm>({
    cuotaId: 0,
    montoPagado: "",
  });
  const [token, setToken] = useState<string | null>(null);

  const fetchData = useCallback((tkn: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
      .then((res) => res.json())
      .then((data: Usuario[]) =>
        setUsuarios(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
      );

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
      .then((res) => res.json())
      .then((data: Cuota[]) => setCuotas(data));
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken);
    }
  }, [fetchData]);

  const handleSubmit = () => {
    if (!token) return;
    if (!form.usuarioId) {
      alert("Por favor seleccione un árbitro");
      return;
    }
    if (!form.monto || parseFloat(form.monto) <= 0) {
      alert("El monto debe ser mayor a cero");
      return;
    }

    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
      pagado: false,
      monto_pagado: 0,
    };

    const url = editingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/cuotas`;

    const method = editingId ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then((res) => {
      if (res.ok) {
        setForm({
          usuarioId: "",
          fecha: new Date().toISOString().slice(0, 10),
          monto: "",
        });
        setEditingId(null);
        fetchData(token);
        alert(editingId ? "Cuota actualizada correctamente" : "Cuota registrada exitosamente");
      }
    });
  };

  const handleEdit = (cuota: Cuota) => {
    setForm({
      usuarioId: cuota.usuario_id.toString(),
      fecha: cuota.fecha,
      monto: cuota.monto.toString(),
    });
    setEditingId(cuota.id);
    setActiveTab("form");
  };

  const handleDelete = (id: number) => {
    if (!token) return;
    if (confirm("¿Estás seguro de eliminar esta cuota?")) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        fetchData(token);
        setSelectedCuota(null);
        alert("Cuota eliminada correctamente");
      });
    }
  };

  const handlePagarCuota = (cuotaId: number, montoPagado?: number) => {
    if (!token) return;
    const monto = montoPagado || parseFloat(pagoForm.montoPagado);

    if (!monto || monto <= 0) {
      alert("Por favor ingrese un monto válido");
      return;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuotaId}/pagar?monto_pagado=${monto}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    ).then((res) => {
      if (res.ok) {
        fetchData(token);
        setPagoForm({ cuotaId: 0, montoPagado: "" });
        alert("Pago registrado correctamente");
      }
    });
  };

  const handleMarcarPagada = (id: number) => {
    if (confirm("¿Marcar esta cuota como pagada completamente?")) {
      const cuota = cuotas.find((c) => c.id === id);
      if (cuota) {
        handlePagarCuota(id, cuota.monto);
      }
    }
  };

  const handleGenerateRecibo = (id: number) => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas/${id}/generar-recibo`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recibo_cuota_${id}.pdf`;
        a.click();
      });
  };

  const handleSendEmail = (cuota: Cuota) => {
    if (!token) return;
    const email = cuota.usuario?.email || prompt("Ingrese el email de destino:");
    if (!email) return;

    if (confirm(`¿Desea enviar el recibo al email:\n${email}?`)) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuota.id}/enviar-recibo?email=${email}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => res.json())
        .then((data: { success: boolean; message: string }) => {
          if (data.success) {
            alert(`Recibo enviado exitosamente a:\n${email}`);
          } else {
            alert(`No se pudo enviar: ${data.message}`);
          }
        });
    }
  };

  const handleSearchByUser = () => {
    if (!searchForm.usuarioId) {
      alert("Por favor seleccione un árbitro");
      return;
    }

    const filtered = cuotas.filter((c) => {
      const matchUser = c.usuario_id === Number(searchForm.usuarioId);
      const matchDate = c.fecha >= searchForm.desde && c.fecha <= searchForm.hasta;
      return matchUser && matchDate;
    });

    setCuotasFiltradas(filtered);
    setSelectedCuota(null);
  };

  const totalCuotas = cuotas.reduce((sum, c) => sum + c.monto, 0);
  const totalPagado = cuotas.reduce((sum, c) => sum + (c.monto_pagado || 0), 0);
  const totalPendiente = totalCuotas - totalPagado;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Cuotas Societarias</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
              setActiveTab("form");
              setEditingId(null);
              setForm({
                usuarioId: "",
                fecha: new Date().toISOString().slice(0, 10),
                monto: "",
              });
            }}
            className={`px-4 py-2 rounded ${
              activeTab === "form" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {editingId ? "Editar Cuota" : "Registrar Cuota"}
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded ${
              activeTab === "list" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Listado de Cuotas
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded ${
              activeTab === "search" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Buscar Cuotas
          </button>
        </div>

        {activeTab === "form" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Editar Cuota" : "Registrar Cuota"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <input
                type="date"
                className="border p-2 rounded"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
              <input
                type="number"
                placeholder="Monto"
                className="border p-2 rounded"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {editingId ? "Actualizar" : "Registrar Cuota"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      usuarioId: "",
                      fecha: new Date().toISOString().slice(0, 10),
                      monto: "",
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
              )}
            </div>
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
                  <th className="p-2 border text-gray-900">Pagado</th>
                  <th className="p-2 border text-gray-900">Pendiente</th>
                  <th className="p-2 border text-gray-900">Estado</th>
                  <th className="p-2 border text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{c.id}</td>
                    <td className="p-2 border">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="p-2 border">{c.usuario?.nombre || "Desconocido"}</td>
                    <td className="p-2 border">${c.monto.toFixed(2)}</td>
                    <td className="p-2 border">${(c.monto_pagado || 0).toFixed(2)}</td>
                    <td className="p-2 border">${(c.monto - (c.monto_pagado || 0)).toFixed(2)}</td>
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          c.pagado
                            ? "bg-green-200 text-green-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {c.pagado ? "Pagada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="p-2 border">
                      <div className="flex space-x-1 justify-center">
                        <button
                          onClick={() => handleEdit(c)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
                        >
                          Eliminar
                        </button>
                        {!c.pagado && (
                          <button
                            onClick={() => handleMarcarPagada(c.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                          >
                            Pagar
                          </button>
                        )}
                        {c.pagado && (
                          <button
                            onClick={() => handleGenerateRecibo(c.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 grid grid-cols-3 gap-4 text-right font-bold">
              <div>Total Cuotas: ${totalCuotas.toFixed(2)}</div>
              <div className="text-green-600">Total Pagado: ${totalPagado.toFixed(2)}</div>
              <div className="text-red-600">Total Pendiente: ${totalPendiente.toFixed(2)}</div>
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Buscar Cuotas por Árbitro</h2>
              <div className="flex space-x-4 items-end">
                <div className="flex-1">
                  <label className="block mb-2 font-semibold">Árbitro:</label>
                  <select
                    value={searchForm.usuarioId}
                    onChange={(e) =>
                      setSearchForm({ ...searchForm, usuarioId: e.target.value })
                    }
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Desde:</label>
                  <input
                    type="date"
                    value={searchForm.desde}
                    onChange={(e) => setSearchForm({ ...searchForm, desde: e.target.value })}
                    className="border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Hasta:</label>
                  <input
                    type="date"
                    value={searchForm.hasta}
                    onChange={(e) => setSearchForm({ ...searchForm, hasta: e.target.value })}
                    className="border p-2 rounded"
                  />
                </div>
                <button
                  onClick={handleSearchByUser}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  🔍 Buscar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">📋 Resultados</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="p-2 border text-gray-900">ID</th>
                    <th className="p-2 border text-gray-900">Fecha</th>
                    <th className="p-2 border text-gray-900">Árbitro</th>
                    <th className="p-2 border text-gray-900">Monto</th>
                    <th className="p-2 border text-gray-900">Pagado</th>
                    <th className="p-2 border text-gray-900">Pendiente</th>
                    <th className="p-2 border text-gray-900">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotasFiltradas.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCuota(c)}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedCuota?.id === c.id ? "bg-green-50" : ""
                      }`}
                    >
                      <td className="p-2 border">{c.id}</td>
                      <td className="p-2 border">{new Date(c.fecha).toLocaleDateString()}</td>
                      <td className="p-2 border">{c.usuario?.nombre || "Desconocido"}</td>
                      <td className="p-2 border">${c.monto.toFixed(2)}</td>
                      <td className="p-2 border">${(c.monto_pagado || 0).toFixed(2)}</td>
                      <td className="p-2 border">
                        ${(c.monto - (c.monto_pagado || 0)).toFixed(2)}
                      </td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            c.pagado
                              ? "bg-green-200 text-green-800"
                              : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          {c.pagado ? "Pagada" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedCuota && (
                <div className="mt-4">
                  {!selectedCuota.pagado && (
                    <div className="mb-4 p-4 bg-blue-50 rounded">
                      <h3 className="font-bold mb-2">Registrar Pago Parcial</h3>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Monto a pagar"
                          value={pagoForm.montoPagado}
                          onChange={(e) =>
                            setPagoForm({ ...pagoForm, montoPagado: e.target.value })
                          }
                          className="border p-2 rounded flex-1"
                        />
                        <button
                          onClick={() => handlePagarCuota(selectedCuota.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                          Registrar Pago
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(selectedCuota)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCuota.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                      🗑️ Eliminar
                    </button>
                    {!selectedCuota.pagado && (
                      <button
                        onClick={() => handleMarcarPagada(selectedCuota.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        💰 Marcar como Pagada
                      </button>
                    )}
                    {selectedCuota.pagado && (
                      <>
                        <button
                          onClick={() => handleGenerateRecibo(selectedCuota.id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
                        >
                          📄 Descargar Recibo
                        </button>
                        <button
                          onClick={() => handleSendEmail(selectedCuota)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                          📧 Enviar Email
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}