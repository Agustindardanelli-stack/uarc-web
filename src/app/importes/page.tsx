"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Percent,
  Tags,
  Save,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Retencion {
  id: number;
  nombre: string;
  monto: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

type Tab = "retenciones" | "categorias";

export default function ImportesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("retenciones");

  // Retenciones state
  const [retenciones, setRetenciones] = useState<Retencion[]>([]);
  const [selectedRetencion, setSelectedRetencion] = useState<Retencion | null>(null);
  const [retNombre, setRetNombre] = useState("");
  const [retMonto, setRetMonto] = useState<number>(0);
  const [retNombreEdit, setRetNombreEdit] = useState("");
  const [retMontoEdit, setRetMontoEdit] = useState<number>(0);

  // Categorias state
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catNombreEdit, setCatNombreEdit] = useState("");

  // Confirm modal
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Alert
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  });

  const showAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ─── Retenciones ───────────────────────────────────────────────

  const cargarRetenciones = async () => {
    try {
      const res = await fetch(`${API_URL}/retenciones`, { headers: getHeaders() });
      if (res.ok) setRetenciones(await res.json());
      else showAlert("error", "No se pudieron cargar las retenciones.");
    } catch (e) {
      showAlert("error", `Error al cargar retenciones: ${String(e)}`);
    }
  };

  const onSelectRetencion = (r: Retencion) => {
    setSelectedRetencion(r);
    setRetNombreEdit(r.nombre);
    setRetMontoEdit(r.monto);
  };

  const onGuardarRetencion = async () => {
    if (!retNombre.trim()) return showAlert("warning", "Por favor ingrese un nombre.");
    if (retMonto <= 0) return showAlert("warning", "El monto debe ser mayor a cero.");
    try {
      const res = await fetch(`${API_URL}/retenciones/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ nombre: retNombre.trim(), monto: retMonto }),
      });
      if (res.ok) {
        showAlert("success", "Retención guardada exitosamente.");
        setRetNombre("");
        setRetMonto(0);
        cargarRetenciones();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert("error", err.detail || `Error al guardar. Status: ${res.status}`);
      }
    } catch (e) {
      showAlert("error", `Error: ${String(e)}`);
    }
  };

  const onActualizarRetencion = async () => {
    if (!selectedRetencion) return showAlert("warning", "Seleccione una retención.");
    if (!retNombreEdit.trim()) return showAlert("warning", "Por favor ingrese un nombre.");
    if (retMontoEdit <= 0) return showAlert("warning", "El monto debe ser mayor a cero.");
    try {
      const res = await fetch(`${API_URL}/retenciones/${selectedRetencion.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ nombre: retNombreEdit.trim(), monto: retMontoEdit }),
      });
      if (res.ok) {
        showAlert("success", "Retención actualizada exitosamente.");
        setSelectedRetencion(null);
        cargarRetenciones();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert("error", err.detail || "Error al actualizar.");
      }
    } catch (e) {
      showAlert("error", `Error: ${String(e)}`);
    }
  };

  const onEliminarRetencion = () => {
    if (!selectedRetencion) return showAlert("warning", "Seleccione una retención.");
    setConfirm({
      message: `¿Está seguro de eliminar la retención "${selectedRetencion.nombre}"?\n\nEsta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API_URL}/retenciones/${selectedRetencion.id}`, {
            method: "DELETE",
            headers: getHeaders(),
          });
          if (res.ok) {
            showAlert("success", "Retención eliminada correctamente.");
            setSelectedRetencion(null);
            cargarRetenciones();
          } else {
            const err = await res.json().catch(() => ({}));
            showAlert("error", err.detail || "Error al eliminar.");
          }
        } catch (e) {
          showAlert("error", `Error: ${String(e)}`);
        }
      },
    });
  };

  // ─── Categorias ────────────────────────────────────────────────

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/categorias`, { headers: getHeaders() });
      if (res.ok) setCategorias(await res.json());
      else showAlert("error", "No se pudieron cargar las categorías.");
    } catch (e) {
      showAlert("error", `Error al cargar categorías: ${String(e)}`);
    }
  };

  const onSelectCategoria = (c: Categoria) => {
    setSelectedCategoria(c);
    setCatNombreEdit(c.nombre);
  };

  const onGuardarCategoria = async () => {
    if (!catNombre.trim()) return showAlert("warning", "Por favor ingrese un nombre.");
    try {
      const res = await fetch(`${API_URL}/categorias`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ nombre: catNombre.trim() }),
      });
      if (res.ok) {
        showAlert("success", "Categoría guardada exitosamente.");
        setCatNombre("");
        cargarCategorias();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert("error", err.detail || `Error al guardar. Status: ${res.status}`);
      }
    } catch (e) {
      showAlert("error", `Error: ${String(e)}`);
    }
  };

  const onActualizarCategoria = async () => {
    if (!selectedCategoria) return showAlert("warning", "Seleccione una categoría.");
    if (!catNombreEdit.trim()) return showAlert("warning", "Por favor ingrese un nombre.");
    try {
      const res = await fetch(`${API_URL}/categorias/${selectedCategoria.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ nombre: catNombreEdit.trim() }),
      });
      if (res.ok) {
        showAlert("success", "Categoría actualizada exitosamente.");
        setSelectedCategoria(null);
        cargarCategorias();
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert("error", err.detail || "Error al actualizar.");
      }
    } catch (e) {
      showAlert("error", `Error: ${String(e)}`);
    }
  };

  const onEliminarCategoria = () => {
    if (!selectedCategoria) return showAlert("warning", "Seleccione una categoría.");
    setConfirm({
      message: `¿Está seguro de eliminar la categoría "${selectedCategoria.nombre}"?\n\nEsta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API_URL}/categorias/${selectedCategoria.id}`, {
            method: "DELETE",
            headers: getHeaders(),
          });
          if (res.ok) {
            showAlert("success", "Categoría eliminada correctamente.");
            setSelectedCategoria(null);
            cargarCategorias();
          } else {
            const err = await res.json().catch(() => ({}));
            showAlert("error", err.detail || "Error al eliminar.");
          }
        } catch (e) {
          showAlert("error", `Error: ${String(e)}`);
        }
      },
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { window.location.href = "/login"; return; }
    cargarRetenciones();
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alertStyles: Record<string, string> = {
    success: "bg-emerald-50 border-emerald-400 text-emerald-800",
    error: "bg-rose-50 border-rose-400 text-rose-800",
    warning: "bg-amber-50 border-amber-400 text-amber-800",
  };

  const tabs: { id: Tab; label: string; icon: typeof Percent }[] = [
    { id: "retenciones", label: "Retenciones", icon: Percent },
    { id: "categorias", label: "Categorías", icon: Tags },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Alert */}
        {alert && (
          <div className={`mb-4 border-l-4 rounded-lg p-3 text-sm ${alertStyles[alert.type]}`}>
            {alert.message}
          </div>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Gestión de Importes</h1>

        {/* Tabs */}
        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 mb-6 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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

        {/* ── Tab Retenciones ── */}
        {activeTab === "retenciones" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Lista */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Retenciones Existentes
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs">
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                      <th className="px-4 py-3 text-right font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {retenciones.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin datos</td></tr>
                    )}
                    {retenciones.map((r, idx) => (
                      <tr
                        key={r.id}
                        onClick={() => onSelectRetencion(r)}
                        className={`cursor-pointer transition-colors ${
                          selectedRetencion?.id === r.id
                            ? "bg-blue-50"
                            : idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/50 hover:bg-slate-100/80"
                        }`}
                      >
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">#{r.id}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{r.nombre}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                          ${r.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formularios */}
            <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
              {/* Agregar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Agregar Retención
                </h3>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={retNombre}
                    onChange={(e) => setRetNombre(e.target.value)}
                    placeholder="Nombre de la retención"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Monto</label>
                  <input
                    type="number"
                    value={retMonto}
                    onChange={(e) => setRetMonto(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={100}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  onClick={onGuardarRetencion}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Save size={15} />
                  Guardar
                </button>
              </div>

              {/* Editar */}
              {selectedRetencion && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Editar/Eliminar Retención
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">ID: {selectedRetencion.id}</p>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={retNombreEdit}
                      onChange={(e) => setRetNombreEdit(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Monto</label>
                    <input
                      type="number"
                      value={retMontoEdit}
                      onChange={(e) => setRetMontoEdit(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={100}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onActualizarRetencion}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      <Pencil size={14} />
                      Actualizar
                    </button>
                    <button
                      onClick={onEliminarRetencion}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Categorias ── */}
        {activeTab === "categorias" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Lista */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Categorías Existentes
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs">
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categorias.length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">Sin datos</td></tr>
                    )}
                    {categorias.map((c, idx) => (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCategoria(c)}
                        className={`cursor-pointer transition-colors ${
                          selectedCategoria?.id === c.id
                            ? "bg-blue-50"
                            : idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/50 hover:bg-slate-100/80"
                        }`}
                      >
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">#{c.id}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{c.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formularios */}
            <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
              {/* Agregar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Agregar Categoría
                </h3>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  onClick={onGuardarCategoria}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Save size={15} />
                  Guardar
                </button>
              </div>

              {/* Editar */}
              {selectedCategoria && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Editar/Eliminar Categoría
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">ID: {selectedCategoria.id}</p>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={catNombreEdit}
                      onChange={(e) => setCatNombreEdit(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onActualizarCategoria}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      <Pencil size={14} />
                      Actualizar
                    </button>
                    <button
                      onClick={onEliminarCategoria}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-rose-50 text-rose-600 p-1.5 rounded-lg">
                <AlertTriangle size={16} />
              </div>
              <h3 className="font-semibold text-slate-900">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-line mb-5">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirm.onConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}