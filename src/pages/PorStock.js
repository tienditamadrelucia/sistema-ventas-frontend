import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL;

export default function PorStock() {
  const [productos, setProductos] = useState([]);
  const [stockRealLista, setStockRealLista] = useState([]);
  const [filtroStockReal, setFiltroStockReal] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  
  // ---------------------------------------------------
  // CARGAR CATEGORÍAS
  // ---------------------------------------------------
  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categorias`);
      const data = await res.json();

      // Puede venir como {categorias: [...] } o como [...]
      setCategorias(data.categorias || data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // ---------------------------------------------------
  // CARGAR PRODUCTOS
  // ---------------------------------------------------
  const cargarProductos = async () => {
    console.log("➡️ Llamando a:", `${API_URL}/api/productos`);

    try {
      const res = await fetch(`${API_URL}/api/productos`);
      const data = await res.json();

      setProductos(data);
      cargarStockReal(data); // ⭐ cargar stock real
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  // ---------------------------------------------------
  // CARGAR STOCK REAL POR PRODUCTO
  // ---------------------------------------------------
  const cargarStockReal = async (lista) => {
    const resultado = [];

    for (const p of lista) {
      try {
        const res = await fetch(`${API_URL}/api/inventario/stock-real/${p.codigo}`);
        const data = await res.json();

        resultado.push({
          ...p,
          stockReal: data.ok ? data.stockReal : p.stock,
        });
      } catch (error) {
        resultado.push({
          ...p,
          stockReal: p.stock,
        });
      }
    }

    setStockRealLista(resultado);
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // ---------------------------------------------------
  // FILTROS: CATEGORÍA + STOCK REAL
  // ---------------------------------------------------
  let productosFiltrados = stockRealLista;

  // ⭐ Filtrar por categoría
  if (categoriaSeleccionada) {
    productosFiltrados = productosFiltrados.filter(
      (p) => p.categoria === categoriaSeleccionada
    );
  }

  // ⭐ Filtrar por stock real
  if (filtroStockReal) {
    productosFiltrados = productosFiltrados.filter(
      (p) => Number(p.stockReal) === Number(filtroStockReal)
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Reporte por Stock Real</h2>

      {/* SELECT DE CATEGORÍAS */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <label>Categoría: </label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          style={{ padding: "5px", marginLeft: "10px" }}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c._id} value={c.codigo}>
              {c.descripcion}
            </option>
          ))}
        </select>
      </div>

      {/* FILTRO POR STOCK REAL */}
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
