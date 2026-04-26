import { API_URL } from "../config"; 

export async function registrarAccion(accion) {
  await fetch(`${API_URL}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: localStorage.getItem("usuarioNombre") || "Desconocido",
      accion,
      fecha: new Date()
    })
  });
}

export async function buscarUsuario(usuario, clave) {
  const res = await fetch(`${API_URL}/api/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, clave })
  });

  return await res.json();
}
