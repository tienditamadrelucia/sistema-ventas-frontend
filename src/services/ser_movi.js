import { API_URL } from "../config";

// CONSULTAR MOVIMIENTOS DE UN PRODUCTO
export async function Consultar(
  productoId,
  fechaInicio,
  fechaFin,
  sede = "TIENDITA"
) {
  try {
    const url =
      `${API_URL}/api/movimientos/${productoId}` +
      `?fechaInicio=${fechaInicio}` +
      `&fechaFin=${fechaFin}` +
      `&sede=${encodeURIComponent(sede)}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    return data.movimientos || [];

  } catch (error) {
    console.log("ERROR MOVIMIENTOS:", error);
    alert("Error consultando movimientos services: " + error.message);
    return [];
  }
}