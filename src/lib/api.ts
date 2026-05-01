const BASE = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function makeHeaders(token: string, json?: boolean): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    ...(json && { "Content-Type": "application/json" }),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { detail?: string }).detail ?? "Error desconocido");
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: makeHeaders(token) });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: makeHeaders(token, body !== undefined),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: makeHeaders(token, body !== undefined),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return handleResponse<T>(res);
}

export async function apiDelete(path: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: makeHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { detail?: string }).detail ?? "Error desconocido");
  }
}

export async function apiGetBlob(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, { headers: makeHeaders(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { detail?: string }).detail ?? "Error al descargar archivo");
  }
  return res.blob();
}

export async function apiGetPdf(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, { headers: makeHeaders(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { detail?: string }).detail ?? "Error al generar PDF");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf")) {
    const text = await res.text();
    console.error("Respuesta inesperada del servidor:", text);
    throw new ApiError(200, "El servidor no devolvió un PDF válido");
  }
  return res.blob();
}
