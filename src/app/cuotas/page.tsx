"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Usuario, Cuota } from "@/lib/types";
import {
  Receipt,
  PlusCircle,
  ListFilter,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  CreditCard,
  FileDown,
  Mail,
  Users,
  Send,
  Check,
} from "lucide-react";

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

interface EstadoCobro {
  [usuarioId: number]: {
    monto: string;
    pagando: boolean;
  };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function mesAnioActual() {
  const hoy = new Date();
  return { mes: hoy.getMonth(), anio: hoy.getFullYear() };
}

export default function CuotasPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"form" | "list" | "search" | "cobro">("form");
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

  const [pagoForm, setPagoForm] = useState<PagoForm>({ cuotaId: 0, montoPagado: "" });
  const [token, setToken] = useState<string | null>(null);

  const { mes: mesHoy, anio: anioHoy } = mesAnioActual();
  const [mesCobro, setMesCobro] = useState(mesHoy);
  const [anioCobro, setAnioCobro] = useState(anioHoy);
  const [montoGlobal, setMontoGlobal] = useState("5000");
  const [estadoCobro, setEstadoCobro] = useState<EstadoCobro>({});
  const [guardando, setGuardando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const fetchData = useCallback((tkn: string) => {
    apiGet<Usuario[]>("/usuarios", tkn)
      .then((data) => setUsuarios(data.sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(() => {});
    apiGet<Cuota[]>("/cuotas", tkn)
      .then(setCuotas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken);
    }
  }, [fetchData]);

  useEffect(() => {
    if (!usuarios.length) return;
    const inicial: EstadoCobro = {};
    usuarios.forEach((u) => {
      inicial[u.id] = { monto: montoGlobal, pagando: false };
    });
    setEstadoCobro(inicial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, mesCobro, anioCobro]);

  function cuotaDelMes(usuarioId: number): Cuota | undefined {
    return cuotas.find((c) => {
      const iso = c.fecha.includes("T") ? c.fecha.split("T")[0] : c.fecha;
      const [year, month] = iso.split("-").map(Number);
      return (
        c.usuario_id === usuarioId &&
        month - 1 === mesCobro &&
        year === anioCobro
      );
    });
  }

  function togglePagando(usuarioId: number) {
    setEstadoCobro((prev) => ({
      ...prev,
      [usuarioId]: { ...prev[usuarioId], pagando: !prev[usuarioId]?.pagando },
    }));
  }

  function setMontoCobro(usuarioId: number, valor: string) {
    setEstadoCobro((prev) => ({
      ...prev,
      [usuarioId]: { ...prev[usuarioId], monto: valor },
    }));
  }

  function aplicarMontoGlobal(valor: string) {
    setMontoGlobal(valor);
    setEstadoCobro((prev) => {
      const nuevo = { ...prev };
      Object.keys(nuevo).forEach((id) => {
        nuevo[Number(id)] = { ...nuevo[Number(id)], monto: valor };
      });
      return nuevo;
    });
  }

  function marcarTodos() {
    setEstadoCobro((prev) => {
      const nuevo = { ...prev };
      Object.keys(nuevo).forEach((id) => {
        const cuota = cuotaDelMes(Number(id));
        if (!cuota?.pagado) {
          nuevo[Number(id)] = { ...nuevo[Number(id)], pagando: true };
        }
      });
      return nuevo;
    });
  }

  async function handleGuardarCobro() {
    if (!token) return;

    const aProcesar = usuarios.filter((u) => estadoCobro[u.id]?.pagando);
    if (!aProcesar.length) {
      toast("No marcaste a ningún árbitro para cobrar.", "error");
      return;
    }

    setGuardando(true);
    const errores: string[] = [];
    const fechaCobro = `${anioCobro}-${String(mesCobro + 1).padStart(2, "0")}-01`;

    for (const usuario of aProcesar) {
      const monto = parseFloat(estadoCobro[usuario.id]?.monto || "0");
      if (!monto || monto <= 0) {
        errores.push(`${usuario.nombre}: monto inválido`);
        continue;
      }

      const cuotaExistente = cuotaDelMes(usuario.id);

      try {
        let cuotaId: number | null = null;

        if (cuotaExistente && !cuotaExistente.pagado) {
          await apiPut(
            `/cuotas/${cuotaExistente.id}/pagar?monto_pagado=${monto}`,
            token
          );
          cuotaId = cuotaExistente.id;
        } else if (!cuotaExistente) {
          const nuevaCuota = await apiPost<Cuota>(
            "/cuotas?no_generar_movimiento=true",
            token,
            {
              usuario_id: usuario.id,
              fecha: fechaCobro,
              monto,
              pagado: false,
              monto_pagado: 0,
            }
          );
          await apiPut(
            `/cuotas/${nuevaCuota.id}/pagar?monto_pagado=${monto}`,
            token
          );
          cuotaId = nuevaCuota.id;
        }

        if (cuotaId && usuario.email) {
          await apiPost(
            `/cuotas/${cuotaId}/reenviar-recibo?email=${encodeURIComponent(usuario.email)}`,
            token
          ).catch(() => {});
        }
      } catch (e) {
        errores.push(`${usuario.nombre}: ${e instanceof ApiError ? e.message : "error de conexión"}`);
      }
    }

    setGuardando(false);
    fetchData(token);

    setEstadoCobro((prev) => {
      const nuevo = { ...prev };
      aProcesar.forEach((u) => {
        if (!errores.some((e) => e.startsWith(u.nombre))) {
          nuevo[u.id] = { ...nuevo[u.id], pagando: false };
        }
      });
      return nuevo;
    });

    if (errores.length) {
      toast(`Completado con errores:\n${errores.join("\n")}`, "error");
    } else {
      toast(`${aProcesar.length} cobro(s) registrado(s) correctamente.`, "success");
    }
  }

  async function handleReenviarEmails() {
    if (!token) return;
    const pagadosEsteMes = usuarios.filter((u) => cuotaDelMes(u.id)?.pagado && u.email);
    if (!pagadosEsteMes.length) {
      toast("No hay árbitros con cuota pagada y email registrado este mes.", "info");
      return;
    }
    setReenviando(true);
    let enviados = 0;
    let errores = 0;
    for (const usuario of pagadosEsteMes) {
      const cuota = cuotaDelMes(usuario.id)!;
      try {
        await apiPost(
          `/cuotas/${cuota.id}/reenviar-recibo?email=${encodeURIComponent(usuario.email!)}`,
          token
        );
        enviados++;
      } catch {
        errores++;
      }
    }
    setReenviando(false);
    if (errores > 0) {
      toast(`Enviados: ${enviados} — Fallidos: ${errores}`, "error");
    } else {
      toast(`${enviados} email(s) enviado(s) correctamente.`, "success");
    }
  }

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.usuarioId) return toast("Por favor seleccione un árbitro", "error");
    if (!form.monto || parseFloat(form.monto) <= 0) return toast("El monto debe ser mayor a cero", "error");

    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
    };

    try {
      if (editingId) {
        await apiPut(`/cuotas/${editingId}`, token, payload);
      } else {
        await apiPost("/cuotas", token, payload);
      }
      setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
      setEditingId(null);
      fetchData(token);
      toast(editingId ? "Cuota actualizada correctamente" : "Cuota registrada exitosamente", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "No se pudo guardar la cuota", "error");
    }
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

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Estás seguro de eliminar esta cuota?")) return;

    try {
      await apiDelete(`/cuotas/${id}`, token);
      fetchData(token);
      setSelectedCuota(null);
      toast("Cuota eliminada correctamente", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error desconocido", "error");
    }
  };

  const handlePagarCuota = async (cuotaId: number, montoPagado?: number) => {
    if (!token) return;
    const monto = montoPagado ?? parseFloat(pagoForm.montoPagado);
    if (!monto || monto <= 0) return toast("Por favor ingrese un monto válido", "error");

    try {
      await apiPut(`/cuotas/${cuotaId}/pagar?monto_pagado=${monto}`, token);
      fetchData(token);
      setPagoForm({ cuotaId: 0, montoPagado: "" });
      toast("Pago registrado correctamente", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error desconocido", "error");
    }
  };

  const handleMarcarPagada = (id: number) => {
    if (confirm("¿Marcar esta cuota como pagada completamente?")) {
      const cuota = cuotas.find((c) => c.id === id);
      if (cuota) handlePagarCuota(id, cuota.monto);
    }
  };

  const handleGenerateRecibo = async (id: number) => {
    if (!token) return;
    try {
      const { apiGetPdf } = await import("@/lib/api");
      const { downloadBlob } = await import("@/lib/utils");
      const blob = await apiGetPdf(`/cuotas/${id}/generar-recibo`, token);
      downloadBlob(blob, `recibo_cuota_${id}.pdf`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error de conexión al generar el PDF", "error");
    }
  };

  const handleSendEmail = (cuota: Cuota) => {
    if (!token) return;
    const email = cuota.usuario?.email || prompt("Ingrese el email de destino:");
    if (!email) return;

    if (confirm(`¿Desea enviar el recibo al email:\n${email}?`)) {
      apiPost<{ success: boolean; message: string }>(
        `/cuotas/${cuota.id}/reenviar-recibo?email=${email}`,
        token
      )
        .then((data) => {
          if (data.success) toast(`Recibo enviado exitosamente a:\n${email}`, "success");
          else toast(`No se pudo enviar: ${data.message}`, "error");
        })
        .catch(() => toast("Error al enviar el recibo", "error"));
    }
  };

  const handleSearchByUser = () => {
    if (!searchForm.usuarioId) return toast("Por favor seleccione un árbitro", "error");
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

  const pagadosEsteMes = usuarios.filter((u) => cuotaDelMes(u.id)?.pagado).length;
  const pendientesEsteMes = usuarios.length - pagadosEsteMes;
  const marcadosParaCobrar = usuarios.filter((u) => estadoCobro[u.id]?.pagando).length;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />

      <main className="flex-1 min-w-0 w-full pt-16 px-4 pb-8 lg:pt-8 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cuotas Societarias</h1>
            <p className="text-sm text-slate-500">Gestión de pagos, cobros masivos y recibos</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/70 p-1.5 rounded-xl">
          {[
            { id: "form", label: editingId ? "Editar Cuota" : "Registrar Cuota", icon: PlusCircle },
            { id: "list", label: "Listado General", icon: ListFilter },
            { id: "search", label: "Buscar Árbitro", icon: Search },
            { id: "cobro", label: "Cobro Mensual", icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "form" && activeTab !== "form") {
                    setEditingId(null);
                    setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
                  }
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: FORMULARIO REGISTRO/EDICION */}
        {activeTab === "form" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:p-6 max-w-3xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PlusCircle className="text-slate-700" size={20} />
              {editingId ? "Editar Cuota Existente" : "Registrar Nueva Cuota"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Árbitro</label>
                <select
                  value={form.usuarioId}
                  onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  <option value="">Seleccione Árbitro</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Monto ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmit}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
              >
                {editingId ? "Actualizar Cuota" : "Guardar Cuota"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LISTADO GENERAL */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-base">Listado Completo de Cuotas</h2>
              <span className="text-xs text-slate-500 font-medium">{cuotas.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-medium text-xs">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3 whitespace-nowrap">Fecha</th>
                    <th className="px-3 py-3">Árbitro</th>
                    <th className="px-3 py-3 text-right">Monto</th>
                    <th className="px-3 py-3 text-right">Pagado</th>
                    <th className="px-3 py-3 text-right">Pendiente</th>
                    <th className="px-3 py-3 text-center">Estado</th>
                    <th className="px-3 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cuotas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No hay cuotas registradas.
                      </td>
                    </tr>
                  ) : (
                    cuotas.map((c, idx) => {
                      const pendiente = c.monto - (c.monto_pagado || 0);
                      return (
                        <tr
                          key={c.id}
                          className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/80"}
                        >
                          <td className="px-3 py-2.5 font-mono text-slate-400">#{c.id}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(c.fecha)}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{c.usuario?.nombre || "Desconocido"}</td>
                          <td className="px-3 py-2.5 text-right font-medium">${c.monto.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">${(c.monto_pagado || 0).toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-rose-600 font-medium">${pendiente.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                c.pagado
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {c.pagado ? "Pagada" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(c)}
                                title="Editar"
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                title="Eliminar"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 size={15} />
                              </button>
                              {!c.pagado && (
                                <button
                                  onClick={() => handleMarcarPagada(c.id)}
                                  title="Pagar totalmente"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <CreditCard size={15} />
                                </button>
                              )}
                              {c.pagado && (
                                <button
                                  onClick={() => handleGenerateRecibo(c.id)}
                                  title="Descargar PDF"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <FileDown size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totales Resumen Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-right font-bold text-xs sm:text-sm">
              <div className="text-slate-700">Total Cuotas: ${totalCuotas.toFixed(2)}</div>
              <div className="text-emerald-600">Total Pagado: ${totalPagado.toFixed(2)}</div>
              <div className="text-rose-600">Total Pendiente: ${totalPendiente.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* TAB 3: BUSCAR CUOTAS */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Search size={18} /> Buscar Cuotas por Árbitro y Rango
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Árbitro</label>
                  <select
                    value={searchForm.usuarioId}
                    onChange={(e) => setSearchForm({ ...searchForm, usuarioId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={searchForm.desde}
                    onChange={(e) => setSearchForm({ ...searchForm, desde: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={searchForm.hasta}
                    onChange={(e) => setSearchForm({ ...searchForm, hasta: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  />
                </div>

                <button
                  onClick={handleSearchByUser}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Buscar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Resultados de la búsqueda</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-medium text-xs">
                      <th className="px-3 py-3">ID</th>
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Árbitro</th>
                      <th className="px-3 py-3 text-right">Monto</th>
                      <th className="px-3 py-3 text-right">Pagado</th>
                      <th className="px-3 py-3 text-right">Pendiente</th>
                      <th className="px-3 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cuotasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No hay resultados para la búsqueda realizada.
                        </td>
                      </tr>
                    ) : (
                      cuotasFiltradas.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCuota(c)}
                          className={`cursor-pointer transition-colors ${
                            selectedCuota?.id === c.id ? "bg-slate-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-2.5 font-mono text-slate-400">#{c.id}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(c.fecha)}</td>
                          <td className="px-3 py-2.5 font-medium">{c.usuario?.nombre || "Desconocido"}</td>
                          <td className="px-3 py-2.5 text-right">${c.monto.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600">${(c.monto_pagado || 0).toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-rose-600">
                            ${(c.monto - (c.monto_pagado || 0)).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                c.pagado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {c.pagado ? "Pagada" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {selectedCuota && (
                <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs uppercase mb-3">
                    Acciones para la cuota #{selectedCuota.id} ({selectedCuota.usuario?.nombre})
                  </h3>

                  {!selectedCuota.pagado && (
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        placeholder="Monto parcial a pagar"
                        value={pagoForm.montoPagado}
                        onChange={(e) => setPagoForm({ ...pagoForm, montoPagado: e.target.value })}
                        className="border border-slate-300 rounded-lg p-2 text-sm bg-white flex-1"
                      />
                      <button
                        onClick={() => handlePagarCuota(selectedCuota.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Registrar Pago
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(selectedCuota)}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCuota.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      Eliminar
                    </button>
                    {!selectedCuota.pagado && (
                      <button
                        onClick={() => handleMarcarPagada(selectedCuota.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        Marcar Completa
                      </button>
                    )}
                    {selectedCuota.pagado && (
                      <>
                        <button
                          onClick={() => handleGenerateRecibo(selectedCuota.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                        >
                          <FileDown size={14} /> Descargar PDF
                        </button>
                        <button
                          onClick={() => handleSendEmail(selectedCuota)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Mail size={14} /> Enviar Email
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COBRO MENSUAL */}
        {activeTab === "cobro" && (
          <div className="space-y-6">
            {/* Controles del cobro */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Cobro Mensual Masivo</h2>
              <p className="text-xs text-slate-500 mb-4">
                Seleccioná mes, monto e indicá qué árbitros cancelaron su cuota.
              </p>

              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                  <select
                    value={mesCobro}
                    onChange={(e) => setMesCobro(Number(e.target.value))}
                    className="border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                  <select
                    value={anioCobro}
                    onChange={(e) => setAnioCobro(Number(e.target.value))}
                    className="border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    {[anioHoy - 1, anioHoy, anioHoy + 1].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monto general ($)</label>
                  <input
                    type="number"
                    value={montoGlobal}
                    onChange={(e) => aplicarMontoGlobal(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-sm bg-white w-28 text-center"
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={marcarTodos}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 px-3 rounded-lg text-xs sm:text-sm"
                  >
                    Marcar todos
                  </button>
                  <button
                    onClick={handleGuardarCobro}
                    disabled={guardando || marcadosParaCobrar === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs sm:text-sm inline-flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    {guardando ? "Guardando..." : `Guardar Cobros (${marcadosParaCobrar})`}
                  </button>
                  <button
                    onClick={handleReenviarEmails}
                    disabled={reenviando || pagadosEsteMes === 0}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs sm:text-sm inline-flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    {reenviando ? "Enviando..." : `Reenviar recibos (${pagadosEsteMes})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Árbitros</p>
                  <p className="text-xl font-bold text-slate-900">{usuarios.length}</p>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                  <Users size={20} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Pagaron este mes</p>
                  <p className="text-xl font-bold text-emerald-600">{pagadosEsteMes}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Pendientes</p>
                  <p className="text-xl font-bold text-rose-600">{pendientesEsteMes}</p>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                  <AlertCircle size={20} />
                </div>
              </div>
            </div>

            {/* Tabla del mes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {MESES[mesCobro]} {anioCobro}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-medium text-xs">
                      <th className="px-4 py-3">Árbitro</th>
                      <th className="px-4 py-3 text-center">Estado del mes</th>
                      <th className="px-4 py-3 text-center">Monto ($)</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {usuarios.map((u, idx) => {
                      const cuota = cuotaDelMes(u.id);
                      const yaPagado = cuota?.pagado ?? false;
                      const marcado = estadoCobro[u.id]?.pagando ?? false;
                      const monto = estadoCobro[u.id]?.monto ?? montoGlobal;

                      return (
                        <tr
                          key={u.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                          <td className="px-4 py-3 text-center">
                            {yaPagado ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                Pagado
                              </span>
                            ) : cuota ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                                Sin pagar
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                Sin cuota
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {yaPagado ? (
                              <span className="text-emerald-700 font-semibold font-mono">
                                ${(cuota?.monto_pagado ?? cuota?.monto ?? 0).toFixed(2)}
                              </span>
                            ) : (
                              <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMontoCobro(u.id, e.target.value)}
                                className="border border-slate-300 rounded px-2 py-1 w-24 text-center text-xs"
                                disabled={yaPagado}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {yaPagado ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <button
                                onClick={() => togglePagando(u.id)}
                                className={`py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                  marcado
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                }`}
                              >
                                {marcado ? "✓ Marcado" : "Marcar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {usuarios.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">No hay árbitros registrados.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}