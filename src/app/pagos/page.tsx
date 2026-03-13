"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

interface Usuario {
  id: number;
  nombre: string;
  email?: string;
}

interface Pago {
  id: number;
  usuario_id: number;
  fecha: string;
  monto: number;
  descripcion?: string;
  tipo_documento: "orden_pago" | "factura";
  numero_factura?: string;
  razon_social?: string;
  usuario?: Usuario;
}

interface Form {
  usuarioId: string;
  fecha: string;
  monto: string;
  descripcion: string;
  numeroFactura: string;
  razonSocial: string;
}

interface SearchForm {
  usuarioId: string;
  desde: string;
  hasta: string;
}

export default function PagosPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list" | "search">("form");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosFiltrados, setPagosFiltrados] = useState<Pago[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<"orden_pago" | "factura">("orden_pago");
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    monto: "",
    descripcion: "",
    numeroFactura: "",
    razonSocial: "",
  });
  const [searchForm, setSearchForm] = useState<SearchForm>({
    usuarioId: "",
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    hasta: new Date().toISOString().slice(0, 10),
  });

  const fetchData = useCallback((tkn: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
      .then((res) => res.json())
      .then((data: Usuario[]) =>
        setUsuarios(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
      );

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
      .then((res) => res.json())
      .then((data: Pago[]) => setPagos(data));
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
    if (tipoDocumento === "factura") {
      if (!form.numeroFactura.trim()) {
        alert("Por favor ingrese el número de factura");
        return;
      }
      if (!form.razonSocial.trim()) {
        alert("Por favor ingrese la razón social");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
      descripcion: form.descripcion,
      tipo_documento: tipoDocumento,
    };

    if (tipoDocumento === "factura") {
      payload.numero_factura = form.numeroFactura;
      payload.razon_social = form.razonSocial;
    }

    const url = editingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/pagos/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/pagos`;

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
          descripcion: "",
          numeroFactura: "",
          razonSocial: "",
        });
        setEditingId(null);
        setTipoDocumento("orden_pago");
        fetchData(token);
        alert(
          editingId
            ? "Pago actualizado correctamente"
            : `${tipoDocumento === "factura" ? "Factura" : "Pago"} registrado exitosamente`
        );
      }
    });
  };

  const handleEdit = (pago: Pago) => {
    setForm({
      usuarioId: pago.usuario_id.toString(),
      fecha: pago.fecha,
      monto: pago.monto.toString(),
      descripcion: pago.descripcion || "",
      numeroFactura: pago.numero_factura || "",
      razonSocial: pago.razon_social || "",
    });
    setTipoDocumento(pago.tipo_documento || "orden_pago");
    setEditingId(pago.id);
    setActiveTab("form");
  };

  const handleDelete = (id: number) => {
    if (!token) return;
    if (confirm("¿Estás seguro de eliminar este pago?")) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        fetchData(token);
        setSelectedPago(null);
      });
    }
  };

  const handleGeneratePDF = (id: number) => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/${id}/generar-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pago_${id}.pdf`;
        a.click();
      });
  };

  const handleSendEmail = (pago: Pago) => {
    if (!token) return;
    const email = pago.usuario?.email || prompt("Ingrese el email de destino:");
    if (!email) return;

    if (confirm(`¿Desea enviar el comprobante al email:\n${email}?`)) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/${pago.id}/reenviar-orden?email=${email}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => res.json())
        .then((data: { success: boolean; message: string }) => {
          if (data.success) {
            alert(`Comprobante enviado exitosamente a:\n${email}`);
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

    const filtered = pagos.filter((p) => {
      const matchUser = p.usuario_id === Number(searchForm.usuarioId);
      const matchDate = p.fecha >= searchForm.desde && p.fecha <= searchForm.hasta;
      return matchUser && matchDate;
    });

    setPagosFiltrados(filtered);
    setSelectedPago(null);
  };

  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Gestión de Pagos</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
              setActiveTab("form");
              setEditingId(null);
              setTipoDocumento("orden_pago");
              setForm({
                usuarioId: "",
                fecha: new Date().toISOString().slice(0, 10),
                monto: "",
                descripcion: "",
                numeroFactura: "",
                razonSocial: "",
              });
            }}
            className={`px-4 py-2 rounded ${
              activeTab === "form" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {editingId ? "Editar Pago" : "Registrar Pago"}
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded ${
              activeTab === "list" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Listado de Pagos
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded ${
              activeTab === "search" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Buscar Pagos
          </button>
        </div>

        {activeTab === "form" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Editar Pago" : "Registrar Pago"}
            </h2>

            <div className="mb-4">
              <label className="font-semibold block mb-2">Tipo de Documento:</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={tipoDocumento === "orden_pago"}
                    onChange={() => setTipoDocumento("orden_pago")}
                    className="mr-2"
                  />
                  Orden de Pago
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={tipoDocumento === "factura"}
                    onChange={() => setTipoDocumento("factura")}
                    className="mr-2"
                  />
                  Factura/Recibo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {tipoDocumento === "factura" && (
                <>
                  <input
                    type="text"
                    placeholder="Número de Factura"
                    className="border p-2 rounded"
                    value={form.numeroFactura}
                    onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Razón Social"
                    className="border p-2 rounded"
                    value={form.razonSocial}
                    onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                  />
                </>
              )}

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
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {editingId
                  ? "Actualizar"
                  : `Registrar ${tipoDocumento === "factura" ? "Factura" : "Pago"}`}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTipoDocumento("orden_pago");
                    setForm({
                      usuarioId: "",
                      fecha: new Date().toISOString().slice(0, 10),
                      monto: "",
                      descripcion: "",
                      numeroFactura: "",
                      razonSocial: "",
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
            <h2 className="text-xl font-bold mb-4">Listado de Pagos</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 border text-gray-900">ID</th>
                  <th className="p-2 border text-gray-900">Fecha</th>
                  <th className="p-2 border text-gray-900">Tipo</th>
                  <th className="p-2 border text-gray-900">Árbitro</th>
                  <th className="p-2 border text-gray-900">Monto</th>
                  <th className="p-2 border text-gray-900">Descripción</th>
                  <th className="p-2 border text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{p.id}</td>
                    <td className="p-2 border">{new Date(p.fecha).toLocaleDateString()}</td>
                    <td className="p-2 border">
                      {p.tipo_documento === "factura" ? "Factura" : "Orden de Pago"}
                    </td>
                    <td className="p-2 border">{p.usuario?.nombre || "Desconocido"}</td>
                    <td className="p-2 border">${p.monto.toFixed(2)}</td>
                    <td className="p-2 border">{p.descripcion}</td>
                    <td className="p-2 border">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEdit(p)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(p.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right font-bold">
              Total de pagos: ${totalPagos.toFixed(2)}
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Buscar Pagos por Árbitro</h2>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  🔍 Buscar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">📋 Resultados</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 border text-gray-900">ID</th>
                    <th className="p-2 border text-gray-900">Fecha</th>
                    <th className="p-2 border text-gray-900">Tipo</th>
                    <th className="p-2 border text-gray-900">Árbitro</th>
                    <th className="p-2 border text-gray-900">Monto</th>
                    <th className="p-2 border text-gray-900">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPago(p)}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedPago?.id === p.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="p-2 border">{p.id}</td>
                      <td className="p-2 border">{new Date(p.fecha).toLocaleDateString()}</td>
                      <td className="p-2 border">
                        {p.tipo_documento === "factura" ? "Factura" : "Orden de Pago"}
                      </td>
                      <td className="p-2 border">{p.usuario?.nombre || "Desconocido"}</td>
                      <td className="p-2 border">${p.monto.toFixed(2)}</td>
                      <td className="p-2 border">{p.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedPago && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(selectedPago)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPago.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(selectedPago.id)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
                  >
                    📄 Descargar PDF
                  </button>
                  <button
                    onClick={() => handleSendEmail(selectedPago)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    📧 Enviar Email
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}