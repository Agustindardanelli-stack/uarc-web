"use client";

import Sidebar from "../components/Sidebar";

export default function DesignacionesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8">Designaciones</h1>
        <p>¡Próximamente podrás gestionar las designaciones aquí!</p>
      </main>
    </div>
  );
}
