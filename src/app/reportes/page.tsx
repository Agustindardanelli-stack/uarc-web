"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ReportesPage() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth(); // 0-indexed

  const [meses, setMeses] = useState<MesData[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [anio, setAnio] = useState(anioActual);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mesPdf, setMesPdf] = useState(new Date().getMonth() + 1);
  const [anioPdf, setAnioPdf] = useState(anioActual);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    
    setCargando(true);
    setError(null);
    
    Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/ingresos_egresos_mensuales?anio=${anio}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then((r) => r.json()),

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([dataMeses, dataBalance]) => {
      
        if (dataMeses?.datos) setMeses(dataMeses.datos);
        if (dataBalance) setBalance(dataBalance);
      })
      .catch(() => setError("No se pudieron cargar los datos del reporte."))
      .finally(() => setCargando(false));
  }, [anio]);

  // ---------------------------------------------------------------------------
  // Cálculos derivados
  // ---------------------------------------------------------------------------

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
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/reportes/libro-diario-pdf?mes=${mesPdf}&anio=${anioPdf}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) return alert("Error al generar el PDF");
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `libro_diario_${mesPdf}_${anioPdf}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } catch {
          alert("Error de conexión al generar el PDF");
        } finally {
          setGenerandoPdf(false);
        }
      };
    // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reportes Financieros</h1>
            <p className="text-sm text-gray-500 mt-1">Análisis de ingresos y egresos por período</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const y = anioActual - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Ingresos del año"
            value={formatARS(totalIngresos)}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            }
          />
          <StatCard
            label="Egresos del año"
            value={formatARS(totalEgresos)}
            color="red"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            }
          />
          <StatCard
            label="Balance del año"
            value={formatARS(totalBalance)}
            color={totalBalance >= 0 ? "blue" : "red"}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Saldo actual (histórico)"
            value={balance ? formatARS(balance.saldo) : "—"}
            color={balance && balance.saldo >= 0 ? "blue" : "red"}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Gráfico de barras */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Ingresos vs Egresos — {anio}
          </h2>

          {cargando ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
          ) : mesesConDatos.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Sin movimientos registrados en {anio}
            </div>
          ) : (
            <>
              {/* Leyenda */}
              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  Ingresos
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-sm bg-red-400" />
                  Egresos
                </div>
              </div>

              {/* Barras */}
              <div className="overflow-x-auto">
                <div className="flex items-end gap-2 min-w-[600px] h-48 pb-6 relative">
                  {/* Líneas guía */}
                  {[25, 50, 75, 100].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 border-t border-dashed border-gray-100"
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
                          {/* Barra ingreso */}
                          <div
                            className="w-5 bg-green-500 rounded-t transition-all duration-500 group-hover:opacity-80"
                            style={{ height: `${ingPct}%` }}
                            title={`Ingresos: ${formatARS(m.ingresos)}`}
                          />
                          {/* Barra egreso */}
                          <div
                            className="w-5 bg-red-400 rounded-t transition-all duration-500 group-hover:opacity-80"
                            style={{ height: `${egPct}%` }}
                            title={`Egresos: ${formatARS(m.egresos)}`}
                          />
                        </div>
                        <span className={`text-xs truncate max-w-full text-center ${esActual ? "font-bold text-blue-600" : "text-gray-500"}`}>
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

        {/* Tabla detallada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Detalle mensual — {anio}</h2>
            {mejorMes && (
              <span className="text-xs text-gray-500">
                Mejor mes: <span className="font-semibold text-green-600">{mejorMes.nombre_mes}</span>
              </span>
            )}
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando datos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <th className="text-left px-6 py-3 font-medium">Mes</th>
                    <th className="text-right px-6 py-3 font-medium">Ingresos</th>
                    <th className="text-right px-6 py-3 font-medium">Egresos</th>
                    <th className="text-right px-6 py-3 font-medium">Balance</th>
                    <th className="px-6 py-3 font-medium">Distribución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
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
                        className={`transition-colors hover:bg-gray-50 ${esActual ? "bg-blue-50/50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <td className="px-6 py-3 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            {esActual && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                            )}
                            {m.nombre_mes}
                            {esActual && (
                              <span className="text-xs text-blue-500 font-normal">actual</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-3 text-right font-mono ${tieneDatos ? "text-green-700" : "text-gray-300"}`}>
                          {tieneDatos ? formatARS(ingreso) : "—"}
                        </td>
                        <td className={`px-6 py-3 text-right font-mono ${tieneDatos ? "text-red-600" : "text-gray-300"}`}>
                          {tieneDatos ? formatARS(egreso) : "—"}
                        </td>
                        <td className={`px-6 py-3 text-right font-mono font-semibold ${
                          !tieneDatos ? "text-gray-300" : bal >= 0 ? "text-blue-700" : "text-red-600"
                        }`}>
                          {tieneDatos ? (bal >= 0 ? "+" : "") + formatARS(bal) : "—"}
                        </td>
                        <td className="px-6 py-3">
                          {tieneDatos ? (
                            <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${ingPct}%` }}
                              />
                            </div>
                          ) : (
                            <div className="w-full bg-gray-100 rounded-full h-2" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totales */}
                <tfoot>
                  <tr className="bg-gray-900 text-white text-sm font-semibold">
                    <td className="px-6 py-4">Total {anio}</td>
                    <td className="px-6 py-4 text-right font-mono text-green-300">{formatARS(totalIngresos)}</td>
                    <td className="px-6 py-4 text-right font-mono text-red-300">{formatARS(totalEgresos)}</td>
                    <td className={`px-6 py-4 text-right font-mono ${totalBalance >= 0 ? "text-blue-300" : "text-red-300"}`}>
                      {totalBalance >= 0 ? "+" : ""}{formatARS(totalBalance)}
                    </td>
                    <td className="px-6 py-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
          {/* Generador de PDF */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-1">Libro Diario mensual</h2>
  <p className="text-sm text-gray-500 mb-5">
    Generá el informe completo de movimientos de un mes para presentar a los socios.
  </p>

  <div className="flex flex-wrap items-end gap-4">
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
      <select
        value={mesPdf}
        onChange={(e) => setMesPdf(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {["Enero","Febrero","Marzo","Abril","Mayo","Junio",
          "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
        ].map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
      <select
        value={anioPdf}
        onChange={(e) => setAnioPdf(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>

    <button
      onClick={handleGenerarPdf}
      disabled={generandoPdf}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors"
    >
      {generandoPdf ? (
        <>Generando...</>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </>
      )}
    </button>
  </div>
</div>
        {/* Nota al pie */}
        <p className="text-xs text-gray-400 text-center pb-4">
          Los datos reflejan las partidas contables registradas en el sistema · UARC Tesorería
        </p>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente StatCard
// ---------------------------------------------------------------------------

type StatCardProps = {
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "gray";
  icon: React.ReactNode;
};

const colorMap = {
  green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500 bg-green-100" },
  red:   { bg: "bg-red-50",   text: "text-red-700",   icon: "text-red-500 bg-red-100" },
  blue:  { bg: "bg-blue-50",  text: "text-blue-700",  icon: "text-blue-500 bg-blue-100" },
  gray:  { bg: "bg-gray-50",  text: "text-gray-700",  icon: "text-gray-500 bg-gray-100" },
};

function StatCard({ label, value, color, icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-xl border border-gray-200 p-5 flex items-start gap-4`}>
      <div className={`${c.icon} p-2 rounded-lg flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-lg font-bold ${c.text} truncate`}>{value}</p>
      </div>
    </div>
  );
}