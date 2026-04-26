export const manejarError = (error) => {
  console.log("ERROR COMPLETO:", error);

  // 1. Error de red (backend caído, CORS, DNS, timeout)
  if (error.message === "Network Error" || !error.response) {
    alert(
      "❌ No se pudo conectar con el servidor.\n\n" +
      "Posibles causas:\n" +
      "- Backend apagado\n" +
      "- Puerto incorrecto\n" +
      "- Problemas de red\n" +
      "- CORS bloqueando la petición\n\n" +
      "Verifica el backend antes de continuar."
    );
    return;
  }

  // 2. Error con respuesta del backend
  const mensaje =
    error.response.data?.mensaje ||
    error.response.data?.error ||
    "Error desconocido en el servidor";

  alert("❌ Error del servidor: " + mensaje);
};
