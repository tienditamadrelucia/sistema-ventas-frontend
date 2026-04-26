// src/services/ser_gastos.js
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


const APIURL = `${API_URL}/api/gastos`;

// -------------------------------------
// OBTENER TODOS LOS GASTOS
// -------------------------------------
export async function obtenerGastos() {
  try {
    const res = await fetch(APIURL);
    const data = await res.json();
    return data; // { ok, lista }
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return { ok: false, lista: [] };
  }
}

// -------------------------------------
// CREAR GASTO
// -------------------------------------
export async function crearGasto(gasto) {
  try {
    const res = await fetch(APIURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gasto)
    });

    return await res.json();
  } catch (error) {
    console.error("Error creando gasto:", error);
    return { ok: false };
  }
}

// -------------------------------------
// ACTUALIZAR GASTO
// -------------------------------------
export async function actualizarGasto(id, gasto) {
  try {
    const res = await fetch(`${APIURL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gasto)
    });

    return await res.json();
  } catch (error) {
    console.error("Error actualizando gasto:", error);
    return { ok: false };
  }
}

// -------------------------------------
// ELIMINAR GASTO
// -------------------------------------
export async function eliminarGasto(id) {
  try {
    const res = await fetch(`${APIURL}/${id}`, {
      method: "DELETE"
    });

    return await res.json();
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    return { ok: false };
  }
}
