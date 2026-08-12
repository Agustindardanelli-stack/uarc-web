"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Balance, Movimiento } from "@/lib/types";
import { RefreshCw, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function DashboardPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiGet<Balance>("/reportes/balance", token).then(setBalance).catch(() => {}),
      apiGet<Movimiento[]>("/partidas?skip=0&limit=100", token).then(setMovimientos).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const recalcularSaldos = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setRecalculando(true);
    try {
      const data = await apiPost<{ message: string }>("/partidas/recalcular-saldos", token);
      toast(data.message, "success");
      window.location.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error al recalcular saldos", "error");
    } finally {
      setRecalculando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />

      <main className="flex-1 min-w-0 w-full pt-16 px-4 pb-8 lg:pt-8 lg:px-8">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inicio</h1>
            <p className="text-sm text-slate-500">Resumen financiero de Tesorería</p>
          </div>

          <button
            onClick={recalcularSaldos}
            disabled={recalculando}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={recalculando ? "animate-spin" : ""} />
            {recalculando ? "Recalculando..." : "Recalcular Saldos"}
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ingresos Totales</span>
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {loading ? "..." : formatCurrency(balance?.ingresos)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Egresos Totales</span>
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600">
              {loading ? "..." : formatCurrency(balance?.egresos)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saldo Actual</span>
              <Wallet size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(balance?.saldo)}
            </p>
          </div>
        </div>

        {/* Tabla Libro Diario */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-base">
              Últimos Movimientos (Libro Diario)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {movimientos.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-medium text-xs">
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="px-3 py-3 font-semibold">Tipo</th>
                  <th className="px-3 py-3 font-semibold min-w-[140px]">Detalle</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Comprobante</th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Ingreso</th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Egreso</th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Saldo</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Usuario</th>
                  <th className="px-3 py-3 font-semibold min-w-[160px]">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">
                      Cargando movimientos...
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m, idx) => {
                    const esIngreso = m.ingreso > 0;
                    return (
                      <tr
                        key={m.id}
                        className={
                          idx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/50 hover:bg-slate-100/80"
                        }
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">#{m.id}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{formatDate(m.fecha)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {esIngreso ? (
                            <span className="font-semibold text-emerald-700 text-xs">INGRESO</span>
                          ) : (
                            <span className="font-semibold text-rose-700 text-xs">EGRESO</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800 font-medium">{m.detalle || "-"}</td>
                        <td className="px-3 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">{m.recibo_factura || "-"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-600 whitespace-nowrap">
                          {m.ingreso > 0 ? formatCurrency(m.ingreso) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-rose-600 whitespace-nowrap">
                          {m.egreso > 0 ? formatCurrency(m.egreso) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(m.saldo)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{m.usuario?.nombre || "-"}</td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{m.descripcion || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="p-3 text-center text-xs text-slate-400 lg:hidden border-t border-slate-100">
            Deslizá horizontalmente para ver todas las columnas.
          </p>
        </div>

      </main>
    </div>
  );
}