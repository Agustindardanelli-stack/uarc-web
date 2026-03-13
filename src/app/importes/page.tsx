"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

  const alertColors = {
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Alert */}
        {alert && (
          <div className={`mb-4 border-l-4 rounded p-3 text-sm ${alertColors[alert.type]}`}>
            {alert.message}
          </div>
        )}
         <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Importes</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(["retenciones", "categorias"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab Retenciones ── */}
        {activeTab === "retenciones" && (
          <div className="flex gap-6">
            {/* Lista */}
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Retenciones Existentes</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retenciones.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin datos</td></tr>
                    )}
                    {retenciones.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => onSelectRetencion(r)}
                        className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 transition-colors ${
                          selectedRetencion?.id === r.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-2">{r.id}</td>
                        <td className="px-4 py-2">{r.nombre}</td>
                        <td className="px-4 py-2 text-right">${r.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formularios */}
            <div className="w-72 flex flex-col gap-4">
              {/* Agregar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Agregar Retención</h3>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={retNombre}
                    onChange={(e) => setRetNombre(e.target.value)}
                    placeholder="Nombre de la retención"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                  <input
                    type="number"
                    value={retMonto}
                    onChange={(e) => setRetMonto(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={100}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={onGuardarRetencion}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                >
                  Guardar
                </button>
              </div>

              {/* Editar */}
              {selectedRetencion && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-1">Editar/Eliminar Retención</h3>
                  <p className="text-xs text-gray-400 mb-3">ID: {selectedRetencion.id}</p>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={retNombreEdit}
                      onChange={(e) => setRetNombreEdit(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                    <input
                      type="number"
                      value={retMontoEdit}
                      onChange={(e) => setRetMontoEdit(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={100}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onActualizarRetencion}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                    >
                      Actualizar
                    </button>
                    <button
                      onClick={onEliminarRetencion}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded text-sm transition-colors"
                    >
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
          <div className="flex gap-6">
            {/* Lista */}
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Categorías Existentes</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">Sin datos</td></tr>
                    )}
                    {categorias.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCategoria(c)}
                        className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 transition-colors ${
                          selectedCategoria?.id === c.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-2">{c.id}</td>
                        <td className="px-4 py-2">{c.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formularios */}
            <div className="w-72 flex flex-col gap-4">
              {/* Agregar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Agregar Categoría</h3>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={onGuardarCategoria}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                >
                  Guardar
                </button>
              </div>

              {/* Editar */}
              {selectedCategoria && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-1">Editar/Eliminar Categoría</h3>
                  <p className="text-xs text-gray-400 mb-3">ID: {selectedCategoria.id}</p>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={catNombreEdit}
                      onChange={(e) => setCatNombreEdit(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onActualizarCategoria}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                    >
                      Actualizar
                    </button>
                    <button
                      onClick={onEliminarCategoria}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded text-sm transition-colors"
                    >
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-3">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line mb-5">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={confirm.onConfirm}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}