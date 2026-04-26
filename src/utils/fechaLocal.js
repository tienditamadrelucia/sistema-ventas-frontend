// ---------------------------------------------------------
//  FECHA LOCAL — UNIVERSAL PARA TODO EL SISTEMA
// ---------------------------------------------------------

// ✔ Convierte un Date real a "YYYY-MM-DD" (para input y localStorage)
export function dateToYYYYMMDD(date) {
  return date.toISOString().slice(0, 10);
}

// ✔ Convierte "YYYY-MM-DD" a Date real SIN UTC (para backend y lógica interna)
export function parseFechaLocal(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split("-");
  return new Date(y, m - 1, d); // ← LOCAL, sin UTC
}

// ✔ Convierte un Date real a "DD/MM/YYYY" (para mostrar en pantalla)
export function dateToDDMMYYYY(date) {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const año = date.getFullYear();
  return `${dia}/${mes}/${año}`;
}

// ✔ Obtiene la fecha de la computadora como Date real (sin UTC)
export function obtenerFechaLocalComoDate() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}
