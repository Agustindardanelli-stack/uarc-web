"use client";

import Sidebar from "../components/Sidebar";

export default function PlanillaRecibosPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8">Planilla de Recibos</h1>
        <p>Aquí vas a poder generar y descargar la planilla de recibos.</p>
      </main>
    </div>
  );
}
