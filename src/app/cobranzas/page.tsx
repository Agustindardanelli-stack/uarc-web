"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Usuario, Retencion, Cobranza } from "@/lib/types";
import {
  FilePlus,
  List,
  Search,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

interface FormRegistro {
  usuarioId: string;
  fecha: string;
  numeroFactura: string;
  razonSocial: string;
  retencionId: string;
  monto: string;
  descripcion: string;
}

interface FormEdicion {
  fecha: string;
  tipoDocumento: string;
  numeroFactura: string;
  razonSocial: string;
  monto: string;
  descripcion: string;
}

export default function CobranzasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"registrar" | "listar" | "buscar">("registrar");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [retenciones, setRetenciones] = useState<Retencion[]>([]);
  const [cobranzas, setCobranzas] = useState<Cobranza[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [tipoDocumento, setTipoDocumento] = useState<"recibo" | "factura">("recibo");
  const [formRegistro, setFormRegistro] = useState<FormRegistro>({
    usuarioId: "",
    fecha: new Date().toISOString().slice(0, 10),
    numeroFactura: "",
    razonSocial: "",
    retencionId: "",
    monto: "",
    descripcion: "",
  });

  const [fechaDesde, setFechaDesde] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [fechaHasta, setFechaHasta] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [cobranzasUsuario, setCobranzasUsuario] = useState<Cobranza[]>([]);
  const [cobranzaActual, setCobranzaActual] = useState<Cobranza | null>(null);

  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState<FormEdicion>({
    fecha: "",
    tipoDocumento: "",
    numeroFactura: "",
    razonSocial: "",
    monto: "",
    descripcion: "",
  });

  const buscarCobranzas = useCallback(async (tkn?: string | null, desde?: string, hasta?: string) => {
    const t = tkn ?? token;
    const d = desde ?? fechaDesde;
    const h = hasta ?? fechaHasta;
    if (!t) return;
    try {
      const data = await apiGet<Cobranza[]>("/cobranzas?skip=0&limit=100", t);
      if (Array.isArray(data)) {
        setCobranzas(data.filter((c) => c.fecha >= d && c.fecha <= h));
      }
    } catch {
      // silencioso — no interrumpir el flujo principal
    }
  }, [token, fechaDesde, fechaHasta]);

  const cargarDatos = useCallback(async (tkn: string) => {
    try {
      const [usuariosData, retencionesData] = await Promise.all([
        apiGet<Usuario[]>("/usuarios", tkn),
        apiGet<Retencion[]>("/retenciones/", tkn),
      ]);
      setUsuarios([...usuariosData].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setRetenciones(retencionesData);
      await buscarCobranzas(tkn);
    } catch {
      // datos iniciales — fallo silencioso
    }
  }, [buscarCobranzas]);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    cargarDatos(storedToken);
  }, [router, cargarDatos]);

  const handleRetencionChange = (retencionId: string): void => {
    const retencion = retenciones.find((r) => r.id === parseInt(retencionId));
    if (retencion) {
      setFormRegistro({ ...formRegistro, retencionId, monto: retencion.monto.toString() });
    } else {
      setFormRegistro({ ...formRegistro, retencionId });
    }
  };

  const registrarCobranza = async () => {
    if (!formRegistro.usuarioId) {
      toast("Por favor seleccione un árbitro", "error");
      return;
    }
    if (parseFloat(formRegistro.monto) <= 0) {
      toast("El monto debe ser mayor a cero", "error");
      return;
    }

    if (!token) return;
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        usuario_id: parseInt(formRegistro.usuarioId),
        fecha: formRegistro.fecha,
        monto: parseFloat(formRegistro.monto),
        tipo_documento: tipoDocumento,
      };

      if (tipoDocumento === "factura") {
        payload.numero_factura = formRegistro.numeroFactura;
        payload.razon_social = formRegistro.razonSocial;
      }
      if (formRegistro.retencionId) payload.retencion_id = parseInt(formRegistro.retencionId);
      if (formRegistro.descripcion) payload.descripcion = formRegistro.descripcion;

      await apiPost("/cobranzas", token, payload);

      toast(
        tipoDocumento === "factura"
          ? "Factura registrada exitosamente"
          : "Cobranza registrada exitosamente",
        "success"
      );

      setFormRegistro({
        usuarioId: "",
        fecha: new Date().toISOString().slice(0, 10),
        numeroFactura: "",
        razonSocial: "",
        retencionId: "",
        monto: "",
        descripcion: "",
      });
      setTipoDocumento("recibo");

      await buscarCobranzas(token);
      setActiveTab("listar");

    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al registrar cobranza", "error");
    } finally {
      setLoading(false);
    }
  };

  const buscarCobranzasPorUsuario = async () => {
    if (!usuarioSeleccionado) {
      toast("Por favor seleccione un árbitro", "error");
      return;
    }
    if (!token) return;
    try {
      const todasCobranzas = await apiGet<Cobranza[]>("/cobranzas", token);
      const cobranzasDelUsuario = todasCobranzas.filter(
        (c) => c.usuario_id === parseInt(usuarioSeleccionado)
      );
      if (cobranzasDelUsuario.length === 0) {
        toast("No se encontraron cobranzas para este árbitro", "info");
      }
      setCobranzasUsuario(cobranzasDelUsuario);
      setCobranzaActual(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al buscar cobranzas", "error");
    }
  };

  const seleccionarCobranza = async (cobranzaId: number): Promise<void> => {
    if (!token) return;
    try {
      const cobranza = await apiGet<Cobranza>(`/cobranzas/${cobranzaId}`, token);
      setCobranzaActual(cobranza);
      setEditando(false);
    } catch {
      // silencioso
    }
  };

  const iniciarEdicion = (): void => {
    if (!cobranzaActual) return;
    setFormEdicion({
      fecha: cobranzaActual.fecha,
      tipoDocumento: cobranzaActual.tipo_documento || "recibo",
      numeroFactura: cobranzaActual.numero_factura || "",
      razonSocial: cobranzaActual.razon_social || "",
      monto: cobranzaActual.monto.toString(),
      descripcion: cobranzaActual.descripcion || "",
    });
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!cobranzaActual || !token) return;
    if (formEdicion.tipoDocumento === "factura") {
      if (!formEdicion.numeroFactura.trim()) {
        toast("Por favor ingrese el número de factura", "error");
        return;
      }
      if (!formEdicion.razonSocial.trim()) {
        toast("Por favor ingrese la razón social", "error");
        return;
      }
    }

    try {
      const payload: Record<string, unknown> = {
        fecha: formEdicion.fecha,
        monto: parseFloat(formEdicion.monto),
        descripcion: formEdicion.descripcion,
        tipo_documento: formEdicion.tipoDocumento,
      };
      if (formEdicion.tipoDocumento === "factura") {
        payload.numero_factura = formEdicion.numeroFactura;
        payload.razon_social = formEdicion.razonSocial;
      }
      if (cobranzaActual.retencion_id) payload.retencion_id = cobranzaActual.retencion_id;

      await apiPut(`/cobranzas/${cobranzaActual.id}`, token, payload);
      toast("Cobranza actualizada correctamente", "success");
      setEditando(false);
      await buscarCobranzasPorUsuario();
      await seleccionarCobranza(cobranzaActual.id);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al actualizar la cobranza", "error");
    }
  };

  const eliminarCobranza = async (): Promise<void> => {
    if (!cobranzaActual || !token) return;
    if (!confirm(`¿Está seguro de eliminar la cobranza #${cobranzaActual.id}?`)) return;

    try {
      await apiDelete(`/cobranzas/${cobranzaActual.id}`, token);
      toast("Cobranza eliminada correctamente", "success");
      setCobranzaActual(null);
      await buscarCobranzasPorUsuario();
      await buscarCobranzas(token);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al eliminar la cobranza", "error");
    }
  };

  const calcularTotal = (): number => cobranzas.reduce((sum, c) => sum + c.monto, 0);

  const obtenerNombreUsuario = (usuarioId: number): string =>
    usuarios.find((u) => u.id === usuarioId)?.nombre ?? "Desconocido";

  const tabs: { id: "registrar" | "listar" | "buscar"; label: string; icon: typeof FilePlus }[] = [
    { id: "registrar", label: "Registrar Cobranza", icon: FilePlus },
    { id: "listar", label: "Listado de Cobranzas", icon: List },
    { id: "buscar", label: "Buscar Cobranza", icon: Search },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />
      <main className="flex-1 min-w-0 w-full pt-16 px-4 pb-8 lg:pt-8 lg:px-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Cobranzas</h1>
          <p className="text-sm text-slate-500">Recibos y facturas cobradas a árbitros</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-full sm:w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
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

        {/* ── Tab Registrar ── */}
        {activeTab === "registrar" && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Registrar Cobranza</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de Documento</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={tipoDocumento === "recibo"}
                      onChange={() => setTipoDocumento("recibo")}
                      className="accent-slate-900 w-4 h-4"
                    />
                    Recibo
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pagador/Cobrador</label>
                  <select
                    value={formRegistro.usuarioId}
                    onChange={(e) => setFormRegistro({ ...formRegistro, usuarioId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formRegistro.fecha}
                    onChange={(e) => setFormRegistro({ ...formRegistro, fecha: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                {tipoDocumento === "factura" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Número de Factura/Recibo</label>
                      <input
                        type="text"
                        value={formRegistro.numeroFactura}
                        onChange={(e) => setFormRegistro({ ...formRegistro, numeroFactura: e.target.value })}
                        placeholder="Ingrese número de factura..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social</label>
                      <input
                        type="text"
                        value={formRegistro.razonSocial}
                        onChange={(e) => setFormRegistro({ ...formRegistro, razonSocial: e.target.value })}
                        placeholder="Ingrese razón social..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Retención</label>
                  <select
                    value={formRegistro.retencionId}
                    onChange={(e) => handleRetencionChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Seleccione una retención</option>
                    {retenciones.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} (${r.monto})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRegistro.monto}
                    onChange={(e) => setFormRegistro({ ...formRegistro, monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descripción/Notas</label>
                  <input
                    type="text"
                    value={formRegistro.descripcion}
                    onChange={(e) => setFormRegistro({ ...formRegistro, descripcion: e.target.value })}
                    placeholder="Ingrese detalles adicionales..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={registrarCobranza}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 px-8 rounded-lg text-sm transition-colors"
                >
                  <Save size={15} />
                  {loading
                    ? "Registrando..."
                    : tipoDocumento === "factura"
                    ? "Registrar Factura"
                    : "Registrar Cobranza"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Listar ── */}
        {activeTab === "listar" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Listado de Cobranzas</h2>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  onClick={() => buscarCobranzas()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                >
                  <Search size={15} />
                  Buscar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="px-3 py-3 font-semibold">ID</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Fecha</th>
                    <th className="px-3 py-3 font-semibold min-w-[120px]">Árbitro</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Retención</th>
                    <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Monto</th>
                    <th className="px-3 py-3 font-semibold min-w-[140px]">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cobranzas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No hay cobranzas en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    cobranzas.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={
                          idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/50 hover:bg-slate-100/80"
                        }
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">#{c.id}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(c.fecha)}</td>
                        <td className="px-3 py-2.5 text-slate-800 font-medium">{obtenerNombreUsuario(c.usuario_id)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{c.retencion?.nombre || "N/A"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                          ${c.monto.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{c.descripcion || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="p-3 text-center text-xs text-slate-400 lg:hidden border-t border-slate-100">
              Deslizá horizontalmente para ver todas las columnas.
            </p>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/50 text-right">
              <span className="text-sm font-bold text-slate-900">
                Total: ${calcularTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* ── Tab Buscar ── */}
        {activeTab === "buscar" && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Buscar Cobranza</h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar árbitro</label>
                <select
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Seleccione un árbitro</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <button
                  onClick={buscarCobranzasPorUsuario}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                >
                  <Search size={15} />
                  Buscar
                </button>
                {cobranzaActual && (
                  <>
                    <button
                      onClick={iniciarEdicion}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      onClick={eliminarCobranza}
                      className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>

            {cobranzasUsuario.length > 0 && (
              <div className="mb-6 rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs lg:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs">
                        <th className="px-3 py-3 font-semibold">ID</th>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">Fecha</th>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">Retención</th>
                        <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Monto</th>
                        <th className="px-3 py-3 font-semibold min-w-[120px]">Descripción</th>
                        <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cobranzasUsuario.map((c, idx) => (
                        <tr
                          key={c.id}
                          className={
                            cobranzaActual?.id === c.id
                              ? "bg-blue-50"
                              : idx % 2 === 0
                              ? "bg-white hover:bg-slate-50"
                              : "bg-slate-50/50 hover:bg-slate-100/80"
                          }
                        >
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">#{c.id}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(c.fecha)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{c.retencion?.nombre || "N/A"}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            ${c.monto.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{c.descripcion || "-"}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => seleccionarCobranza(c.id)}
                              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                            >
                              <Eye size={13} />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {cobranzaActual && !editando && (
              <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Detalle de Cobranza #{cobranzaActual.id}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Fecha</label>
                    <p className="text-slate-900 font-medium">{formatDate(cobranzaActual.fecha)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Tipo de Documento</label>
                    <p className="text-slate-900 font-medium capitalize">{cobranzaActual.tipo_documento || "Recibo"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Monto</label>
                    <p className="text-emerald-700 font-semibold">${cobranzaActual.monto.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Retención</label>
                    <p className="text-slate-900 font-medium">{cobranzaActual.retencion?.nombre || "N/A"}</p>
                  </div>
                  {cobranzaActual.numero_factura && (
                    <div>
                      <label className="text-xs font-medium text-slate-500">Número de Factura</label>
                      <p className="text-slate-900 font-medium">{cobranzaActual.numero_factura}</p>
                    </div>
                  )}
                  {cobranzaActual.razon_social && (
                    <div>
                      <label className="text-xs font-medium text-slate-500">Razón Social</label>
                      <p className="text-slate-900 font-medium">{cobranzaActual.razon_social}</p>
                    </div>
                  )}
                  {cobranzaActual.descripcion && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-500">Descripción</label>
                      <p className="text-slate-900">{cobranzaActual.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cobranzaActual && editando && (
              <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Editar Cobranza #{cobranzaActual.id}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formEdicion.fecha}
                      onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formEdicion.monto}
                      onChange={(e) => setFormEdicion({ ...formEdicion, monto: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  {formEdicion.tipoDocumento === "factura" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Número de Factura</label>
                        <input
                          type="text"
                          value={formEdicion.numeroFactura}
                          onChange={(e) => setFormEdicion({ ...formEdicion, numeroFactura: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social</label>
                        <input
                          type="text"
                          value={formEdicion.razonSocial}
                          onChange={(e) => setFormEdicion({ ...formEdicion, razonSocial: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={formEdicion.descripcion}
                      onChange={(e) => setFormEdicion({ ...formEdicion, descripcion: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-2 mt-6">
                  <button
                    onClick={guardarEdicion}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                  >
                    <Save size={15} />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditando(false)}
                    className="inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}