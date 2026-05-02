import React, { useState, useEffect } from "react";
import { dateToDDMMYYYY, obtenerFechaLocalComoDate } from "../utils/fechaLocal";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta


const Encabezado = () => {
  
  // Nombre del usuario
  const nombre = localStorage.getItem("usuarioNombre") || "Usuario";


  // Fecha larga
  const hoy = obtenerFechaLocalComoDate().toLocaleDateString("es-VE", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});
         // "2026-04-17"  

  // Estados para caja chica y tasas
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
        // Nombres EXACTOS según tu modelo:
        // fecha, cajachicaP, cajachicaD, tasaP, tasaD
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

    {/* ─────────────── LÍNEA 1 ─────────────── */}
    <div
      style={{
        display: "flex",       
        justifyContent:"space-between", 
        alignItems: "center",
        marginBottom: "5px"
      }}
    >
      {/* Usuario a la izquierda */}
      <div style={{ fontWeight: "bold", fontSize: "16px", textTransform: "capitalize" }}>
        {nombre}
      </div>

      {/* Fecha + BOTONES DE ZOOM */}
<div style={{ 
  marginLeft:"auto", 
  fontSize:"16px", 
  fontWeight: "bold", 
  textTransform: "capitalize",
  display: "flex",
  alignItems: "center",
  gap: "10px"
}}>
  <span>{hoy}</span>

  {/* ⭐ BOTONES DE ZOOM DENTRO DEL ENCABEZADO ⭐ */}
  <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 1 }))} 
    style={{ padding: "4px 6px", fontSize: "12px" }}>
    100%
  </button>

  <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 0.85 }))} 
    style={{ padding: "4px 6px", fontSize: "12px" }}>
    85%
  </button>

  <button onClick={() => window.dispatchEvent(new CustomEvent("setZoom", { detail: 0.75 }))} 
    style={{ padding: "4px 6px", fontSize: "12px" }}>
    75%
  </button>
</div>


    {/* ─────────────── LÍNEA 2 ─────────────── */}
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