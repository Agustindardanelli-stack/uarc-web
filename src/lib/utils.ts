export function formatCurrency(value: string | number | undefined | null): string {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[$,]/g, ""))
      : (value ?? 0);
  if (typeof num !== "number" || isNaN(num)) return "$0,00";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Parses date strings without timezone conversion (avoids UTC-to-local day shift).
export function formatDate(fecha: string | undefined): string {
  if (!fecha) return "";
  const iso = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
