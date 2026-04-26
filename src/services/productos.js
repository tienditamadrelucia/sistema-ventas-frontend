import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const API_PRODUCTOS = `${API_URL}/api/productos`;

export async function cargarProductos() {
  const res = await fetch(API_PRODUCTOS);
  return res.json();
}

const API_CATEGORIAS = `${API_URL}/api/categorias`;

export async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const data = await res.json();
    alert("RESPUESTA RAW de services/productos: " + JSON.stringify(data));
    if (!data.ok) {
      console.error("Error cargando categorías:", data);
      return [];
    }
    return data.categorias; // [{ _id, codigo, descripcion }]
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return [];
  }
}