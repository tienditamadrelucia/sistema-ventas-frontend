// src/services/entradas.js
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


const API_ENTRADAS = `${API_URL}/api/entradas`;

// ===============================
// CARGAR ENTRADAS (PAGINADAS)
// ===============================
export async function cargarEntradas(page = 1, limit = 20) {
  try {
    const res = await fetch(
      `${API_ENTRADAS}?page=${page}&limit=${limit}`
    );
    const data = await res.json();
    // Si no vienen entradas, devolvemos estructura compatible con el backend
    if (!data.entradas) {
      console.error("Error cargando entradas:", data);
      return { entradas: [], page: 1, totalPages: 1 };
    }
    return data; // ✔ devuelve { total, page, totalPages, entradas }
  } catch (error) {
    alert(error + "Error cargando entradas");
    return { entradas: [], page: 1, totalPages: 1 };
  }
}

//export async function cargarEntradas(page = 1, fecha = "", limit = 20) {
  //try {
    //const res = await fetch(
      //`${API_ENTRADAS}?page=${page}&limit=${limit}&fecha=${fecha}`
    //);
    //const data = await res.json();
    // Si no vienen entradas, devolvemos estructura compatible con el backend
    //if (!data.entradas) {
      //console.error("Error cargando entradas:", data);
      //return { entradas: [], page: 1, totalPages: 1 };
   // }
    //return data; // ✔ devuelve { total, page, totalPages, entradas }
  //} catch (error) {
   // alert(error + "Error cargando entradas");
    ///return { entradas: [], page: 1, totalPages: 1 };
 // }
//}


// ===============================
// CREAR ENTRADA
// ===============================
export async function crearEntrada(data) {
  try {
    const res = await fetch(API_ENTRADAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data})
    });

    return await res.json();
  } catch (error) {
    alert(error + "Error creando entrada");
    return { ok: false, error: "Error creando entrada" };
  }
}

// ===============================
// ACTUALIZAR ENTRADA
// ===============================
export async function actualizarEntrada(id, data) {
  try {
    const res = await fetch(`${API_ENTRADAS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data})
    });

    return await res.json();
  } catch (error) {
    alert(error + "Error actualizando entrada");
    return { ok: false, error: "Error actualizando entrada" };
  }
}

// ===============================
// ELIMINAR ENTRADA
// ===============================
export async function eliminarEntradaApi(id) {
  try {
    const res = await fetch(`${API_ENTRADAS}/${id}`, {
      method: "DELETE"
    });

    return await res.json();
  } catch (error) {
    alert(error + "Error eliminando entrada");
    return { ok: false, error: "Error eliminando entrada" };
  }
}