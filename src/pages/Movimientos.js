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
  const [procesando, setProcesando] = useState(false);
  const [totales, setTotales] = useState({
    totalEntradas: 0,
    totalSalidas: 0,
    totalVentas: 0
  });


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
  setProcesando(true);
  try {        
    if (!formData.productoId || !formData.fechaInicio || !formData.fechaFin) {      
      return;      
    }
    // 1. Stock inicial
    const producto = productos.find(p => p._id === formData.productoId);
    const stockInicial = producto?.stock || 0;
    // 2. Movimientos del backend
    const movimientosArray = await Consultar(
      formData.productoId,
      formData.fechaInicio,
      formData.fechaFin    
    );
    // 3. Transformar movimientos
    setMovimientosArray(movimientosArray);
    const movimientosTransformados = movimientosArray.map(m => {
      return {
      fecha: m.fecha,
      entrada: m.tipo === "ENTRADA" ? m.cantidad : "",
      salida: m.tipo === "SALIDA" ? m.cantidad : "",
      venta: m.tipo === "VENTA" ? m.cantidad : "",
      };
    });
    // 4. Calcular existencia actual
    let existencia = stockInicial;
      const movimientosConExistencia = movimientosTransformados.map(m => {
      const entrada = Number(m.entrada) || 0;
      const salida = Number(m.salida) || 0;
      const venta = Number(m.venta) || 0;
        existencia = existencia + entrada - salida - venta;
        return {
      ...m,
        existenciaActual: existencia
        };
      });
      // 5. Guardar movimientos correctos
    setMovimientosArray(movimientosConExistencia);
    // 6. Totales
    const totalEntradas = movimientosConExistencia.reduce((acc, m) => acc + (Number(m.entrada) || 0), 0);
    const totalSalidas  = movimientosConExistencia.reduce((acc, m) => acc + (Number(m.salida) || 0), 0);
    const totalVentas   = movimientosConExistencia.reduce((acc, m) => acc + (Number(m.venta) || 0), 0);
    setTotales({ totalEntradas, totalSalidas, totalVentas });

    // 7. Stock final (si lo necesitas)
    // Calcular stock final tomando en cuenta el stock inicial
    let stock = stockInicial;
      movimientosArray.forEach(m => {
      if (m.tipo === "ENTRADA") stock += m.cantidad;
      if (m.tipo === "SALIDA" || m.tipo === "VENTA") stock -= m.cantidad;
    });
    setStockFinal(stock);
    setProcesando(false);
  } catch (error) {
    manejarError("Error obteniendo movimientos", error);
  }
};

  // -------------------------
  // RETURN
  // -------------------------

   return (
    <div>
      {procesando && (
      <div style={{
        background: "#84868A",
        color: "white",
        padding: "8px",
        textAlign: "center",
        fontWeight: "bold",
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 999999
      }}>
        Procesando, por favor espere...
      </div>
      )}
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
      <div style={{ display:"flex", justifyContent:"center" }}>
        <table 
          border="1" 
          cellPadding="8" 
          style={{
            width: "50%",
            textAlign: "center",
            backgroundColor: "white",
          }}
        >
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Venta</th>
              <th>Existencia Actual</th>
            </tr>
          </thead>
          <tbody>
            {movimientosArray.map((m, index) => (
              <tr key={index}>
                <td>{new Date(m.fecha).toLocaleDateString("es-VE")}</td>
                <td>{m.entrada}</td>
                <td>{m.salida}</td>
                <td>{m.venta}</td>
                <td>{m.existenciaActual}</td>
              </tr>
            ))}
            {/* FILA DE TOTALES */}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
              <td>TOTALES</td>
              <td>{totales.totalEntradas}</td>
              <td>{totales.totalSalidas}</td>
              <td>{totales.totalVentas}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* STOCK FINAL */}
      <h3 style={{ textAlign: "center", marginTop: "20px", fontWeight: "bold" }}>
        Stock Final: {stockFinal}
      </h3>
    </div>
  );
}
