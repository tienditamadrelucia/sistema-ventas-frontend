import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const ReporteSalidas = () => {
  const navigate = useNavigate();
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reporte, setReporte] = useState([]);

  const consultar = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Debe seleccionar ambas fechas");
      return;
    }

    const resp = await fetch(
      `${API_URL}/api/salidas/reporte?desde=${fechaDesde}&hasta=${fechaHasta}`
    );
    const datos = await resp.json();
    setReporte(datos);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>

      {/* FORMULARIO */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          Desde:
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>

        <label style={{ marginLeft: "20px", marginRight: "10px" }}>
          Hasta:
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
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
            <strong>Reporte de Salidas</strong><br />
            Desde: {fechaDesde} — Hasta: {fechaHasta}
          </p>

          {/* TABLA */}
          <table style={{ width: "80% !important", borderCollapse: "collapse", margin: "0 auto" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px" }}>Fecha</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Categoría</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Código</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Descripción</th>
                <th style={{ textAlign: "right", padding: "4px" }}>Cantidad</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((e) => (
                <tr key={e._id}>
                  <td style={{ padding: "4px", fontSize: "10px" }}>
                    {new Date(e.fecha).toLocaleDateString("es-VE")}
                  </td>

                  <td style={{ padding: "4px", textAlign:"center", fontSize: "10px" }}>
                    {e.categoria}
                  </td>

                  <td style={{ padding: "4px", textAlign:"center", fontSize: "10px" }}>
                    {e.productoId?.codigo || e.codigo}
                  </td>

                  <td style={{ padding: "4px", fontSize: "10px" }}>
                    {e.productoId?.descripcion}
                  </td>

                  <td style={{ padding: "4px", textAlign: "center", fontSize: "10px" }}>
                    {Number(e.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  );
};

export default ReporteSalidas;
