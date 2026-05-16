import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const ReporteVentas = () => {
  const navigate = useNavigate();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [reporte, setReporte] = useState([]);
  const [procesando, setProcesando] = useState(false);

  const consultar = async () => {
    setProcesando(true);
    if (!desde || !hasta) {
      alert("Debe seleccionar ambas fechas");
      return;
    }

    const resp = await fetch(
      `${API_URL}/api/ventas/resumen?desde=${desde}&hasta=${hasta}`
    );
    const datos = await resp.json();
    setReporte(datos);
    setProcesando(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      {procesando && (
        <div style={{
          background: "#6699FF",
          color: "white",
          padding: "8px",
          textAlign: "center",
          fontWeight: "bold",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          zIndex: 1000
        }}>
          Procesando, por favor espere...
        </div>
      )} 
      {/* FORMULARIO */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          Desde:
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>

        <label style={{ marginLeft: "20px", marginRight: "10px" }}>
          Hasta:
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>

        <button
          onClick={consultar}
          style={{
            marginLeft: "20px",
            padding: "6px 12px",
            backgroundColor: "#F9CEAE",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer"
          }}
        >
          Consultar
        </button>

        <button
          onClick={() => navigate("/menu")}
          style={{
            padding: "6px 12px",
            marginLeft: "10px",
            backgroundColor: "#D98897",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          Volver al Menú
        </button>
      </div>

      {/* ENCABEZADO */}
      {reporte.length > 0 && (
        <>
          <h2 style={{ textAlign: "center", margin: 0 }}>
            TIENDITA MADRE LUCÍA – V10166638-3
          </h2>

          <p style={{ textAlign: "center", marginTop: "5px", marginBottom: "20px" }}>
            <strong>Resumen de Ventas</strong><br />
            Desde: {desde} — Hasta: {hasta}
          </p>

          {/* TABLA */}
          <table style={{ width: "80% !important", borderCollapse: "collapse", margin: "0 auto" }}>
            <thead style={{ backgroundColor: "#F9CEAE" }}>
              <tr>
                <th style={{ padding: "4px" }}>Fecha</th>
                <th style={{ padding: "4px", textAlign:"right" }}>Dólares</th>
                <th style={{ padding: "4px", textAlign:"right" }}>Bolívares</th>
                <th style={{ padding: "4px", textAlign:"right" }}>Pesos</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px", fontSize: "10px" }}>{r.fecha}</td>
                  <td style={{ padding: "4px", textAlign:"right", fontSize: "10px" }}>{r.dolares.toFixed(2)}</td>
                  <td style={{ padding: "4px", textAlign:"right", fontSize: "10px" }}>{r.bolivares.toFixed(2)}</td>
                  <td style={{ padding: "4px", textAlign:"right", fontSize: "10px" }}>{r.pesos.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  );
};

export default ReporteVentas;
