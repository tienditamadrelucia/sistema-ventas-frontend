import { API_URL } from "../config";

// Usar la misma función que registra usuario, acción y sede.
export { registrarAccion } from "../utils/registrarAccion";

// Conservar esta función por compatibilidad.
export async function buscarUsuario(usuario, clave) {
  const res = await fetch(`${API_URL}/api/usuarios/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usuario, clave })
  });

  return await res.json();
}