"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Rol = {
  id: number;
  nombre: string;
};

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  rol?: Rol;
};

type Form = {
  nombre: string;
  email: string;
  password: string;
  rol_id: string;
};

const FORM_VACIO: Form = { nombre: "", email: "", password: "", rol_id: "" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const COLORES_AVATAR = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

function colorAvatar(id: number): string {
  return COLORES_AVATAR[id % COLORES_AVATAR.length];
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const [form, setForm] = useState<Form>(FORM_VACIO);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchData = useCallback((tkn: string) => {
    setCargando(true);
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${tkn}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        headers: { Authorization: `Bearer ${tkn}` },
      }).then((r) => r.json()),
    ])
      .then(([dataUsuarios, dataRoles]) => {
        setUsuarios(Array.isArray(dataUsuarios) ? dataUsuarios.sort((a: Usuario, b: Usuario) => a.nombre.localeCompare(b.nombre)) : []);
        setRoles(Array.isArray(dataRoles) ? dataRoles : []);
      })
      .catch(() => setError("No se pudieron cargar los datos"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const tkn = localStorage.getItem("access_token");
    if (tkn) {
      setToken(tkn);
      fetchData(tkn);
    }
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");
    if (!form.email.trim()) return setError("El email es obligatorio");
    if (!editingId && !form.password.trim()) return setError("La contraseña es obligatoria al crear un usuario");
    if (!form.rol_id) return setError("Seleccioná un rol");

    setError(null);
    setGuardando(true);

    const payload: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      rol_id: Number(form.rol_id),
    };
    if (form.password.trim()) payload.password = form.password;

    const url = editingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/usuarios`;

    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).finally(() => setGuardando(false));

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return setError(err.detail || "Error al guardar el usuario");
    }

    setForm(FORM_VACIO);
    setEditingId(null);
    setMostrarForm(false);
    fetchData(token);
  };

  const handleEdit = (u: Usuario) => {
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol_id: u.rol_id.toString(),
    });
    setEditingId(u.id);
    setMostrarForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return setError(err.detail || "No se pudo eliminar el usuario");
    }

    fetchData(token);
  };

  const cancelar = () => {
    setForm(FORM_VACIO);
    setEditingId(null);
    setMostrarForm(false);
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // Filtro
  // ---------------------------------------------------------------------------

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.rol?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Árbitros y Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">
              {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setMostrarForm(true); setEditingId(null); setForm(FORM_VACIO); setError(null); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar usuario
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              {editingId ? "Editar usuario" : "Nuevo usuario"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos López"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="ejemplo@mail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraseña {editingId ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <input
                  type="password"
                  placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
                <select
                  value={form.rol_id}
                  onChange={(e) => setForm({ ...form, rol_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccioná un rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors"
              >
                {guardando ? "Guardando..." : editingId ? "Actualizar" : "Crear usuario"}
              </button>
              <button
                onClick={cancelar}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-5 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Cargando usuarios...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{busqueda ? "No se encontraron resultados" : "No hay usuarios registrados"}</p>
          </div>
        ) : (
          <>
            {/* Vista escritorio — tabla */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium">Usuario</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Rol</th>
                    <th className="text-left px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuariosFiltrados.map((u, idx) => (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorAvatar(u.id)}`}>
                            {iniciales(u.nombre)}
                          </div>
                          <span className="font-medium text-gray-900">{u.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {u.rol?.nombre ?? `Rol ${u.rol_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-mono">#{u.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista mobile — cards */}
            <div className="md:hidden space-y-3">
              {usuariosFiltrados.map((u) => (
                <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorAvatar(u.id)}`}>
                      {iniciales(u.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.nombre}</p>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">#{u.id}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                      <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {u.rol?.nombre ?? `Rol ${u.rol_id}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(u)}
                      className="flex-1 text-xs font-medium text-blue-600 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="flex-1 text-xs font-medium text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie */}
            <p className="text-xs text-center text-gray-400 mt-4">
              Mostrando {usuariosFiltrados.length} de {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </main>
    </div>
  );
}