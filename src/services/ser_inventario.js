import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

// DEFINIR API_URL AQUÍ (no usar config.js)
const APIURL = `${API_URL}/api`;
const API = `${API_URL}/inventario`;

// Obtener productos + tomas existentes + stock final del sistema
export const obtenerInventario = async (fecha, categoria) => {
  try {
    const url = `${APIURL}/inventario?fecha=${fecha}&categoria=${categoria}`;
    
  axios.defaults.withCredentials = false;
  axios.defaults.baseURL = "";


    const respuesta = await axios.get(url, { withCredentials: false });    
    return respuesta.data;

  } catch (error) {
    alert("5️⃣❌ ERROR AXIOS: " + JSON.stringify(error.response?.data));
    throw error;
  }
};

// Guardar una toma nueva
export async function guardarTomaInventario(formData) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
  return await res.json();
}

// Editar una toma existente
export async function editarTomaInventario(id, formData) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
  return await res.json();
}

// Eliminar una toma existente
export async function eliminarTomaInventario(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  return await res.json();
}