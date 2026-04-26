import { API_URL } from "../config";

export async function registrarAccion(accion) {
  const usuario = localStorage.getItem("usuarioNombre") || "Desconocido";

  await fetch(`${API_URL}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario,
      accion,
      fecha: new Date()
    })
  });
}

