import React, { useState, useEffect } from "react";
import { obtenerFechaLocalComoDate } from "../utils/fechaLocal";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Encabezado = () => {
  const nombre = localStorage.getItem("usuarioNombre") || "Usuario";
  
  const hoy = obtenerFechaLocalComoDate().toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const [cajaDolarHeader, setCajaDolarHeader] = useState(null);
  const [cajaPesoHeader, setCajaPesoHeader] = useState(null);
  const [tasaDolarHeader, setTasaDolarHeader] = useState(null);
  const [tasaPesoHeader, setTasaPesoHeader] = useState(null);

  const formatoVE = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  useEffect(() => {
    async function cargarTasas() {
      try {
        const res = await fetch(`${API_URL}/api/tasas/hoy`);        
        if (!res.ok) {
          console.log("No hay tasas registradas hoy");
          return;
        }
        const data = await res.json();
        if (!data.tasa) {
          console.log("No hay tasas registradas hoy");
          return;
        }        
        setCajaDolarHeader(data.tasa.cajachicaD);
        setCajaPesoHeader(data.tasa.cajachicaP);
        setTasaDolarHeader(data.tasa.tasaD);
        setTasaPesoHeader(data.tasa.tasaP);
      } catch (error) {
        console.log("Error cargando tasas del encabezado:", error);
      }
    }
    cargarTasas();
  }, []);    

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#6699FF",
        padding: "8px 20px",
        color: "white",
        borderRadius: "0 0 8px 8px",
        marginBottom: "20px",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          display: "flex",       
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "5px"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "16px", textTransform: "capitalize" }}>
          {nombre}
        </div>

        {/* Contenedor para Fecha y Botones de Zoom */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          fontWeight: "bold",
          gap: "10px", // Espacio entre la fecha y los botones
        }}>
          <span style={{ fontSize: "16px" }}>{hoy}</span>          
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "25px",
          fontSize: "13px",
          fontWeight: "bold"
        }}
      >
        <div><strong>Caja Chica $:</strong> {cajaDolarHeader ? formatoVE.format(cajaDolarHeader) : "—"}</div>
        <div><strong>Caja Chica Pesos:</strong> {cajaPesoHeader ? formatoVE.format(cajaPesoHeader) : "—"}</div>
        <div><strong>Tasa $:</strong> {tasaDolarHeader ? formatoVE.format(tasaDolarHeader) : "—"}</div>
        <div><strong>Tasa Pesos:</strong> {tasaPesoHeader ? formatoVE.format(tasaPesoHeader) : "—"}</div>
      </div>
    </div>
  );
};

export default Encabezado;