import React, { useState } from "react";
import { API_URL } from "../config";

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
  // CALCULAR TOTALES GENERALES
  // ============================
  const totalesGenerales = () => {
    let totalP = 0, totalBs = 0, totalD = 0;

    Object.values(reporte).forEach(cat => {
      Object.values(cat).forEach(prod => {
        totalP += prod.totalP;
        totalBs += prod.totalBs;
        totalD += prod.totalD;
      });
    });

    return { totalP, totalBs, totalD };
  };

  const { totalP, totalBs, totalD } = totalesGenerales();

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
          {Object.entries(reporte).map(([categoria, productos]) => (
            <div key={categoria} style={{ marginBottom: "30px" }}>
              <h3>📁 Categoría: {categoria}</h3>

              <table border="1" cellPadding="6" style={{ width: "100%", background: "white" }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad Vendida</th>
                    <th>Total Pesos (P)</th>
                    <th>Total Bolívares (Bs)</th>
                    <th>Total Dólares (D)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(productos).map(([descripcion, info]) => (
                    <tr key={descripcion}>
                      <td>{descripcion}</td>
                      <td>{info.cantidadVendida}</td>
                      <td>{info.totalP.toLocaleString()}</td>
                      <td>{info.totalBs.toLocaleString()}</td>
                      <td>{info.totalD.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* TOTALES GENERALES */}
          <h3>📌 Totales Generales</h3>
          <table border="1" cellPadding="6" style={{ width: "50%", background: "white" }}>
            <tbody>
              <tr>
                <td>Total Pesos (P)</td>
                <td>{totalP.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Total Bolívares (Bs)</td>
                <td>{totalBs.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Total Dólares (D)</td>
                <td>{totalD.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Utilidad;
