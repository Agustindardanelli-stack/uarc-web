"use client";

import { useState, useEffect } from "react";

interface EmailConfig {
  id?: number;
  email_from: string;
  is_active: boolean;
}

export default function EmailConfigPage() {
  const [configId, setConfigId] = useState<number | null>(null);
  const [emailFrom, setEmailFrom] = useState("unidadarbitrosriocuarto@gmail.com");
  const [isActive, setIsActive] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const getHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const showAlert = (type: "success" | "error" | "warning" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/usuarios/me`, { headers: getHeaders() });
      if (!res.ok) {
        showAlert("warning", "Su sesión ha expirado o no tiene permisos suficientes.");
        return false;
      }
      const user = await res.json();
      const rolId = user.rol_id;
      const rolNombre = user.rol?.nombre?.toLowerCase() ?? "";
      if (![1, 2].includes(rolId) && !["admin", "tesorero"].includes(rolNombre)) {
        showAlert("warning", "No tienes permisos para acceder a la configuración de email. Solo administradores y tesoreros pueden hacerlo.");
        return false;
      }
      return true;
    } catch {
      showAlert("error", "Error al verificar permisos.");
      return false;
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/email-config/active`, { headers: getHeaders() });
      if (res.status === 200) {
        const config: EmailConfig = await res.json();
        setConfigId(config.id ?? null);
        setEmailFrom(config.email_from || "unidadarbitrosriocuarto@gmail.com");
        setIsActive(config.is_active ?? true);
      } else if (res.status === 404) {
        setEmailFrom("unidadarbitrosriocuarto@gmail.com");
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } catch (e) {
      console.error("Error al cargar configuración:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      const ok = await checkPermissions();
      if (ok) loadConfig();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanEmail = (raw: string): string | null => {
    const text = raw.trim();
    const match = text.match(/<(.+?)>/);
    const email = match ? match[1].trim() : text;
    if (!email.includes("@") || !email.includes(".")) return null;
    return email;
  };

  const handleSave = async () => {
    const email = cleanEmail(emailFrom);
    if (!email) {
      showAlert("error", "Por favor ingrese un email válido.");
      return;
    }

    const payload = {
      smtp_server: "brevo",
      smtp_port: 587,
      smtp_username: "apikey",
      smtp_password: "configured_in_env",
      email_from: email,
      is_active: isActive,
    };

    setLoading(true);
    try {
      const url = configId ? `${API_URL}/email-config/${configId}` : `${API_URL}/email-config/`;
      const method = configId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });

      if ([200, 201].includes(res.status)) {
        const result = await res.json();
        if (!configId) setConfigId(result.id ?? null);
        showAlert("success", "Configuración de email guardada exitosamente. El sistema utilizará Brevo para enviar los emails.");
      } else {
        let msg = "Error al guardar la configuración";
        try {
          const err = await res.json();
          if (err.detail) msg = err.detail;
        } catch { /* noop */ }
        showAlert("error", `${msg}. Status: ${res.status}`);
      }
    } catch (e) {
      showAlert("error", `Error al guardar configuración: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const email = cleanEmail(testEmail);
    if (!email) {
      showAlert("error", "Por favor ingrese un email válido.");
      return;
    }

    setTestLoading(true);
    setShowTestModal(false);
    try {
      const res = await fetch(`${API_URL}/email-test?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: getHeaders(),
      });

      if (res.status === 200) {
        const result = await res.json();
        if (result.success) {
          showAlert("success", `Email de prueba enviado exitosamente a: ${email}. Revisá tu bandeja de entrada (y spam).`);
        } else {
          showAlert("warning", `No se pudo enviar el email de prueba: ${result.message || "Error desconocido"}`);
        }
      } else {
        let msg = "Error al enviar email de prueba";
        try {
          const err = await res.json();
          if (err.detail) msg = err.detail;
        } catch { /* noop */ }
        showAlert("error", `${msg}\n\nStatus: ${res.status}\n\nVerificá que la API Key de Brevo esté configurada en Render y el email remitente esté verificado.`);
      }
    } catch (e) {
      showAlert("error", `Error al probar configuración: ${String(e)}`);
    } finally {
      setTestLoading(false);
      setTestEmail("");
    }
  };

  const alertColors: Record<string, string> = {
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    info: "bg-blue-50 border-blue-400 text-blue-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        {alert && (
          <div className={`mb-4 border-l-4 rounded p-4 text-sm whitespace-pre-line ${alertColors[alert.type]}`}>
            {alert.message}
          </div>
        )}

        <button
          onClick={() => window.history.back()}
          className="mb-6 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          ← Volver al Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración de Email para Recibos</h1>
        <p className="text-gray-500 text-sm mb-6">El sistema utiliza Brevo para el envío automático de recibos por email.</p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Estado del Sistema</h2>
          <p className="text-green-600 font-medium text-sm mb-2">✅ Brevo API configurada en el servidor</p>
          <p className="text-gray-400 text-sm">
            La configuración de Brevo se gestiona mediante variables de entorno en el servidor. No es necesario configurar SMTP manualmente.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">Configuración de Email</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Remitente (verificado en Brevo)
            </label>
            <input
              type="text"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
              placeholder="unidadarbitrosriocuarto@gmail.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Sistema de Email Activo</span>
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
          <strong>ℹ️ Nota importante:</strong> El email remitente debe estar verificado en Brevo. Los cambios en la API Key de Brevo se realizan directamente en las variables de entorno del servidor (Render).
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
          >
            {loading ? "Guardando..." : "Guardar Configuración"}
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            disabled={testLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
          >
            {testLoading ? "Enviando..." : "Probar Envío de Email"}
          </button>
        </div>
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-3">Probar Email</h3>
            <p className="text-sm text-gray-500 mb-3">Ingresá el email donde querés recibir el correo de prueba:</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowTestModal(false); setTestEmail(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleTest}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}