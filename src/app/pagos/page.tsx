"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, apiGetBlob, ApiError } from "@/lib/api";
import { formatDate, downloadBlob } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Usuario, Pago } from "@/lib/types";

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
  const { toast } = useToast();
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
    apiGet<Usuario[]>("/usuarios", tkn)
      .then((data) => setUsuarios(data.sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(() => {});
    apiGet<Pago[]>("/pagos", tkn)
      .then(setPagos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken);
    }
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.usuarioId) return toast("Por favor seleccione un árbitro", "error");
    if (!form.monto || parseFloat(form.monto) <= 0) return toast("El monto debe ser mayor a cero", "error");
    if (tipoDocumento === "factura") {
      if (!form.numeroFactura.trim()) return toast("Por favor ingrese el número de factura", "error");
      if (!form.razonSocial.trim()) return toast("Por favor ingrese la razón social", "error");
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

    try {
      if (editingId) {
        await apiPut(`/pagos/${editingId}`, token, payload);
      } else {
        await apiPost("/pagos", token, payload);
      }
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
      toast(
        editingId
          ? "Pago actualizado correctamente"
          : `${tipoDocumento === "factura" ? "Factura" : "Pago"} registrado exitosamente`,
        "success"
      );
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al guardar el pago", "error");
    }
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

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Estás seguro de eliminar este pago?")) return;
    try {
      await apiDelete(`/pagos/${id}`, token);
      fetchData(token);
      setSelectedPago(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al eliminar el pago", "error");
    }
  };

  const handleGeneratePDF = async (id: number) => {
    if (!token) return;
    try {
      const blob = await apiGetBlob(`/pagos/${id}/generar-pdf`, token);
      downloadBlob(blob, `pago_${id}.pdf`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al generar el PDF", "error");
    }
  };

  const handleSendEmail = (pago: Pago) => {
    if (!token) return;
    const email = pago.usuario?.email || prompt("Ingrese el email de destino:");
    if (!email) return;

    if (confirm(`¿Desea enviar el comprobante al email:\n${email}?`)) {
      apiPost<{ success: boolean; message: string }>(
        `/pagos/${pago.id}/reenviar-orden?email=${email}`,
        token
      )
        .then((data) => {
          if (data.success) toast(`Comprobante enviado exitosamente a:\n${email}`, "success");
          else toast(`No se pudo enviar: ${data.message}`, "error");
        })
        .catch(() => toast("Error al enviar el comprobante", "error"));
    }
  };

  const handleSearchByUser = () => {
    if (!searchForm.usuarioId) return toast("Por favor seleccione un árbitro", "error");
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
                  <option key={u.id} value={u.id}>{u.nombre}</option>
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
                    <td className="p-2 border">{formatDate(p.fecha)}</td>
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
                    onChange={(e) => setSearchForm({ ...searchForm, usuarioId: e.target.value })}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
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
                  Buscar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Resultados</h2>
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
                      <td className="p-2 border">{formatDate(p.fecha)}</td>
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
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPago.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(selectedPago.id)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
                  >
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => handleSendEmail(selectedPago)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Enviar Email
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
