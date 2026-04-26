import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const API_CATEGORIAS = `${API_URL}/api/categorias`;

export async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const data = await res.json();        
    return data //.categorias || [];
  } catch (error) {
    alert("ERROR CATEGORIAS: " + error);
    return [];
  }
}