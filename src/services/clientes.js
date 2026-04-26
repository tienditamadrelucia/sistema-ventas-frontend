import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const API = `${API_URL}/api/clientes`;

export async function obtenerClientes(page = 1) {
  const res = await fetch(`${API}?page=${page}&limit=20`);
  return res.json();
}

export async function TodosClientes() {
  try {
    const res = await fetch(`${API}/todos`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.clientes)) return data.clientes;
    return [];
  } catch (error) {
    alert("ERROR en clientes: " + error);
    return [];
  }
}

export async function crearCliente(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function actualizarCliente(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  let respuesta;
  try {
    respuesta = await res.json();
  } catch (e) {
    respuesta = "❌ No se pudo convertir la respuesta a JSON";
  }  
  return respuesta;
}

export async function eliminarCliente(id, usuarioActual) {
  const res = await fetch(`${API}/${id}?usuarioActual=${usuarioActual}`, {
    method: "DELETE"
  });
    const data = await res.json();    
  return data;
}