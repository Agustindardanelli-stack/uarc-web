"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { apiGet, apiGetBlob, ApiError } from "@/lib/api";
import { formatCurrency, downloadBlob } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  Download,
  Loader2,
} from "lucide-react";

type MesData = {
  mes: number;
  nombre_mes: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

type Balance = {
  ingresos: number;
  egresos: number;
  saldo: number;
};

export default function ReportesPage() {
  const { toast } = useToast();
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth();

  const [meses, setMeses] = useState<MesData[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [anio, setAnio] = useState(anioActual);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mesPdf, setMesPdf] = useState(new Date().getMonth() + 1);
  const [anioPdf, setAnioPdf] = useState(anioActual);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setCargando(true);
    setError(null);

    Promise.all([
      apiGet<{ datos: MesData[] }>(`/reportes/ingresos_egresos_mensuales?anio=${anio}`, token),
      apiGet<Balance>("/reportes/balance", token),
    ])
      .then(([dataMeses, dataBalance]) => {
        if (dataMeses?.datos) setMeses(dataMeses.datos);
        if (dataBalance) setBalance(dataBalance);
      })
      .catch(() => setError("No se pudieron cargar los datos del reporte."))
      .finally(() => setCargando(false));
  }, [anio]);

  const totalIngresos = meses.reduce((s, m) => s + (m.ingresos ?? 0), 0);
  const totalEgresos = meses.reduce((s, m) => s + (m.egresos ?? 0), 0);
  const totalBalance = totalIngresos - totalEgresos;

  const maxValor = Math.max(...meses.map((m) => Math.max(m.ingresos ?? 0, m.egresos ?? 0)), 1);

  const mesesConDatos = meses.filter((m) => (m.ingresos ?? 0) > 0 || (m.egresos ?? 0) > 0);
  const mejorMes = mesesConDatos.reduce(
    (best, m) => ((m.balance ?? 0) > (best?.balance ?? -Infinity) ? m : best),
    mesesConDatos[0] ?? null
  );

  const handleGenerarPdf = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setGenerandoPdf(true);
    try {
      const blob = await apiGetBlob(
        `/reportes/libro-diario-pdf?mes=${mesPdf}&anio=${anioPdf}`,
        token
      );
      downloadBlob(blob, `libro_diario_${mesPdf}_${anioPdf}.pdf`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Error de conexión al generar el PDF", "error");
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />

      <main className="flex-1 min-w-0 w-full pt-16 px-4 pb-8 lg:pt-8 lg:px-8 overflow-x-hidden">

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reportes Financieros</h1>
            <p className="text-sm text-slate-500 mt-1">Análisis de ingresos y egresos por período</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Año:</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              {[...Array(5)].map((_, i) => {
                const y = anioActual - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-400 rounded-lg text-rose-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Ingresos del año"
            value={formatCurrency(totalIngresos)}
            color="emerald"
            icon={<TrendingUp size={18} />}
          />
          <StatCard
            label="Egresos del año"
            value={formatCurrency(totalEgresos)}
            color="rose"
            icon={<TrendingDown size={18} />}
          />
          <StatCard
            label="Balance del año"
            value={formatCurrency(totalBalance)}
            color={totalBalance >= 0 ? "blue" : "rose"}
            icon={<Scale size={18} />}
          />
          <StatCard
            label="Saldo actual (histórico)"
            value={balance ? formatCurrency(balance.saldo) : "—"}
            color={balance && balance.saldo >= 0 ? "blue" : "rose"}
            icon={<Wallet size={18} />}
          />
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-slate-900 text-base mb-6">
            Ingresos vs Egresos — {anio}
          </h2>

          {cargando ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" />
              Cargando...
            </div>
          ) : mesesConDatos.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Sin movimientos registrados en {anio}
            </div>
          ) : (
            <>
              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  Ingresos
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-rose-400" />
                  Egresos
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex items-end gap-2 min-w-[600px] h-48 pb-6 relative">
                  {[25, 50, 75, 100].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                      style={{ bottom: `${pct / 100 * (192 - 24)}px` }}
                    />
                  ))}

                  {meses.map((m) => {
                    const ingPct = ((m.ingresos ?? 0) / maxValor) * 100;
                    const egPct = ((m.egresos ?? 0) / maxValor) * 100;
                    const esActual = m.mes - 1 === mesActual && anio === anioActual;

                    return (
                      <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: "168px" }}>
                          <div
                            className="w-5 bg-emerald-500 rounded-t transition-all duration-500 group-hover:opacity-80"
                            style={{ height: `${ingPct}%` }}
                            title={`Ingresos: ${formatCurrency(m.ingresos)}`}
                          />
                          <div
                            className="w-5 bg-rose-400 rounded-t transition-all duration-500 group-hover:opacity-80"
                            style={{ height: `${egPct}%` }}
                            title={`Egresos: ${formatCurrency(m.egresos)}`}
                          />
                        </div>
                        <span className={`text-xs truncate max-w-full text-center ${esActual ? "font-bold text-blue-600" : "text-slate-500"}`}>
                          {m.nombre_mes.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detalle mensual */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="font-semibold text-slate-900 text-base">Detalle mensual — {anio}</h2>
            {mejorMes && (
              <span className="text-xs text-slate-500">
                Mejor mes: <span className="font-semibold text-emerald-600">{mejorMes.nombre_mes}</span>
              </span>
            )}
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" />
              Cargando datos...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="px-3 lg:px-6 py-3 font-semibold whitespace-nowrap">Mes</th>
                    <th className="px-3 lg:px-6 py-3 font-semibold text-right whitespace-nowrap">Ingresos</th>
                    <th className="px-3 lg:px-6 py-3 font-semibold text-right whitespace-nowrap">Egresos</th>
                    <th className="px-3 lg:px-6 py-3 font-semibold text-right whitespace-nowrap">Balance</th>
                    <th className="px-3 lg:px-6 py-3 font-semibold min-w-[100px]">Distribución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {meses.map((m, idx) => {
                    const ingreso = m.ingresos ?? 0;
                    const egreso = m.egresos ?? 0;
                    const bal = m.balance ?? 0;
                    const esActual = m.mes - 1 === mesActual && anio === anioActual;
                    const tieneDatos = ingreso > 0 || egreso > 0;
                    const total = ingreso + egreso || 1;
                    const ingPct = (ingreso / total) * 100;

                    return (
                      <tr
                        key={m.mes}
                        className={`transition-colors hover:bg-slate-50 ${
                          esActual ? "bg-blue-50/50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        <td className="px-3 lg:px-6 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {esActual && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0" />
                            )}
                            {m.nombre_mes}
                            {esActual && (
                              <span className="text-xs text-blue-500 font-normal hidden sm:inline">actual</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-3 lg:px-6 py-2.5 text-right font-mono whitespace-nowrap ${tieneDatos ? "text-emerald-700" : "text-slate-300"}`}>
                          {tieneDatos ? formatCurrency(ingreso) : "—"}
                        </td>
                        <td className={`px-3 lg:px-6 py-2.5 text-right font-mono whitespace-nowrap ${tieneDatos ? "text-rose-600" : "text-slate-300"}`}>
                          {tieneDatos ? formatCurrency(egreso) : "—"}
                        </td>
                        <td className={`px-3 lg:px-6 py-2.5 text-right font-mono font-semibold whitespace-nowrap ${
                          !tieneDatos ? "text-slate-300" : bal >= 0 ? "text-blue-700" : "text-rose-600"
                        }`}>
                          {tieneDatos ? (bal >= 0 ? "+" : "") + formatCurrency(bal) : "—"}
                        </td>
                        <td className="px-3 lg:px-6 py-2.5">
                          {tieneDatos ? (
                            <div className="w-full min-w-[60px] bg-rose-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${ingPct}%` }}
                              />
                            </div>
                          ) : (
                            <div className="w-full min-w-[60px] bg-slate-100 rounded-full h-2" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-900 text-white text-xs lg:text-sm font-semibold">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">Total {anio}</td>
                    <td className="px-3 lg:px-6 py-4 text-right font-mono text-emerald-300 whitespace-nowrap">{formatCurrency(totalIngresos)}</td>
                    <td className="px-3 lg:px-6 py-4 text-right font-mono text-rose-300 whitespace-nowrap">{formatCurrency(totalEgresos)}</td>
                    <td className={`px-3 lg:px-6 py-4 text-right font-mono whitespace-nowrap ${totalBalance >= 0 ? "text-blue-300" : "text-rose-300"}`}>
                      {totalBalance >= 0 ? "+" : ""}{formatCurrency(totalBalance)}
                    </td>
                    <td className="px-3 lg:px-6 py-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <p className="p-3 text-center text-xs text-slate-400 lg:hidden border-t border-slate-100">
            Deslizá horizontalmente para ver todas las columnas.
          </p>
        </div>

        {/* Libro Diario PDF */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-slate-900 text-base mb-1">Libro Diario mensual</h2>
          <p className="text-sm text-slate-500 mb-5">
            Generá el informe completo de movimientos de un mes para presentar a los socios.
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-600 mb-1">Mes</label>
              <select
                value={mesPdf}
                onChange={(e) => setMesPdf(Number(e.target.value))}
                className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                {["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-600 mb-1">Año</label>
              <select
                value={anioPdf}
                onChange={(e) => setAnioPdf(Number(e.target.value))}
                className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerarPdf}
              disabled={generandoPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
            >
              {generandoPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-4">
          Los datos reflejan las partidas contables registradas en el sistema · UARC Tesorería
        </p>
      </main>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  color: "emerald" | "rose" | "blue";
  icon: React.ReactNode;
};

const colorMap = {
  emerald: { icon: "text-emerald-600 bg-emerald-50" },
  rose: { icon: "text-rose-600 bg-rose-50" },
  blue: { icon: "text-blue-600 bg-blue-50" },
};

function StatCard({ label, value, color, icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
      <div className={`${c.icon} p-2 rounded-lg flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}