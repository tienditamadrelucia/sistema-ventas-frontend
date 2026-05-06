import { API_URL } from "../config"; // ajusta la ruta según tu carpeta
import axios from "axios";

const API_TASAS = `${API_URL}/api/tasas`;

// 📌 Consultar tasa del día
export const obtenerTasaHoy = async () => {
  const res = await fetch(`${API_TASAS}/hoy`);
  return await res.json();
}; 

// 📌 Guardar tasas del día
export const guardarTasas = async (datos) => {
  const res = await fetch(`${API_TASAS}/guardar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return await res.json();
};

// 📌 Modificar tasas del día
export const modificarTasas = async (datos) => {
  const res = await fetch(`${API_TASAS}/modificar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return await res.json();
};

// 📌 Obtener historial
export const obtenerHistorialTasas = async () => {
  const res = await fetch(`${API_TASAS}/todas`);
  return await res.json();
};

export const cargarTasasPorFecha = async (fecha) => {
  try {
    const res = await axios.get(`${API_TASAS}/por-fecha/${fecha}`);
    return res.data.tasa;   // si existe, la devuelve
  } catch (error) {
    console.log("🔥 ERROR COMPLETO:", error.response?.status, error.response?.data);
    // ⭐ SI ES 404 → NO HAY TASAS → devolver null
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error("Error cargando tasas por fecha:", error);
    return null;
  }
};
