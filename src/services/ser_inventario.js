import axios from "axios";
import { API_URL } from "../config";

const API = `${API_URL}/inventario`;

// =====================================
// OBTENER INVENTARIO POR SEDE
// =====================================
export const obtenerInventario = async (categoria, sede = "TIENDITA") => {
  const url =
    `${API_URL}/api/inventario?categoria=${encodeURIComponent(categoria)}` +
    `&sede=${encodeURIComponent(sede)}`;

  const { data } = await axios.get(url);

  console.log("data obtener inventario ", data);

  // Calcular stock final del sistema
  const productosCalculados = data.productos.map((p) => {
    const stockInicial = Number(p.stock) || 0;
    const entradas = Number(p.totalEntradas) || 0;
    const salidas = Number(p.totalSalidas) || 0;
    const vendidos = Number(p.totalVendidos) || 0;

    const stockFinal =
      stockInicial + entradas - salidas - vendidos;

    return {
      ...p,
      stockReal: stockFinal
    };
  });

  return {
    ok: true,
    productos: productosCalculados
  };
};


// =====================================
// BUSCAR INVENTARIO GUARDADO POR SEDE
// =====================================
export const buscarInventarioGuardado = async (
  fecha,
  categoria,
  sede = "TIENDITA"
) => {
  const url =
    `${API_URL}/api/inventario/buscar?fecha=${encodeURIComponent(fecha)}` +
    `&categoria=${encodeURIComponent(categoria)}` +
    `&sede=${encodeURIComponent(sede)}`;

  const { data } = await axios.get(url);

  return data;
};


// =====================================
// GUARDAR INVENTARIO
// El payload ya contiene sede
// =====================================
export const guardarInventario = async (payload) => {
  const url = `${API_URL}/api/inventario/guardar`;

  const { data } = await axios.post(url, payload);

  return data;
};


// =====================================
// ELIMINAR TOMA EXISTENTE
// =====================================
export async function eliminarTomaInventario(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });

  return await res.json();
}


// =====================================
// CREAR ENTRADA POR AJUSTE
// =====================================
export async function crearEntrada({
  fecha,
  productoId,
  cantidad,
  observacion,
  sede
}) {
  console.log("DATA AJUSTE ENTRADA:", {
    fecha,
    productoId,
    cantidad,
    observacion,
    sede
  });

  try {
    const res = await fetch(`${API_URL}/api/entradas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fecha,
        productoId,
        cantidad,
        observacion,
        sede
      })
    });

    if (!res.ok) {
      throw new Error("Error creando entrada");
    }

    return await res.json();

  } catch (error) {
    console.error(
      "ERROR CREAR ENTRADA:",
      error.response?.data || error.message
    );

    throw error;
  }
}


// =====================================
// CREAR SALIDA POR AJUSTE
// =====================================
export async function crearSalida({
  fecha,
  productoId,
  cantidad,
  observacion,
  sede
}) {
  console.log("DATA AJUSTE SALIDA:", {
    fecha,
    productoId,
    cantidad,
    observacion,
    sede
  });

  try {
    const res = await fetch(`${API_URL}/api/salidas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fecha,
        productoId,
        cantidad,
        observacion,
        sede
      })
    });

    if (!res.ok) {
      throw new Error("Error creando salida");
    }

    return await res.json();

  } catch (error) {
    console.error("Error en crearSalida:", error);
    throw error;
  }
}