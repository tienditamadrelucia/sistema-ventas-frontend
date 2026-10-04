// src/utils/fechaVenezuela.js

const ZONA_HORARIA_VENEZUELA = "America/Caracas";

// Devuelve YYYY-MM-DD
export const obtenerFechaVenezuela = () => {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_VENEZUELA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const valores = {};

  partes.forEach((parte) => {
    if (parte.type !== "literal") {
      valores[parte.type] = parte.value;
    }
  });

  return `${valores.year}-${valores.month}-${valores.day}`;
};

// Devuelve HH:MM:SS
export const obtenerHoraVenezuela = () => {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: ZONA_HORARIA_VENEZUELA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
};

export const obtenerFechaCompletaVenezuela = () => {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());
};