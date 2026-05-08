import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL;

export default function PorStock() {
  const [productos, setProductos] = useState([]);
  const [stockRealLista, setStockRealLista] = useState([]);
  const [filtroStockReal, setFiltroStockReal] = useState("");

  // -----------------------------
  // CARGAR PRODUCTOS
  // -----------------------------
  const cargarProductos = async () => {
    console.log("➡️ Cargando productos...");
console.log("API:", `${API_URL}/api/productos`);

    try {
      const res = await fetch(`${API_URL}/api/productos`);
      const data = await res.json();
console.log("Productos recibidos:", data);

      setProductos(data);
      cargarStockReal(data); // ⭐ cargar stock real
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  // -----------------------------
  // CARGAR STOCK REAL POR PRODUCTO
  // -----------------------------
  const cargarStockReal = async (lista) => {
    console.log("➡️ Cargando stock real...");
console.log("Lista base:", lista);

    const resultado = [];

    for (const p of lista) {
      try {
        const res = await fetch(`${API_URL}/api/inventario/stock-real/${p.codigo}`);
        const data = await res.json();

        resultado.push({
          ...p,
          stockReal: data.ok ? data.stockReal : p.stock
        });

      } catch (error) {
        resultado.push({
          ...p,
          stockReal: p.stock
        });
      }
    }

    setStockRealLista(resultado);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // -----------------------------
  // FILTRO POR STOCK REAL
  // -----------------------------
  const productosFiltrados = filtroStockReal
    ? stockRealLista.filter(
        (p) => Number(p.stockReal) === Number(filtroStockReal)
      )
    : stockRealLista;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Reporte por Stock Real</h2>

      {/* FILTRO */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <label>Filtrar por Stock Real: </label>
        <input
          type="number"
          value={filtroStockReal}
          onChange={(e) => setFiltroStockReal(e.target.value)}
          style={{ width: "80px", padding: "5px", marginLeft: "10px" }}
        />
      </div>

      {/* TABLA */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Código</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Descripción</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Categoría</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Stock Real</th>
          </tr>
        </thead>

        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p._id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{p.codigo}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{p.descripcion}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{p.categoria}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                {p.stockReal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
