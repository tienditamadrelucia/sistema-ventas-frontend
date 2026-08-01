import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const AjustePrecios = () => {
  const navigate = useNavigate();

  // -------------------------
  // ESTILOS GLOBALES
  // -------------------------
  
  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black, Arial, sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonGuardar = {
    width: "25%",
    padding: "6px",
    backgroundColor: "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px"
  };

  // Íconos
  const iconoEditar = {
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "1px"
  };

  const iconoEliminar = {
    fontSize: "22px",
    cursor: "pointer",
    color: "#B84A4A"
  };

  const cajaCodigo = {
    backgroundColor: "#e8e8e8",
    padding: "3px",
    borderRadius: "6px",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
    border: "1px solid #ccc"
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

  const input25 = {
    width: "25%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "10px"
  };

  const cajaImagen = {
    width: "150px",
    height: "150px",
    backgroundColor: "#f3f3f3",
    border: "1px solid #ccc",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "10px",
    marginBottom: "10px"
  };

  // -------------------------
  // ESTADOS
  // -------------------------
  
  const [productos, setProductos] = useState([]);    
  const [categorias, setCategorias] = useState([]);
  const formularioRef = useRef(null);  
  const [procesando, setProcesando] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [tasaAnterior, setTasaAnterior] = useState("");
  const [tasaActual, setTasaActual] = useState("");

  const [formData, setFormData] = useState({
    codigo: 0,
    categoria: "",
    descripcion: "",
    medida: "",
    stock: "",
    fechaIngreso: new Date().toISOString().split("T")[0], // ⭐ fecha de hoy
    costo: "",
    venta: "",
    precioanterior: "",
    foto: ""
  });

  useEffect(() => {
    const cargarCategorias = async () => {
      const res = await fetch(`${API_URL}/api/categorias`);
      const data = await res.json();
      setCategorias(data);
    };
    cargarCategorias();
    }, []);
  
    const productosFiltrados = formData.categoria
      ? productos.filter((p) => p.categoria === formData.categoria)
      : productos;
  
    const inputFotoRef = useRef(null);
    
    const cargarProductos = async (categoria = "") => {
    const res = await fetch(`${API_URL}/api/productos`);
    const data = await res.json();
  
    if (categoria) {
      setProductos(data.filter(p => p.categoria === categoria));
    } else {
      setProductos(data);
    }
  };
  
    useEffect(() => {
      setProcesando(true);
      cargarProductos(); // ahora sí existe
      registrarAccion("Ingresó al módulo Ajustar Precios Automáticos");
      setProcesando(false);
    }, []);    
  
// -------------------------
  // AJUSTAR PRECIOS
  // -------------------------

  const handleAjustar = async () => {    
    if (!tasaAnterior || !tasaActual) {
      alert("Debe ingresar ambas tasas.");
      return;
    }
    setProcesando(true);
    try {
      const res = await fetch(`${API_URL}/api/productos/ajustar-precios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasaAnterior: Number(tasaAnterior),
          tasaActual: Number(tasaActual)
        })
      });
      const data = await res.json();
      alert(data.msg);
      // ⭐ refrescar tabla
      cargarProductos();
      // limpiar campos
      setTasaAnterior("");
      setTasaActual("");
      registrarAccion("Ajustó los precios de venta automáticamente");
    } catch (error) {
      console.error(error);
      alert("Error ajustando precios.");
    } finally {
      setProcesando(false);
    }
  };

  return (    
    
    <div>
      {procesando && (
    <div style={{
      background: "#84868a",
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
      <Encabezado />

    <div style={{ padding: "1px" }}>

      <h2 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
        Ajustar Precios Automáticamente
      </h2>      

      {/* FORMULARIO */}
      <div
        ref={formularioRef}
        style={{
          width: "550px",
          margin: "0 auto 1px auto",
          padding: "1px",
          border: "1px solid #84868a",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
        <input
            type="number"
            placeholder="Tasa anterior"
            value={tasaAnterior}
            onChange={(e) => setTasaAnterior(e.target.value)}
            style={input25}
          />

          <input
            type="number"
            placeholder="Tasa actual"
            value={tasaActual}
            onChange={(e) => setTasaActual(e.target.value)}
            style={input25}
          />

          <button style={estiloBoton} onClick={handleAjustar}>
            Ajustar precios
          </button>          
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
              Volver al MENÚ PRINCIPAL
            </button>
          </div>
      </div>

      {/* TABLA */}
      <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
        Lista de Productos
      </h3>

      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
        <thead style={{ backgroundColor: "#F9CEAE" }}> 
          <tr>
            <th>Foto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Medida</th>
            <th>Stock</th>
            <th>Ingreso</th>
            <th>Costo</th>
            <th>Precio Anterior</th>
            <th>Venta</th>            
          </tr>
        </thead>

        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p._id}>
              <td>{p.foto && <img src={p.foto} alt="foto" width="60" />}</td>
              <td>{p.codigo}</td>
              <td>{p.categoria}</td>
              <td>{p.descripcion}</td>
              <td>{p.medida}</td>
              <td>{p.stock}</td>
              <td>{p.fechaIngreso.slice(0, 10).split("-").reverse().join("/")}</td>
              <td>{p.costo}</td>
              <td>{p.precioanterior}</td>
              <td>{p.venta}</td>              
            </tr>
          ))}
        </tbody>
      </table>
  </div>    
  );
};

export default AjustePrecios;
  