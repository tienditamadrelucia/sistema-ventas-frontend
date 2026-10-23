import { API_URL } from "../config";

export async function registrarAccion(accion) {
  try {
    if (typeof accion !== "string" || !accion.trim()) {
      throw new Error("La acción no puede estar vacía.");
    }

    // Capturar la sede al momento de registrar la acción.
    const sede = localStorage
      .getItem("sede")
      ?.trim()
      .toUpperCase();

    const datos = {
      usuario:
        localStorage.getItem("usuarioNombre") ||
        "Desconocido",
      accion: accion.trim()
    };

    if (["TIENDITA", "MONASTERIO"].includes(sede)) {
      datos.sede = sede;
    }

    // La fecha la asigna el servidor.
    const res = await fetch(`${API_URL}/api/logs`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.mensaje ||
        data?.error ||
        "No se pudo registrar la acción."
      );
    }

    return data;
  } catch (error) {
    console.error("Error registrando acción:", error);

    return {
      ok: false,
      mensaje: error.message || "No se pudo registrar la acción."
    };
  }
}