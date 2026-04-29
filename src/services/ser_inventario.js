import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

// DEFINIR API_URL AQUÍ (no usar config.js)
const APIURL = `${API_URL}/api`;
const API = `${API_URL}/inventario`;

// Obtener productos + tomas existentes + stock final del sistema
export const obtenerInventario = async (categoria) => {
  const url = `${API_URL}/api/inventario?categoria=${categoria}`;
  const { data } = await axios.get(url);
  console.log("data obtener inventario ", data);
  
  // Calcular stock final del sistema
  const productosCalculados = data.productos.map(p => {
    const stockInicial = Number(p.stock) || 0;
    const entradas = Number(p.totalEntradas) || 0;
    const salidas = Number(p.totalSalidas) || 0;
    const vendidos = Number(p.totalVendidos) || 0;
    const stockFinal = stockInicial + entradas - salidas - vendidos;
    return {
      ...p,
      stockReal: stockFinal
    };
  });
  return {
    ok: true,
    productos: productosCalculados
  };
  return data;  
};

export const buscarInventarioGuardado = async (fecha, categoria) => {
  const url = `${API_URL}/api/inventario/buscar?fecha=${fecha}&categoria=${categoria}`;
  const { data } = await axios.get(url);
  return data;
};

export const guardarInventario = async (payload) => {  
  const url = `${API_URL}/api/inventario/guardar`;
  const { data } = await axios.post(url, payload);
  return data;
};

// Eliminar una toma existente
export async function eliminarTomaInventario(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  return await res.json();
}

export async function crearEntrada({ fecha, productoId, cantidad, observacion }) {
  try {
    const res = await fetch(`${API_URL}/api/entradas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha,
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
        fecha,
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