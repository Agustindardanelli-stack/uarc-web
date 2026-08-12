"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, ArrowRight, Landmark, ShieldCheck, Users } from "lucide-react";

export default function HomePage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/hello`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">

      {/* Nav */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/15 rounded-lg p-1.5">
              <Image src="/UarcLogo.png" alt="Logo UARC" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide leading-none">UARC</p>
              <p className="text-slate-400 text-[11px] leading-none mt-1 hidden sm:block">
                Unión de Árbitros de Río Cuarto
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn size={15} />
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Columna izquierda */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Sistema de gestión institucional
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Gestión Integral UARC
            </h1>

            <p className="text-slate-300 text-base leading-relaxed max-w-md mb-8">
              La plataforma oficial para árbitros asociados a la Unión de Árbitros de Río Cuarto.
              Gestioná cuotas, cobranzas y el historial de ingresos y egresos.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
              >
                Acceder al sistema
                <ArrowRight size={16} />
              </Link>
              {message && (
                <div className="inline-flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              ¿Qué podés gestionar?
            </p>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="bg-white/10 border border-white/10 p-2.5 rounded-lg shrink-0">
                <Landmark size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold mb-0.5">Tesorería</p>
                <p className="text-slate-400 text-xs">Cuotas societarias, pagos y estado de cuenta</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-800">
          <Stat icon={<ShieldCheck size={16} />} value="UARC" label="Afiliada" />
          <Stat icon={<Users size={16} />} value="+50" label="Árbitros activos" />
          <Stat icon={<Landmark size={16} />} value="Río Cuarto" label="Sede" />
          <Stat icon={<Landmark size={16} />} value="2026" label="Temporada" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-6 px-2 text-center">
      <div className="text-slate-500 mb-0.5">{icon}</div>
      <span className="text-white font-bold text-base leading-none truncate max-w-full">{value}</span>
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}