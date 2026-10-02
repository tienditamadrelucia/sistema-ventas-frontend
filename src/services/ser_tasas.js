import { API_URL } from "../config";
import axios from "axios";

const API_TASAS = `${API_URL}/api/tasas`;


// ======================================================
// CONSULTAR TASA DEL DÍA POR SEDE
// ======================================================

export const obtenerTasaHoy = async (sede) => {
  const res = await fetch(
    `${API_TASAS}/hoy?sede=${encodeURIComponent(sede)}`
  );

  return await res.json();
};


// ======================================================
// GUARDAR TASAS DEL DÍA
// La sede ya viene dentro de "datos"
// ======================================================

export const guardarTasas = async (datos) => {
  const res = await fetch(`${API_TASAS}/guardar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  });

  return await res.json();
};


// ======================================================
// MODIFICAR TASAS DEL DÍA
// ======================================================

export const modificarTasas = async (datos) => {
  const res = await fetch(
    `${API_TASAS}/modificar/${datos._id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    }
  );

  return await res.json();
};


// ======================================================
// OBTENER HISTORIAL POR SEDE
// ======================================================

export const obtenerHistorialTasas = async (sede) => {
  const res = await fetch(
    `${API_TASAS}/todas?sede=${encodeURIComponent(sede)}`
  );

  return await res.json();
};


// ======================================================
// CARGAR TASAS POR FECHA Y SEDE
// ======================================================

export const cargarTasasPorFecha = async (fecha, sede) => {

  console.log(
    "👉 cargarTasasPorFecha:",
    fecha,
    "Sede:",
    sede
  );

  try {

    const res = await axios.get(
      `${API_TASAS}/por-fecha/${fecha}`,
      {
        params: {
          sede: sede
        }
      }
    );

    console.log("✅ Respuesta backend:", res.data);

    return res.data.tasa;

  } catch (error) {

    console.log(
      "🔥 ERROR:",
      error.response?.status,
      error.response?.data
    );

    if (
      error.response &&
      error.response.status === 404
    ) {
      console.log(
        "⚠️ No hay tasas para esta fecha y sede"
      );

      return null;
    }

    console.error(
      "Error cargando tasas por fecha:",
      error
    );

    return null;
  }
};