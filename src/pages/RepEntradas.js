import React, { useState } from "react";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const ReporteEntradas = () => {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reporte, setReporte] = useState([]);

  const consultar = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Debe seleccionar ambas fechas");
      return;
    }

    const resp = await fetch(
      `${API_URL}/api/entradas/reporte?desde=${fechaDesde}&hasta=${fechaHasta}`
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
            backgroundColor: "#D98897",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer"
          }}
        >
          Consultar
        </button>
      </div>

      {/* ENCABEZADO */}
      {reporte.length > 0 && (
        <>
          <h2 style={{ textAlign: "center", margin: 0 }}>
            TIENDITA MADRE LUCÍA – V10166638-3
          </h2>

          <p style={{ textAlign: "center", marginTop: "5px", marginBottom: "20px" }}>
            <strong>Reporte de Entradas</strong><br />
            Desde: {fechaDesde} — Hasta: {fechaHasta}
          </p>

          {/* TABLA SIN BORDES */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  <td style={{ padding: "4px" }}>
                    {new Date(e.fecha).toLocaleDateString("es-VE")}
                  </td>

                  <td style={{ padding: "4px" }}>
                    {e.categoria}
                  </td>

                  <td style={{ padding: "4px" }}>
                    {e.productoId?.codigo || e.codigo}
                  </td>

                  <td style={{ padding: "4px" }}>
                    {e.productoId?.descripcion}
                  </td>

                  <td style={{ padding: "4px", textAlign: "right" }}>
                    {e.cantidad}
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

export default ReporteEntradas;
