"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Wallet,
  HandCoins,
  Receipt,
  DollarSign,
  BarChart3,
  Mail,
  UserPlus,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pagos",
    path: "/pagos",
    icon: Wallet,
  },
  {
    title: "Cobranzas",
    path: "/cobranzas",
    icon: HandCoins,
  },
  {
    title: "Cuotas",
    path: "/cuotas",
    icon: Receipt,
  },
  {
    title: "Importes",
    path: "/importes",
    icon: DollarSign,
  },
  {
    title: "Reportes",
    path: "/reportes",
    icon: BarChart3,
  },
  {
    title: "Config. Email",
    path: "/config-email",
    icon: Mail,
  },
  {
    title: "Agregar Socio",
    path: "/usuarios",
    icon: UserPlus,
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón Mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-5 left-5 z-50 rounded-xl bg-slate-900 p-3 text-white shadow-xl"
      >
        <Menu size={22} />
      </button>

      {/* Fondo oscuro */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`
        fixed lg:static
        top-0 left-0
        z-50
        h-screen
        w-72
        bg-slate-900
        text-white
        border-r
        border-slate-800
        flex
        flex-col
        transition-transform
        duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      >
        {/* Header */}
        <div className="relative border-b border-slate-800 px-8 py-8">

          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 lg:hidden"
          >
            <X className="text-slate-300" />
          </button>

          <Image
            src="/UarcLogo.png"
            alt="UARC"
            width={90}
            height={90}
            className="mx-auto mb-4"
          />

          <h2 className="text-center text-xl font-bold tracking-wide">
            UARC
          </h2>

          <p className="mt-1 text-center text-sm text-slate-400">
            Sistema de Tesorería
          </p>

        </div>

        {/* Navegación */}
        <nav className="flex-1 px-5 py-6 overflow-y-auto">

          <p className="mb-3 px-3 text-xs uppercase tracking-widest text-slate-500">
            Menú Principal
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  className="
                    group
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    transition-all
                    duration-200
                    text-slate-300
                    hover:bg-slate-800
                    hover:text-white
                  "
                >
                  <Icon
                    size={20}
                    className="text-slate-400 group-hover:text-blue-400"
                  />

                  <span className="font-medium">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
                  </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-5">

          <div className="mb-5 rounded-2xl bg-slate-800 p-4">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
                A
              </div>

              <div>
                <p className="font-semibold text-white">
                  Administrador
                </p>

                <p className="text-sm text-slate-400">
                  Sistema UARC
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              window.location.href = "/login";
            }}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-red-600
              px-4
              py-3
              font-semibold
              text-white
              transition-all
              duration-200
              hover:bg-red-700
              hover:shadow-lg
              active:scale-[0.98]
            "
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            UARC Tesorería
            <br />
            v1.0
          </p>

        </div>
      </aside>
    </>
  );
}