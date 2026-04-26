import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const API = '${API_URL}/api/caja';

export const obtenerCuadre = async (fecha) => {
  console.log("fecha ", fecha);
  const res = await fetch(`${API}/${fecha}`);
  if (!res.ok) {
    throw new Error(`Error consultando caja: ${res.status}`);
  }
  const data = await res.json();
  return data;
};

export const guardarCuadre = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(`Error guardando caja: ${res.status}`);
  }
  const json = await res.json();
  return json;
};
