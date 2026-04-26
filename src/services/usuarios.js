import { API_URL } from "../config";

const API = `${API_URL}/api/usuarios`;

export async function obtenerUsuarios() {
  const res = await fetch(API);
  return await res.json();
}

export async function crearUsuario(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function actualizarUsuario(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function eliminarUsuario(id) {
  return await fetch(`${API}/${id}`, {
    method: "DELETE"
  });
}

export async function buscarUsuario(usuario, clave) {  
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, clave })
    });
    console.log("Respuesta de la API:", res);
    if (!res.ok) {
      return {ok: false, mensaje: "Frontend: Error en la respuesta del servidor"};
    }
    const data=await res.json();
    console.log("Datos de respuesta: ", data);
    return data;    
  } catch (error) {
      console.error("Frontend: Error en buscarUsuario:", error);
      return { ok: false, mensaje: error.message }; // Asegúrate de que siempre devuelves un objeto    
  }
}
