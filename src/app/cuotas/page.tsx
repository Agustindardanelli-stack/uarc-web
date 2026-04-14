"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

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

// Estado por árbitro en el cobro mensual
interface EstadoCobro {
  [usuarioId: number]: {
    monto: string;
    pagando: boolean; // true = lo marcó para pagar ahora
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function mesAnioActual() {
  const hoy = new Date();
  return { mes: hoy.getMonth(), anio: hoy.getFullYear() };
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function CuotasPage() {
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

  // --- Cobro mensual ---
  const { mes: mesHoy, anio: anioHoy } = mesAnioActual();
  const [mesCobro, setMesCobro] = useState(mesHoy);
  const [anioCobro, setAnioCobro] = useState(anioHoy);
  const [montoGlobal, setMontoGlobal] = useState("5000");
  const [estadoCobro, setEstadoCobro] = useState<EstadoCobro>({});
  const [guardando, setGuardando] = useState(false);

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------

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

  // Cuando cambia el mes/año de cobro, inicializar el estado de cada árbitro
  useEffect(() => {
    if (!usuarios.length) return;
    const inicial: EstadoCobro = {};
    usuarios.forEach((u) => {
      inicial[u.id] = { monto: montoGlobal, pagando: false };
    });
    setEstadoCobro(inicial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, mesCobro, anioCobro]);

  // ---------------------------------------------------------------------------
  // Helpers cobro mensual
  // ---------------------------------------------------------------------------

  // Devuelve la cuota de un usuario para el mes/año seleccionado (si existe)
  function cuotaDelMes(usuarioId: number): Cuota | undefined {
    return cuotas.find((c) => {
      const d = new Date(c.fecha);
      return (
        c.usuario_id === usuarioId &&
        d.getMonth() === mesCobro &&
        d.getFullYear() === anioCobro
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
        // Solo marcar los que aún no tienen cuota pagada este mes
        const cuota = cuotaDelMes(Number(id));
        if (!cuota?.pagado) {
          nuevo[Number(id)] = { ...nuevo[Number(id)], pagando: true };
        }
      });
      return nuevo;
    });
  }

  // ---------------------------------------------------------------------------
  // Guardar cobro mensual
  // ---------------------------------------------------------------------------

  async function handleGuardarCobro() {
    if (!token) return;

    const aProcesar = usuarios.filter((u) => estadoCobro[u.id]?.pagando);
    if (!aProcesar.length) {
      alert("No marcaste a ningún árbitro para cobrar.");
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
        if (cuotaExistente && !cuotaExistente.pagado) {
          // Ya existe la cuota pero no está pagada → pagarla
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuotaExistente.id}/pagar?monto_pagado=${monto}`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            errores.push(`${usuario.nombre}: ${err.detail || "error al pagar"}`);
          }
        } else if (!cuotaExistente) {
          // No existe la cuota → crearla y pagarla en un solo paso
          const resCreate = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas?no_generar_movimiento=true`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              usuario_id: usuario.id,
              fecha: fechaCobro,
              monto,
              pagado: false,
              monto_pagado: 0,
            }),
          });
          if (!resCreate.ok) {
            const err = await resCreate.json().catch(() => ({}));
            errores.push(`${usuario.nombre}: ${err.detail || "error al crear"}`);
            continue;
          }
          const nuevaCuota: Cuota = await resCreate.json();

          const resPago = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${nuevaCuota.id}/pagar?monto_pagado=${monto}`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!resPago.ok) {
            const err = await resPago.json().catch(() => ({}));
            errores.push(`${usuario.nombre}: ${err.detail || "error al pagar"}`);
          }
        }
        // Si ya estaba pagada, no hacemos nada
      } catch {
        errores.push(`${usuario.nombre}: error de conexión`);
      }
    }

    setGuardando(false);
    fetchData(token);

    // Desmarcar los que se procesaron correctamente
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
      alert(`Completado con errores:\n${errores.join("\n")}`);
    } else {
      alert(`${aProcesar.length} cobro(s) registrado(s) correctamente.`);
    }
  }

  // ---------------------------------------------------------------------------
  // Acciones individuales (tabs existentes)
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.usuarioId) return alert("Por favor seleccione un árbitro");
    if (!form.monto || parseFloat(form.monto) <= 0) return alert("El monto debe ser mayor a cero");

    const payload = {
      usuario_id: Number(form.usuarioId),
      fecha: form.fecha,
      monto: Number(form.monto),
    };

    const res = await fetch(
      editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/cuotas`,
      {
        method: editingId ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return alert(`Error: ${error.detail || "No se pudo guardar la cuota"}`);
    }

    setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
    setEditingId(null);
    fetchData(token);
    alert(editingId ? "Cuota actualizada correctamente" : "Cuota registrada exitosamente");
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

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return alert(`No se pudo eliminar: ${error.detail || "Error desconocido"}`);
    }

