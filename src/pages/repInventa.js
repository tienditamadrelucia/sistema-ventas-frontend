import React, { useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const ReporteInventario = () => {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState([]);

  const consultar = async () => {
    const resp = await fetch(`${API_URL}/api/inventario/reporte`);
    const datos = await resp.json();
    setReporte(datos);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>

      {/* BOTONES */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={consultar}
          style={{
            padding: "6px 12px",
            backgroundColor: "#F9CEAE",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Consultar
        </button>

        <button
          onClick={() => navigate("/menu")}
          style={{
            padding: "6px 12px",
            backgroundColor: "#D98897",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Arial Black",
            cursor: "pointer"
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
            <strong>Reporte de Inventario</strong>
          </p>

          {/* TABLA */}
          <table style={{ width: "80% !important", borderCollapse: "collapse", margin: "0 auto" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px" }}>Código</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Categoría</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Descripción</th>
                <th style={{ textAlign: "center", padding: "4px" }}>Stock Real</th>
                <th style={{ textAlign: "right", padding: "4px" }}>Costo</th>
                <th style={{ textAlign: "right", padding: "4px" }}>Venta</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((p) => (
                <tr key={p._id}>
                  <td style={{ padding: "4px", fontSize: "10px" }}>
                    {p.codigo}
                  </td>

                  <td style={{ padding: "4px", fontSize: "10px" }}>
                    {p.categoria}
                  </td>

                  <td style={{ padding: "4px", fontSize: "10px" }}>
                    {p.descripcion}
                  </td>

                  <td style={{ padding: "4px", textAlign:"center", fontSize: "10px" }}>
                    {p.stock}
                  </td>

                  <td style={{ padding: "4px", textAlign:"right", fontSize: "10px" }}>
                    {Number(p.costo).toFixed(2)}
                  </td>

                  <td style={{ padding: "4px", textAlign:"right", fontSize: "10px" }}>
                    {Number(p.venta).toFixed(2)}
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

export default ReporteInventario;
