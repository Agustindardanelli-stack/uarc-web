"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      // Guardar token
      localStorage.setItem("access_token", data.access_token);

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMsg("Error al conectar con el servidor.");
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-800 to-sky-400 p-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/uarclogo.png"
            alt="Logo"
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Gestión Integral UARC
        </h1>
        <p className="text-center text-gray-500 mb-6">Iniciar Sesión</p>

        {errorMsg && (
          <div className="bg-red-100 text-red-800 text-sm p-3 rounded mb-4">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Ingrese su email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded ${
              loading && "opacity-50 cursor-not-allowed"
            }`}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Si no tiene una cuenta o ha olvidado su contraseña, contacte al
          administrador.
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025 Unión de Árbitros Río Cuarto. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}
