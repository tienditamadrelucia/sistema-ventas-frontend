import React, { useState } from "react";
import { API_URL } from "../config";

const formatoVE = (num) => {
  return Number(num).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Utilidad = () => {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [reporte, setReporte] = useState({});
  const [cargando, setCargando] = useState(false);

  const buscar = async () => {
    if (!desde || !hasta) {
      alert("Seleccione ambas fechas");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(
        `${API_URL}/api/ventas/reporte-categoria?desde=${desde}&hasta=${hasta}`
      );
      const data = await res.json();

      if (!data.ok) {
        alert("No se pudo generar el reporte");
        setCargando(false);
        return;
      }

      setReporte(data.reporte);
    } catch (error) {
      console.error("ERROR REPORTE FRONTEND:", error);
      alert("Error al obtener el reporte");
    }

    setCargando(false);
  };

  // ============================
  // TOTALES GENERALES
  // ============================
  const totalesGenerales = () => {
    let totalP = 0, totalBs = 0, totalD = 0, utilidadGeneral = 0;

    Object.values(reporte).forEach(cat => {
      Object.values(cat).forEach(prod => {
        totalP += prod.totalP;
        totalBs += prod.totalBs;
        totalD += prod.totalD;
        utilidadGeneral += prod.utilidad;
      });
    });

    return { totalP, totalBs, totalD, utilidadGeneral };
  };

  const { totalP, totalBs, totalD, utilidadGeneral } = totalesGenerales();

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Reporte de Utilidad por Categoría y Producto</h2>

      {/* Filtros */}
      <div style={{ marginBottom: "20px" }}>
        <label>Desde: </label>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />

        <label style={{ marginLeft: "20px" }}>Hasta: </label>
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />

        <button onClick={buscar} style={{ marginLeft: "20px" }}>
          Buscar
        </button>
      </div>

      {cargando && <p>Cargando reporte...</p>}

      {/* RESULTADOS */}
      {!cargando && Object.keys(reporte).length > 0 && (
        <div>
          {Object.entries(reporte).map(([categoria, productos]) => {
            const utilidadCategoria = Object.values(productos)
              .reduce((acc, prod) => acc + prod.utilidad, 0);

            return (
              <div key={categoria} style={{ marginBottom: "40px" }}>
                <h3>📁 Categoría: {categoria}</h3>

                <table
                  border="1"
                  cellPadding="6"
                  style={{
                    width: "100%",
                    background: "white",
                    tableLayout: "fixed",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "25%" }}>Producto</th>
                      <th style={{ width: "10%" }}>Cantidad</th>
                      <th style={{ width: "10%" }}>Costo (U)</th>
                      <th style={{ width: "10%" }}>Precio Venta (U)</th>
                      <th style={{ width: "10%" }}>Utilidad</th>
                      <th style={{ width: "10%" }}>Total P</th>
                      <th style={{ width: "10%" }}>Total Bs</th>
                      <th style={{ width: "10%" }}>Total D</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(productos).map(([descripcion, info]) => (
                      <tr key={descripcion}>
                        <td>{descripcion}</td>
                        <td>{formatoVE(info.cantidadVendida)}</td>
                        <td>{formatoVE(info.costo)}</td>
                        <td>{formatoVE(info.precioVenta)}</td>
                        <td style={{ fontWeight: "bold", color: "green" }}>
                          {formatoVE(info.utilidad)}
                        </td>
                        <td>{formatoVE(info.totalP)}</td>
                        <td>{formatoVE(info.totalBs)}</td>
                        <td>{formatoVE(info.totalD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ⭐ UTILIDAD TOTAL POR CATEGORÍA */}
                <h4 style={{ marginTop: "10px", color: "darkgreen" }}>
                  Utilidad total de la categoría {categoria}:{" "}
                  {formatoVE(utilidadCategoria)}
                </h4>
              </div>
            );
          })}

          {/* ⭐ TOTALES GENERALES */}
          <h3>📌 Totales Generales</h3>
          <table
            border="1"
            cellPadding="6"
            style={{
              width: "50%",
              background: "white",
              tableLayout: "fixed",
              borderCollapse: "collapse"
            }}
          >
            <tbody>
              <tr>
                <td>Total Pesos (P)</td>
                <td>{formatoVE(totalP)}</td>
              </tr>
              <tr>
                <td>Total Bolívares (Bs)</td>
                <td>{formatoVE(totalBs)}</td>
              </tr>
              <tr>
                <td>Total Dólares (D)</td>
                <td>{formatoVE(totalD)}</td>
              </tr>
              <tr>
                <td><strong>UTILIDAD TOTAL GENERAL</strong></td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  {formatoVE(utilidadGeneral)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Utilidad;
