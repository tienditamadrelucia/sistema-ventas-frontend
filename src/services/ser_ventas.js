import axios from "axios";
import { API_URL } from "../config";

const API_VENTAS = `${API_URL}/api/ventas`;
const API_VENDIDOS = `${API_URL}/api/vendidos`;

export const guardarVta = data =>
  axios.post(API_VENTAS, data, {
    withCredentials: true
  });

export const guardarVendido = data =>
  axios.post(API_VENDIDOS, data, {
    withCredentials: true
  });

export const buscarVentasDelDia = async (fecha, sede) => {
  const { data } = await axios.get(
    `${API_URL}/api/moneda/fecha/${encodeURIComponent(fecha)}`,
    {
      params: { sede },
      withCredentials: true
    }
  );

  return data;
};