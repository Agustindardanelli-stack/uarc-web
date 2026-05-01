"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Usuario, Retencion, Cobranza } from "@/lib/types";

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
    if (tipoDocumento === "factura") {
      if (!formRegistro.numeroFactura.trim()) {
        toast("Por favor ingrese el número de factura", "error");
        return;
      }
      if (!formRegistro.razonSocial.trim()) {
        toast("Por favor ingrese la razón social", "error");
        return;
      }
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

      const data = await apiPost<{ email_enviado?: boolean; email_destinatario?: string }>(
        "/cobranzas",
        token,
        payload
      );

      if (tipoDocumento === "recibo" && data.email_enviado) {
        toast(`Cobranza registrada. Recibo enviado a ${data.email_destinatario}`, "success");
      } else {
        toast(tipoDocumento === "factura" ? "Factura registrada exitosamente" : "Cobranza registrada exitosamente", "success");
      }

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Gestión de Cobranzas
          </h1>

          <div className="flex space-x-2 mb-6 border-b border-gray-200">
            {(["registrar", "listar", "buscar"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab === "registrar" && "Registrar Cobranza"}
                {tab === "listar" && "Listado de Cobranzas"}
                {tab === "buscar" && "Buscar Cobranza"}
              </button>
            ))}
          </div>

          {activeTab === "registrar" && (
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Registrar Cobranza
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Documento:
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={tipoDocumento === "recibo"}
                        onChange={() => setTipoDocumento("recibo")}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Recibo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={tipoDocumento === "factura"}
                        onChange={() => setTipoDocumento("factura")}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Factura/Recibo</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pagador/Cobrador:
                    </label>
                    <select
                      value={formRegistro.usuarioId}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, usuarioId: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccione un árbitro</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha:
                    </label>
                    <input
                      type="date"
                      value={formRegistro.fecha}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, fecha: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {tipoDocumento === "factura" && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Número de Factura/Recibo:
                        </label>
                        <input
                          type="text"
                          value={formRegistro.numeroFactura}
                          onChange={(e) =>
                            setFormRegistro({ ...formRegistro, numeroFactura: e.target.value })
                          }
                          placeholder="Ingrese número de factura..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Razón Social:
                        </label>
                        <input
                          type="text"
                          value={formRegistro.razonSocial}
                          onChange={(e) =>
                            setFormRegistro({ ...formRegistro, razonSocial: e.target.value })
                          }
                          placeholder="Ingrese razón social..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Retención:
                    </label>
                    <select
                      value={formRegistro.retencionId}
                      onChange={(e) => handleRetencionChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monto:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formRegistro.monto}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, monto: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción/Notas:
                    </label>
                    <input
                      type="text"
                      value={formRegistro.descripcion}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, descripcion: e.target.value })
                      }
                      placeholder="Ingrese detalles adicionales..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={registrarCobranza}
                    disabled={loading}
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
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

          {activeTab === "listar" && (
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Listado de Cobranzas
              </h2>
              <div className="flex space-x-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Desde:</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta:</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => buscarCobranzas()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-left">Árbitro</th>
                      <th className="p-3 text-left">Retención</th>
                      <th className="p-3 text-right">Monto</th>
                      <th className="p-3 text-left">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cobranzas.map((c, idx) => (
                      <tr key={c.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="p-3 border">{c.id}</td>
                        <td className="p-3 border">{formatDate(c.fecha)}</td>
                        <td className="p-3 border">{obtenerNombreUsuario(c.usuario_id)}</td>
                        <td className="p-3 border">{c.retencion?.nombre || "N/A"}</td>
                        <td className="p-3 border text-right">${c.monto.toFixed(2)}</td>
                        <td className="p-3 border">{c.descripcion || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-right">
                <p className="text-lg font-bold text-gray-900">
                  Total: ${calcularTotal().toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {activeTab === "buscar" && (
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Buscar Cobranza
              </h2>

              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seleccionar árbitro:
                  </label>
                  <select
                    value={usuarioSeleccionado}
                    onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Seleccione un árbitro</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={buscarCobranzasPorUsuario}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Buscar
                  </button>
                  {cobranzaActual && (
                    <>
                      <button
                        onClick={iniciarEdicion}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Editar
                      </button>
                      <button
                        onClick={eliminarCobranza}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {cobranzasUsuario.length > 0 && (
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-3 text-left">ID</th>
                        <th className="p-3 text-left">Fecha</th>
                        <th className="p-3 text-left">Retención</th>
                        <th className="p-3 text-right">Monto</th>
                        <th className="p-3 text-left">Descripción</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobranzasUsuario.map((c, idx) => (
                        <tr key={c.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="p-3 border">{c.id}</td>
                          <td className="p-3 border">{formatDate(c.fecha)}</td>
                          <td className="p-3 border">{c.retencion?.nombre || "N/A"}</td>
                          <td className="p-3 border text-right">${c.monto.toFixed(2)}</td>
                          <td className="p-3 border">{c.descripcion || "-"}</td>
                          <td className="p-3 border text-center">
                            <button
                              onClick={() => seleccionarCobranza(c.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {cobranzaActual && !editando && (
                <div className="bg-gray-50 p-8 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">
                    Detalle de Cobranza #{cobranzaActual.id}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Fecha:</label>
                      <p className="text-gray-900">{formatDate(cobranzaActual.fecha)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Tipo de Documento:</label>
                      <p className="text-gray-900">{cobranzaActual.tipo_documento || "Recibo"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Monto:</label>
                      <p className="text-gray-900">${cobranzaActual.monto.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Retención:</label>
                      <p className="text-gray-900">{cobranzaActual.retencion?.nombre || "N/A"}</p>
                    </div>
                    {cobranzaActual.numero_factura && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Número de Factura:</label>
                        <p className="text-gray-900">{cobranzaActual.numero_factura}</p>
                      </div>
                    )}
                    {cobranzaActual.razon_social && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Razón Social:</label>
                        <p className="text-gray-900">{cobranzaActual.razon_social}</p>
                      </div>
                    )}
                    {cobranzaActual.descripcion && (
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Descripción:</label>
                        <p className="text-gray-900">{cobranzaActual.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cobranzaActual && editando && (
                <div className="bg-gray-50 p-8 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">
                    Editar Cobranza #{cobranzaActual.id}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha:</label>
                      <input
                        type="date"
                        value={formEdicion.fecha}
                        onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Monto:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formEdicion.monto}
                        onChange={(e) => setFormEdicion({ ...formEdicion, monto: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    {formEdicion.tipoDocumento === "factura" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Factura:
                          </label>
                          <input
                            type="text"
                            value={formEdicion.numeroFactura}
                            onChange={(e) =>
                              setFormEdicion({ ...formEdicion, numeroFactura: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Razón Social:
                          </label>
                          <input
                            type="text"
                            value={formEdicion.razonSocial}
                            onChange={(e) =>
                              setFormEdicion({ ...formEdicion, razonSocial: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descripción:
                      </label>
                      <input
                        type="text"
                        value={formEdicion.descripcion}
                        onChange={(e) =>
                          setFormEdicion({ ...formEdicion, descripcion: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div className="flex justify-center space-x-4 mt-6">
                      <button
                        onClick={guardarEdicion}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditando(false)}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
