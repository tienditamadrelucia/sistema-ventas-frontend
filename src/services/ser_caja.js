
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
  const resultado = await res.json();
  if (!res.ok) throw new Error(resultado.mensaje || resultado.error || `Error ${res.status}`);
  return resultado;
};
