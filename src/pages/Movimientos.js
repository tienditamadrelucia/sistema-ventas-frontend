import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import manejarError from "../utils/manejarError";
import { registrarAccion } from "../utils/registrarAccion";

import { cargarCategorias } from "../services/categorias";
import { Consultar } from "../services/ser_movi";
import { cargarProductos } from "../services/productos";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

  // -------------------------
  // ESTILOS
  // -------------------------
const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const selectEstilo = {
    width: "100%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#EDC5CD",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const botonGuardar = {
    width: "50%",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px"
  };

  // -------------------------
  // ESTADOS
  // -------------------------
  export default function Movimientos() {
  const navigate = useNavigate();
  const formularioRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  const [movimientosArray, setMovimientosArray] = useState([]);
  const [stockFinal, setStockFinal] = useState(0);

  const [formData, setFormData] = useState({
    categoria: "",
    productoId: "",
    fechaInicio: "",
    fechaFin: ""
  });

  // -------------------------
  // MANEJO DE ERRORES
  // -------------------------
  const manejarError = (error) => {
  console.error("ERROR:", error);

  if (error?.mensaje) {
    alert(error.mensaje);
  } else {
    alert("Ocurrió un error inesperado. Intente nuevamente.");
  }
  };

  // ============================
  // CARGAR CATEGORÍAS Y PRODUCTOS
  // ============================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const cats = await cargarCategorias();
        const prods = await cargarProductos();

        setCategorias(cats || []);
        setProductos(prods || []);

      } catch (error) {
        manejarError("Error cargando datos iniciales", error);
      }
    };

    cargarDatos();
  }, []);
  
  // ============================
  // FILTRAR PRODUCTOS POR CATEGORÍA
  // ============================
  const handleCategoria = (e) => {
  const categoriaSeleccionada = e.target.value;
    
  setFormData({
    ...formData,
    categoria: categoriaSeleccionada
  });

  const productosFiltrados = productos.filter(
    (p) => p.categoria === categoriaSeleccionada
  );

  setProductosFiltrados(productosFiltrados);
};

  const handleProducto = (e) => {
    setFormData({
      ...formData,
      productoId: e.target.value
    });
  };

  const handleFecha = (e) => {    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value      
    });        
  };

// ===============================
//   CONSULTAR MOVIMIENTOS
// ===============================
const ObtenerMovimientos = async () => {
  try {        
    if (!formData.productoId || !formData.fechaInicio || !formData.fechaFin) {      
      return;      
    }

    const movimientosArray = await Consultar(
      formData.productoId,
      formData.fechaInicio,
      formData.fechaFin    
    );

    // Ordenar por fecha
    //movimientosArray.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    setMovimientosArray(movimientosArray);

    // Calcular stock final
    let stock = 0;
    movimientosArray.forEach(m => {
      if (m.tipo === "ENTRADA") stock += m.cantidad;
      if (m.tipo === "SALIDA" || m.tipo === "VENTA") stock -= m.cantidad;
    });

    setStockFinal(stock);

  } catch (error) {
    manejarError("Error obteniendo movimientos", error);
  }
};

  // -------------------------
  // RETURN
  // -------------------------

   return (
    <div style={{ minHeight: "100vh", padding: "10px" }}>
      <Encabezado />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Gestión de Movimientos
        </h2>

        {/* FORMULARIO */}
        <div
          ref={formularioRef}
          style={{
            width: "550px",
            margin: "0 auto 20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >        
          <h3 style={{ textAlign: "center", fontWeight: "bold" }}>Filtros</h3>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleCategoria}            
            style={selectEstilo}
          >
            <option value="">Seleccione categoría</option>
            {categorias.map((c) => (
              <option key={c._id} value={c.codigo}>
                {c.descripcion}
              </option>
              ))}
          </select>

          <select
            name="productoId"
            value={formData.productoId}
            onChange={handleProducto}            
            style={selectEstilo}
          >
            <option value="">Seleccione producto</option>
            {productosFiltrados.map((p) => (
              <option key={p._id} value={p._id}>
                {p.descripcion}
              </option>
            ))}
          </select>
          <div style={{ textAlign: "center" }}>
            <label>Desde:</label>
            <input
              type="date"
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleFecha}
              style={{ width: "25%", marginBottom: "10px", padding: "5px", marginLeft: "20px" }}
            />
            <label style= {{marginLeft: "20px"}}>Hasta:</label>
            <input
              type="date"
              name="fechaFin"
              value={formData.fechaFin}
              onChange={handleFecha}
              style={{ textAlign: "25%", marginBottom: "1px", padding: "5px", marginLeft: "20px" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button style={botonGuardar} onClick={ObtenerMovimientos}>
              Consultar
            </button>
          </div>        
        </div>
        {/* BOTÓN VOLVER */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>
      </div>    

      {/* TABLA DE MOVIMIENTOS */}
      <h3 style={{ textAlign: "center", marginTop: "2px", fontWeight: "bold" }}>
        Movimientos del Producto
      </h3>

      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center", backgroundColor: "white" }}>
        <thead>
          <tr>
            <th>Fecha Entrada</th>
            <th>Cant</th>
            <th>Obs</th>

            <th>Fecha Salida</th>
            <th>Cant</th>
            <th>Obs</th>

            <th>Fecha Venta</th>
            <th>Cant</th>

            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {movimientosArray.map((m, index) => (
            <tr key={index}>
              <td>{m.fechaEntrada ? new Date(m.fechaEntrada).toLocaleDateString("es-VE") : ""}</td>
              <td>{m.cantidadEntrada || ""}</td>
              <td>{m.observacionEntrada || ""}</td>

              <td>{m.fechaSalida ? new Date(m.fechaSalida).toLocaleDateString("es-VE") : ""}</td>
              <td>{m.cantidadSalida || ""}</td>
              <td>{m.observacionSalida || ""}</td>

              <td>{m.fechaVenta ? new Date(m.fechaVenta).toLocaleDateString("es-VE") : ""}</td>
              <td>{m.cantidadVenta || ""}</td>

              <td>{m.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* STOCK FINAL */}
      <h3 style={{ textAlign: "center", marginTop: "20px", fontWeight: "bold" }}>
        Stock Final: {stockFinal}
      </h3>
    </div>
  );
}
