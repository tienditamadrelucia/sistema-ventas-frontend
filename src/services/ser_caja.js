
import { API_URL } from "../config";
const API = `${API_URL}/api/caja`;

export const obtenerCuadre = async (fecha, sede = "TIENDITA") => {
  const res = await fetch(`${API}/${fecha}?sede=${encodeURIComponent(sede)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.mensaje || data.message || `Error consultando caja: ${res.status}`);
  }
  return data;
};

export const guardarCuadre = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const texto = await res.text();
  let resultado;
  try {
    resultado = JSON.parse(texto);
  } catch {
    resultado = { mensaje: texto };
  }
  if (!res.ok) {
    console.error("ERROR DEL SERVIDOR AL GUARDAR CAJA:", {
      estado: res.status,
      respuesta: resultado,
      datosEnviados: data
    });
    const detalle = resultado.error || resultado.mensaje || resultado.message || JSON.stringify(resultado);
    throw new Error(`Error ${res.status}: ${typeof detalle === "string" ? detalle : JSON.stringify(detalle)}`);
  }
  return resultado;
};
