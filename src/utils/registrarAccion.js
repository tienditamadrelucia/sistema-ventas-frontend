import { API_URL } from "../config";

export async function registrarAccion(accion) {
  const usuario = localStorage.getItem("usuarioNombre") || "Desconocido";

  try {
    const res = await fetch(`${API_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario,
        accion,
        fecha: new Date()
      })
    });

    if (!res.ok) {
      console.error("No se pudo registrar la acción:", accion);
    }

    return true;

  } catch (error) {
    console.error("Error registrando acción:", error);
    return false;
  }
}
