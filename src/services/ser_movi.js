import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


export async function Consultar(productoId, fechaInicio, fechaFin) {
  try {    
    const url = '${API_URL}/api/movimientos/${productoId}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}';

    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
        
    //alert("RESPUESTA DEL SERVIDOR:\n" + texto);

    const data = await res.json();

    // El backend devuelve movimientosArray, no "movimientos"
    return data.movimientosArray || [];

  } catch (error) {
    alert("Error consultando movimientos services: " + error.message);
    return [];
  }
}