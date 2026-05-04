import axios from "axios";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


const API_VENTAS = `${API_URL}/api/ventas`;
const API_VENDIDOS = `${API_URL}/api/vendidos`;

export const guardarVentaService = (data) => axios.post(API_VENTAS, data);

export const guardarProductoVendidoService = (data) =>
  axios.post(API_VENDIDOS, data); 

export const buscarVentasDelDia = async (fecha) => {
  const url = `${API_URL}/api/ventas/${fecha}`;
  const { data } = await axios.get(url);
  return data;
};
