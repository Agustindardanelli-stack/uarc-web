"use client";

import Link from "next/link";

const menuItems = [
  { title: "Home", path: "/dashboard" },
  { title: "Pagos", path: "/pagos" },
  { title: "Cobranzas", path: "/cobranzas" },
  { title: "Cuotas", path: "/cuotas" },
  { title: "Importes", path: "/importes" },
  { title: "Reportes", path: "/reportes" },
  { title: "Config. Email", path: "/config-email" },
  { title: "Agregar Socio", path: "/socios/nuevo" },
  { title: "Designaciones", path: "/designaciones" },
  { title: "Planilla de Recibos", path: "/planilla-recibos" },
];

export default function Sidebar() {
  return (
    <aside className="bg-blue-800 text-white w-56 min-h-screen flex flex-col">
      <div className="text-center py-6">
        <img
          src="/uarclogo.png"
          className="mx-auto mb-4 w-24"
          alt="UARC Logo"
        />
        <h1 className="font-bold text-lg">UARC Tesorería</h1>
      </div>
      <nav className="flex-1 px-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="block py-2 px-3 rounded hover:bg-blue-700 transition"
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <button
          className="w-full bg-red-600 hover:bg-red-700 rounded py-2"
          onClick={() => {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
