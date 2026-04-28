import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

// DEFINIR API_URL AQUÍ (no usar config.js)
const APIURL = `${API_URL}/api`;
const API = `${API_URL}/inventario`;

// Obtener productos + tomas existentes + stock final del sistema
export const obtenerInventario = async (fecha, categoria) => {
  const url = `${APIURL}/inventario?fecha=${fecha}&categoria=${categoria}`;
  const respuesta = await axios.get(url);
  return respuesta.data;
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

export async function crearEntrada({ productoId, cantidad, observacion }) {
  try {
    const res = await fetch(`${API_URL}/api/entradas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productoId,
        cantidad,
        observacion
      })
    });

    if (!res.ok) throw new Error("Error creando entrada");

    return await res.json();

  } catch (error) {
    console.error("Error en crearEntrada:", error);
    throw error;
  }
}

export async function crearSalida({ productoId, cantidad, observacion }) {
  try {
    const res = await fetch(`${API_URL}/api/salidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productoId,
        cantidad,
        observacion
      })
    });

    if (!res.ok) throw new Error("Error creando salida");

    return await res.json();

  } catch (error) {
    console.error("Error en crearSalida:", error);
    throw error;
  }
}