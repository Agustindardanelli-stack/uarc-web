"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, apiGetBlob, ApiError } from "@/lib/api";
import { formatDate, downloadBlob } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Usuario, Pago } from "@/lib/types";
import {
  FileText,
  List,
  Search,
  Save,
  X,
  Pencil,
  Trash2,
  Download,
  Mail,
  Receipt,
} from "lucide-react";

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

  const resetForm = () => {
    setForm({
      usuarioId: "",
      fecha: new Date().toISOString().slice(0, 10),
      monto: "",
      descripcion: "",
      numeroFactura: "",
      razonSocial: "",
    });
  };

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
      resetForm();
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

  const tabs: { id: "form" | "list" | "search"; label: string; icon: typeof FileText }[] = [
    { id: "form", label: editingId ? "Editar Pago" : "Registrar Pago", icon: FileText },
    { id: "list", label: "Listado de Pagos", icon: List },
    { id: "search", label: "Buscar Pagos", icon: Search },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />

      <main className="flex-1 min-w-0 w-full pt-16 px-4 pb-8 lg:pt-8 lg:px-8">

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Pagos</h1>
          <p className="text-sm text-slate-500">Órdenes de pago y facturas a árbitros</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-full sm:w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === "form" && !editingId) {
                  setTipoDocumento("orden_pago");
                  resetForm();
                }
              }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Formulario ── */}
        {activeTab === "form" && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingId ? "Editar Pago" : "Registrar Pago"}
            </h2>

            <div className="mb-5">
              <label className="text-xs font-medium text-slate-600 block mb-2">Tipo de Documento</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={tipoDocumento === "orden_pago"}
                    onChange={() => setTipoDocumento("orden_pago")}
                    className="accent-slate-900 w-4 h-4"
                  />
                  Orden de Pago
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={tipoDocumento === "factura"}
                    onChange={() => setTipoDocumento("factura")}
                    className="accent-slate-900 w-4 h-4"
                  />
                  Factura/Recibo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Árbitro</label>
                <select
                  value={form.usuarioId}
                  onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Seleccione Árbitro</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>

              {tipoDocumento === "factura" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Número de Factura</label>
                    <input
                      type="text"
                      placeholder="Número de Factura"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      value={form.numeroFactura}
                      onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Razón Social</label>
                    <input
                      type="text"
                      placeholder="Razón Social"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      value={form.razonSocial}
                      onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Monto</label>
                <input
                  type="number"
                  placeholder="Monto"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
              >
                <Save size={15} />
                {editingId
                  ? "Actualizar"
                  : `Registrar ${tipoDocumento === "factura" ? "Factura" : "Pago"}`}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTipoDocumento("orden_pago");
                    resetForm();
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
                >
                  <X size={15} />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Listado ── */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h2 className="font-semibold text-slate-900 text-base">Listado de Pagos</h2>
              <span className="text-xs text-slate-500 font-medium">{pagos.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="px-3 py-3 font-semibold">ID</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Fecha</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Tipo</th>
                    <th className="px-3 py-3 font-semibold min-w-[120px]">Árbitro</th>
                    <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Monto</th>
                    <th className="px-3 py-3 font-semibold min-w-[140px]">Descripción</th>
                    <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pagos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No hay pagos registrados.
                      </td>
                    </tr>
                  ) : (
                    pagos.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={
                          idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/50 hover:bg-slate-100/80"
                        }
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">#{p.id}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(p.fecha)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                          {p.tipo_documento === "factura" ? "Factura" : "Orden de Pago"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800 font-medium">{p.usuario?.nombre || "Desconocido"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                          ${p.monto.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{p.descripcion}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => handleEdit(p)}
                              title="Editar"
                              className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              title="Eliminar"
                              className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={() => handleGeneratePDF(p.id)}
                              title="PDF"
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="p-3 text-center text-xs text-slate-400 lg:hidden border-t border-slate-100">
              Deslizá horizontalmente para ver todas las columnas.
            </p>

            <div className="px-4 sm:px-5 py-4 border-t border-slate-200 bg-slate-50/50 text-right">
              <span className="text-sm font-bold text-slate-900">
                Total de pagos: ${totalPagos.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* ── Tab Buscar ── */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Buscar Pagos por Árbitro</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-end">
                <div className="lg:col-span-1">
                  <label className="block mb-1 text-xs font-medium text-slate-600">Árbitro</label>
                  <select
                    value={searchForm.usuarioId}
                    onChange={(e) => setSearchForm({ ...searchForm, usuarioId: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-600">Desde</label>
                  <input
                    type="date"
                    value={searchForm.desde}
                    onChange={(e) => setSearchForm({ ...searchForm, desde: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-600">Hasta</label>
                  <input
                    type="date"
                    value={searchForm.hasta}
                    onChange={(e) => setSearchForm({ ...searchForm, hasta: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  onClick={handleSearchByUser}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  <Search size={15} />
                  Buscar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 text-base">Resultados</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs">
                      <th className="px-3 py-3 font-semibold">ID</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Fecha</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Tipo</th>
                      <th className="px-3 py-3 font-semibold min-w-[120px]">Árbitro</th>
                      <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Monto</th>
                      <th className="px-3 py-3 font-semibold min-w-[140px]">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pagosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Sin resultados. Realizá una búsqueda.
                        </td>
                      </tr>
                    ) : (
                      pagosFiltrados.map((p, idx) => (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPago(p)}
                          className={`cursor-pointer transition-colors ${
                            selectedPago?.id === p.id
                              ? "bg-blue-50"
                              : idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-slate-50/50 hover:bg-slate-100/80"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">#{p.id}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(p.fecha)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                            {p.tipo_documento === "factura" ? "Factura" : "Orden de Pago"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 font-medium">{p.usuario?.nombre || "Desconocido"}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                            ${p.monto.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{p.descripcion}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {selectedPago && (
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(selectedPago)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPago.id)}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(selectedPago.id)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Receipt size={14} />
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => handleSendEmail(selectedPago)}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Mail size={14} />
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