"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: email,
            password: password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorMsg(data.detail || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    } catch {
      setErrorMsg("Error al conectar con el servidor.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-4 rounded-xl">
            <Image
              src="/UarcLogo.png"
              alt="Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-1">
          Gestión Integral UARC
        </h1>
        <p className="text-center text-slate-500 text-sm mb-6">Iniciar Sesión</p>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-sm p-3 rounded-lg mb-4">
            <AlertCircle size={16} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="Ingrese su email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          Si no tiene una cuenta o ha olvidado su contraseña, contacte al administrador.
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          © 2025 Unión de Árbitros Río Cuarto. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}