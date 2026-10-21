import axios from "axios";
import { API_URL } from "../config";

if (
  typeof window !== "undefined" &&
  !window.__sistemaVentasSesionConfigurada
) {
  const base = new URL(
    `${API_URL}/api`,
    window.location.href
  );

  const esAPI = url =>
    url.origin === base.origin &&
    (
      url.pathname === base.pathname ||
      url.pathname.startsWith(`${base.pathname}/`)
    );

  const fetchOriginal = window.fetch.bind(window);

  window.fetch = (entrada, opciones = {}) => {
    try {
      const direccion = entrada instanceof Request
        ? entrada.url
        : String(entrada);

      const url = new URL(
        direccion,
        window.location.href
      );

      if (
        esAPI(url) &&
        opciones.credentials === undefined
      ) {
        return fetchOriginal(entrada, {
          ...opciones,
          credentials: "include"
        });
      }
    } catch {
      // Mantener el comportamiento original
      // si la dirección no es válida.
    }

    return fetchOriginal(entrada, opciones);
  };

  axios.interceptors.request.use(config => {
    const url = new URL(
      config.url || "",
      config.baseURL || window.location.href
    );

    if (
      esAPI(url) &&
      config.withCredentials === undefined
    ) {
      config.withCredentials = true;
    }

    return config;
  });

  window.__sistemaVentasSesionConfigurada = true;
}