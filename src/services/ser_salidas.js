// services/ser_salidas.js
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const API_SALIDAS = `${API_URL}/api/salidas`;

// GET paginado
export async function cargarSalidas(page = 1, fecha = "") {
  try {
    const res = await fetch(`${API_SALIDAS}?page=${page}&fecha=${fecha}`);
    const data = await res.json();
    // El backend NO devuelve "ok" en el GET
    if (!data.salidasdb) {
      console.error("Error cargando salidas", data);
      return { salidasdb: [], paginaActual: 1, totalPaginas: 1 };
    }
    return data;
  } catch (error) {
    alert(error + "Error cargando salidas");
    return { salidasdb: [], paginaActual: 1, totalPaginas: 1 };
  }
}

// POST crear
export async function crearSalida(data) {
  try {
    const res = await fetch(API_SALIDAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error) {
    return { ok: false, error: "Error creando salida en services" };
  }
}

// PUT actualizar
export async function actualizarSalida(id, data) {
  try {
    const res = await fetch(`${API_SALIDAS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error) {
    alert(error + "Error actualizando salida");
    return { ok: false, error: "Error actualizando salida" };
  }
}

// DELETE eliminar
export async function eliminarSalidaApi(id) {
  try {
    const res = await fetch(`${API_SALIDAS}/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (error) {
    alert(error + "Error eliminando salida");
    return { ok: false, error: "Error eliminando salida" };
  }
}