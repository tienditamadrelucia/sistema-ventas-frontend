import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


const API = `${API_URL}/api/moneda`;
const APIURL = `${API_URL}/api`;

export const registrarMoneda = async (data) => {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // Manejo de respuesta de error HTTP
    if (!res.ok) {
      const detalle = await res.json().catch(() => null);
      const mensajeError = detalle?.mensaje || "Error en la respuesta del servidor";
      console.error(`Error al registrar moneda: ${mensajeError}`, detalle); // Log detallado para depuración
      return {
        ok: false,
        mensaje: mensajeError,
        detalle,
        status: res.status,
      };
    }
    // Respuesta exitosa
    const json = await res.json();
    return {
      ok: true,
      data: json,
    };
  } catch (error) {
    // Manejo de error de conexión
    console.error("❌ ERROR FETCH:", error);
    return {
      ok: false,
      mensaje: "No se pudo conectar con el servidor",
      detalle: error.message,
      status: "N/A",
    };
  }
};

// OBTENER MOVIMIENTOS (opcional)
export const obtenerMovimientos = async () => {
  try {
    const res = await axios.get(API);
    return res.data;
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    return { ok: false, mensaje: "Error en el servidor" };
  }
};

// OBTENER MOVIMIENTO POR ID (opcional)
export const obtenerMovimientoPorId = async (id) => {
  try {
    const res = await axios.get(`${API}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error obteniendo movimiento:", error);
    return { ok: false, mensaje: "Error en el servidor" };
  }
};

export const buscarPagoPorFactura = async (factura) => {
  try {
    const res = await fetch(`${API}/factura/${factura}`);
    const json = await res.json();
    if (!json.ok) return json;
    // Buscar el movimiento con operacion = "VENTA"
    const pago = json.lista.find(m => m.operacion === "VENTA");
    return { ok: true, pago: pago || null }; // Retornamos null si no hay pago
  } catch (e) {
    console.error("Error al buscar pago:", e.message);
    return { ok: false, mensaje: "No se pudo conectar" };
  }
};

export const buscarVueltoPorFactura = async (factura) => {
  try {
    const res = await fetch(`${API}/factura/${factura}`);
    const json = await res.json();
    if (!json.ok) return json;
    // Buscar el movimiento con operacion = "VUELTOS"
    const vuelto = json.lista.find(m => m.operacion === "VUELTOS");
    return { ok: true, vuelto: vuelto || null }; // Retornamos null si no hay vuelto
  } catch (e) {
    console.error("Error al buscar vuelto:", e.message);
    return { ok: false, mensaje: "No se pudo conectar" };
  }
};

export const actualizarMoneda = async (id, data) => {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, mensaje: "No se pudo conectar" };
  }
};

export const eliminarMoneda = async (id) => {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (error) {
    return { ok: false, error };
  }
};