    fetchData(token);
    setSelectedCuota(null);
    alert("Cuota eliminada correctamente");
  };

  const handlePagarCuota = async (cuotaId: number, montoPagado?: number) => {
    if (!token) return;
    const monto = montoPagado ?? parseFloat(pagoForm.montoPagado);
    if (!monto || monto <= 0) return alert("Por favor ingrese un monto válido");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuotaId}/pagar?monto_pagado=${monto}`,
      { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return alert(`Error al registrar pago: ${error.detail || "Error desconocido"}`);
    }

    fetchData(token);
    setPagoForm({ cuotaId: 0, montoPagado: "" });
    alert("Pago registrado correctamente");
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cuotas/${id}/generar-recibo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(`Error al generar PDF: ${err.detail || `Status ${res.status}`}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("pdf")) {
        const text = await res.text();
        console.error("Respuesta inesperada del servidor:", text);
        return alert("Error: el servidor no devolvió un PDF válido.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo_cuota_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar recibo:", e);
      alert(`Error de conexión al generar el PDF.`);
    }
  };

  const handleSendEmail = (cuota: Cuota) => {
    if (!token) return;
    const email = cuota.usuario?.email || prompt("Ingrese el email de destino:");
    if (!email) return;

    if (confirm(`¿Desea enviar el recibo al email:\n${email}?`)) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cuotas/${cuota.id}/enviar-recibo?email=${email}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => res.json())
        .then((data: { success: boolean; message: string }) => {
          if (data.success) alert(`Recibo enviado exitosamente a:\n${email}`);
          else alert(`No se pudo enviar: ${data.message}`);
        });
    }
  };

  const handleSearchByUser = () => {
    if (!searchForm.usuarioId) return alert("Por favor seleccione un árbitro");
    const filtered = cuotas.filter((c) => {
      const matchUser = c.usuario_id === Number(searchForm.usuarioId);
      const matchDate = c.fecha >= searchForm.desde && c.fecha <= searchForm.hasta;
      return matchUser && matchDate;
    });
    setCuotasFiltradas(filtered);
    setSelectedCuota(null);
  };

  // ---------------------------------------------------------------------------
  // Estadísticas generales
  // ---------------------------------------------------------------------------

  const totalCuotas = cuotas.reduce((sum, c) => sum + c.monto, 0);
  const totalPagado = cuotas.reduce((sum, c) => sum + (c.monto_pagado || 0), 0);
  const totalPendiente = totalCuotas - totalPagado;

  // ---------------------------------------------------------------------------
  // Estadísticas cobro mensual
  // ---------------------------------------------------------------------------

  const pagadosEsteMes = usuarios.filter((u) => cuotaDelMes(u.id)?.pagado).length;
  const pendientesEsteMes = usuarios.length - pagadosEsteMes;
  const marcadosParaCobrar = usuarios.filter((u) => estadoCobro[u.id]?.pagando).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Cuotas Societarias</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 flex-wrap gap-y-2">
          {(["form", "list", "search", "cobro"] as const).map((tab) => {
            const labels: Record<string, string> = {
              form: editingId ? "Editar Cuota" : "Registrar Cuota",
              list: "Listado",
              search: "Buscar",
              cobro: "Cobro Mensual",
            };
            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "form") {
                    setEditingId(null);
                    setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
                  }
                  setActiveTab(tab);
                }}
                className={`px-4 py-2 rounded font-medium text-sm ${
                  activeTab === tab
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Tab: Registrar / Editar                                             */}
        {/* ------------------------------------------------------------------ */}
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
                  <option key={u.id} value={u.id}>{u.nombre}</option>
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
                    setForm({ usuarioId: "", fecha: new Date().toISOString().slice(0, 10), monto: "" });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Tab: Listado                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "list" && (
          <div className="bg-gray-50 p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Listado de Cuotas</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-green-100">
                    {["ID","Fecha","Árbitro","Monto","Pagado","Pendiente","Estado","Acciones"].map((h) => (
                      <th key={h} className="p-2 border text-gray-900">{h}</th>
                    ))}
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.pagado ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
                          {c.pagado ? "Pagada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="p-2 border">
                        <div className="flex space-x-1 justify-center">
                          <button onClick={() => handleEdit(c)} className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded">Editar</button>
                          <button onClick={() => handleDelete(c.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded">Eliminar</button>
                          {!c.pagado && (
                            <button onClick={() => handleMarcarPagada(c.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">Pagar</button>
                          )}
                          {c.pagado && (
                            <button onClick={() => handleGenerateRecibo(c.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded">PDF</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-right font-bold text-sm">
              <div>Total Cuotas: ${totalCuotas.toFixed(2)}</div>
              <div className="text-green-600">Total Pagado: ${totalPagado.toFixed(2)}</div>
              <div className="text-red-600">Total Pendiente: ${totalPendiente.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Tab: Buscar                                                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Buscar Cuotas por Árbitro</h2>
              <div className="flex space-x-4 items-end flex-wrap gap-y-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="block mb-2 font-semibold text-sm">Árbitro:</label>
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
                  <label className="block mb-2 font-semibold text-sm">Desde:</label>
                  <input type="date" value={searchForm.desde} onChange={(e) => setSearchForm({ ...searchForm, desde: e.target.value })} className="border p-2 rounded" />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-sm">Hasta:</label>
                  <input type="date" value={searchForm.hasta} onChange={(e) => setSearchForm({ ...searchForm, hasta: e.target.value })} className="border p-2 rounded" />
                </div>
                <button onClick={handleSearchByUser} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Buscar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Resultados</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-green-100">
                    {["ID","Fecha","Árbitro","Monto","Pagado","Pendiente","Estado"].map((h) => (
                      <th key={h} className="p-2 border text-gray-900">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cuotasFiltradas.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCuota(c)}
                      className={`cursor-pointer hover:bg-gray-100 ${selectedCuota?.id === c.id ? "bg-green-50" : ""}`}
                    >
                      <td className="p-2 border">{c.id}</td>
                      <td className="p-2 border">{new Date(c.fecha).toLocaleDateString()}</td>
                      <td className="p-2 border">{c.usuario?.nombre || "Desconocido"}</td>
                      <td className="p-2 border">${c.monto.toFixed(2)}</td>
                      <td className="p-2 border">${(c.monto_pagado || 0).toFixed(2)}</td>
                      <td className="p-2 border">${(c.monto - (c.monto_pagado || 0)).toFixed(2)}</td>
                      <td className="p-2 border">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.pagado ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
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
                      <h3 className="font-bold mb-2 text-sm">Registrar Pago Parcial</h3>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Monto a pagar"
                          value={pagoForm.montoPagado}
                          onChange={(e) => setPagoForm({ ...pagoForm, montoPagado: e.target.value })}
                          className="border p-2 rounded flex-1"
                        />
                        <button onClick={() => handlePagarCuota(selectedCuota.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                          Registrar Pago
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2 flex-wrap gap-y-2">
                    <button onClick={() => handleEdit(selectedCuota)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm">Editar</button>
                    <button onClick={() => handleDelete(selectedCuota.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">Eliminar</button>
                    {!selectedCuota.pagado && (
                      <button onClick={() => handleMarcarPagada(selectedCuota.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">Marcar como Pagada</button>
                    )}
                    {selectedCuota.pagado && (
                      <>
                        <button onClick={() => handleGenerateRecibo(selectedCuota.id)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded text-sm">Descargar Recibo</button>
                        <button onClick={() => handleSendEmail(selectedCuota)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">Enviar Email</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Tab: Cobro Mensual ← NUEVO                                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "cobro" && (
          <div className="space-y-6">

            {/* Encabezado con controles */}
            <div className="bg-gray-50 p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Cobro Mensual</h2>
              <p className="text-sm text-gray-500 mb-4">
                Seleccioná el mes, el monto y marcá quién pagó. Al guardar se crean y registran los pagos automáticamente.
              </p>

              <div className="flex flex-wrap gap-4 items-end">
                {/* Selector de mes */}
                <div>
                  <label className="block mb-1 text-sm font-semibold">Mes:</label>
                  <select
                    value={mesCobro}
                    onChange={(e) => setMesCobro(Number(e.target.value))}
                    className="border p-2 rounded"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Selector de año */}
                <div>
                  <label className="block mb-1 text-sm font-semibold">Año:</label>
                  <select
                    value={anioCobro}
                    onChange={(e) => setAnioCobro(Number(e.target.value))}
                    className="border p-2 rounded"
                  >
                    {[anioHoy - 1, anioHoy, anioHoy + 1].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Monto global */}
                <div>
                  <label className="block mb-1 text-sm font-semibold">Monto para todos ($):</label>
                  <input
                    type="number"
                    value={montoGlobal}
                    onChange={(e) => aplicarMontoGlobal(e.target.value)}
                    className="border p-2 rounded w-32"
                  />
                </div>

                {/* Botones de acción */}
                <button
                  onClick={marcarTodos}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded text-sm border border-blue-300"
                >
                  Marcar todos
                </button>
                <button
                  onClick={handleGuardarCobro}
                  disabled={guardando || marcadosParaCobrar === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded text-sm"
                >
                  {guardando ? "Guardando..." : `Guardar (${marcadosParaCobrar})`}
                </button>
              </div>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded shadow p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Total árbitros</p>
                <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
              </div>
              <div className="bg-green-50 rounded shadow p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Pagaron este mes</p>
                <p className="text-2xl font-bold text-green-700">{pagadosEsteMes}</p>
              </div>
              <div className="bg-red-50 rounded shadow p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                <p className="text-2xl font-bold text-red-600">{pendientesEsteMes}</p>
              </div>
            </div>

            {/* Tabla principal */}
            <div className="bg-gray-50 p-6 rounded shadow overflow-x-auto">
              <h3 className="font-bold mb-3 text-gray-700">
                {MESES[mesCobro]} {anioCobro}
              </h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-green-100">
                    <th className="p-3 border text-left text-gray-900">Árbitro</th>
                    <th className="p-3 border text-center text-gray-900">Estado del mes</th>
                    <th className="p-3 border text-center text-gray-900">Monto ($)</th>
                    <th className="p-3 border text-center text-gray-900">Cobrar ahora</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, idx) => {
                    const cuota = cuotaDelMes(u.id);
                    const yaPagado = cuota?.pagado ?? false;
                    const marcado = estadoCobro[u.id]?.pagando ?? false;
                    const monto = estadoCobro[u.id]?.monto ?? montoGlobal;

                    return (
                      <tr
                        key={u.id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50 transition-colors`}
                      >
                        {/* Nombre */}
                        <td className="p-3 border font-medium text-gray-900">{u.nombre}</td>

                        {/* Estado */}
                        <td className="p-3 border text-center">
                          {yaPagado ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              Pagado
                            </span>
                          ) : cuota ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                              Cuota sin pagar
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                              Sin cuota
                            </span>
                          )}
                        </td>

                        {/* Monto editable (solo si no está pagado) */}
                        <td className="p-3 border text-center">
                          {yaPagado ? (
                            <span className="text-green-700 font-semibold">
                              ${(cuota?.monto_pagado ?? cuota?.monto ?? 0).toFixed(2)}
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={monto}
                              onChange={(e) => setMontoCobro(u.id, e.target.value)}
                              className="border p-1 rounded w-24 text-center text-sm"
                              disabled={yaPagado}
                            />
                          )}
                        </td>

                        {/* Toggle pagar */}
                        <td className="p-3 border text-center">
                          {yaPagado ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <button
                              onClick={() => togglePagando(u.id)}
                              className={`py-1 px-4 rounded text-xs font-bold border transition-colors ${
                                marcado
                                  ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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

              {usuarios.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No hay árbitros registrados.</p>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}