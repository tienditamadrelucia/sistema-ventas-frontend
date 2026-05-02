import Encabezado from "../components/Encabezado";
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cargarProductos } from "../services/productos";
import { cargarCategorias } from "../services/categorias";
import { 
  cargarSalidas, 
  crearSalida, 
  actualizarSalida, 
  eliminarSalidaApi 
  } from "../services/ser_salidas";

import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Salidas = () => {
  const navigate = useNavigate();

    const [procesando, setProcesando] = useState(false);
  // -------------------------
  // ESTILOS GLOBALES
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

  const botonGuardar = {
    width: "50%",
    padding: "6px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",    
    marginTop: "8px",
    opacity:procesando ? 0.6 :1,
    cursor: procesando ? "not-allowed":"pointer"
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

  const iconoEditar = {
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const iconoEliminar = {
    fontSize: "22px",
    cursor: "pointer",
    color: "#B84A4A"
  };

  // -------------------------
  // ESTADOS
  // -------------------------

  const [productos, setProductos] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [modo, setModo] = useState("crear");
  const [salidaEditando, setSalidaEditando] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const formularioRef = React.useRef(null);
  const usuarioActual = "ADMIN"; // o desde contexto/auth
  const [categorias, setCategorias] = useState([]);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().substring(0, 10),
    categoria: "",
    productoId: "",
    codigo: 0,
    cantidad: 0,
    observacion: ""
  });

// ===============================
// CARGA INICIAL: PRODUCTOS + CATEGORÍAS + SALIDAS
// ===============================
useEffect(() => {
const cargarTodo = async () => {
  const cats = await cargarCategorias();  
  setCategorias(cats);
  

  const prods = await cargarProductos();
    setProductos(prods);
  
  const resSalidas = await cargarSalidas(1, "");
      setSalidas(resSalidas.salidasdb);
      setPaginaActual(resSalidas.paginaActual);
      setTotalPaginas(resSalidas.totalPaginas);
};
cargarTodo();
}, []);

useEffect(() => {
const cargarPorFecha = async () => {
    const res = await cargarSalidas(paginaActual, formData.fecha  || "");
    setSalidas(res.salidasdb);
    setPaginaActual(res.paginaActual);
    setTotalPaginas(res.totalPaginas);
};
  cargarPorFecha();
}, [formData.fecha, paginaActual]);

useEffect(() => {
  const cargar = async () => {
    const prods = await cargarProductos();
    console.log("PRODUCTOS:", prods);
    setProductos(prods);
  };
  cargar();
  }, []);
  
// ===============================
// FILTRO DE PRODUCTOS POR CATEGORÍA
// ===============================
const productosFiltrados = formData.categoria
  ? productos.filter((p) => p.categoria === formData.categoria)
  : [];

// ===============================
// MANEJO DE FORMULARIO
// ===============================
  const handleChange = (e) => {
  const { name, value } = e.target;

  // 1. Cantidad
  if (name === "cantidad") {
    let numero = value.replace(",", ".");
    if (numero === "") {
      setFormData({ ...formData, cantidad: "" });
      return;
    }
    let num = parseFloat(numero);
    if (!isNaN(num)) {
      const formateado = num.toFixed(2);
      setFormData({ ...formData, cantidad: formateado });
    }
    return;
  }

  // 2. Categoría
  if (name === "categoria") {
    //const categoriaObj = categorias.find((c) => c.descripcion === value);

    setFormData({
      ...formData,
      categoria: value //categoriaObj ? categoriaObj.codigo : ""
    });

    return;
  }

  // 3. Producto
  if (name === "productoId") {
    const prod = productos.find((p) => p._id === value);
    
    setFormData({
      ...formData,
      productoId: value,
      codigo: prod ? prod.codigo : ""
    });
    
    return;
  }

  // 4. Otros campos
  setFormData({
    ...formData,
    [name]: typeof value === "string" ? value.toUpperCase() : value
  });
};

// ===============================
// GUARDAR / ACTUALIZAR SALIDA
// ===============================
const guardarSalida = async () => {
  if (procesando) return; //evita doble clic
    setProcesando(true);
  
    try {
      // ⭐ VALIDACIÓN GENERAL
      if (
        !formData.fecha ||
        !formData.categoria ||
        !formData.productoId ||
        !formData.codigo ||
        !formData.cantidad ||
        !formData.observacion 
      ) 
      {
        alert("Complete todos los campos");
        return;
      }
        // ⭐ VALIDACIÓN ESPECIAL PARA EDITAR
      if (modo === "editar") {
        if (!formData.cantidad || formData.cantidad <= 0) {
          alert("Debe ingresar una cantidad válida.");
          return;
        }
      }
      if (modo === "crear") {
        const res = await crearSalida(formData);
        if (!res || res.ok !== true) {
          alert(res?.error || "Error creando salida en pages");
          return;
      }    
        await registrarAccion(`Registró salida de ${formData.cantidad} del producto ${formData.codigo}`);
      } else {
        const res = await actualizarSalida(salidaEditando, formData);
        if (!res.ok) {
          alert(res.error || "Error actualizando salida pages");
         return;
        }
        await registrarAccion(`Actualizó salida del producto ${formData.codigo}`);
      }
      const recarga = await cargarSalidas(paginaActual, formData.fecha || "");
      setSalidas(recarga.salidasdb);
      setPaginaActual(recarga.paginaActual);
      setTotalPaginas(recarga.totalPaginas);
      limpiarFormulario();
  
    } finally {
        // ⭐ SIEMPRE se ejecuta, incluso si hubo return arriba
        setProcesando(false);
      } 
};

// ===============================
// EDITAR SALIDA
// ===============================
const editarSalida = (salida) => {
  const prod = productos.find((p) => p._id === (salida.productoId._id || salida.productoId));
  setModo("editar");
  setSalidaEditando(salida._id);
  setFormData({
    fecha: salida.fecha.slice(0, 10),
    categoria: salida.categoria,
    productoId: salida.productoId_id || salida.productoId,
    codigo: prod ? prod.codigo : "",
    cantidad: salida.cantidad,
    observacion: salida.observacion
  });

  if (formularioRef.current) {
    formularioRef.current.scrollIntoView({ behavior: "smooth" });
  }
};

  // -------------------------
  // LIMPIAR FORMULARIO
  // -------------------------
  const limpiarFormulario = () => {
    setModo("crear");
    setSalidaEditando(null);
    setFormData({
      fecha: new Date().toISOString().substring(0, 10),
      categoria: "",
      productoId: "",
      codigo: 0,
      cantidad: 0,
      observacion: ""
    });
  };

// ===============================
// ELIMINAR SALIDA
// ===============================
const eliminarSalida = async (id) => {
  if (window.confirm("¿Eliminar esta salida?")) {
    const res = await eliminarSalidaApi(id, usuarioActual);
    if (!res.ok) {
      alert(res.error || "No se pudo eliminar la salida");
      return;
    }
    const recarga = await cargarSalidas(paginaActual, formData.fecha || "");
    setSalidas(recarga.salidasdb);
    setPaginaActual(recarga.paginaActual);
    setTotalPaginas(recarga.totalPaginas);
    await registrarAccion(`Eliminó una salida`);
  }
}; 

  // -------------------------
  // RETURN
  // -------------------------

  return (
    <div>
      <Encabezado />

    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
        Inventario
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
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          {modo === "crear" ? "Registrar Salidas" : "Editar Salida"}
        </h3>

        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          style={{ width: "25%", marginBottom: "10px", padding: "5px" }}
        />

        <select
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          disabled={modo === "editar"}
          style={selectEstilo}
        >          
          <option value="">Seleccione categoría</option>
          {categorias.map((c) => (
          <option key={c._id} value={c.codigo}>
            {c.descripcion}</option>          
          ))}
        </select>

        <select
          name="productoId"
          value={formData.productoId}
          onChange={handleChange}
          disabled={modo === "editar"}
          style={selectEstilo}
        >
          <option value="">Seleccione producto</option>
          {productosFiltrados.map((p) => (
            <option key={p._id} value={p._id}>
              {p.descripcion}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: "40px", marginBottom: "10px" }}>
          <input
            name="codigo"
            placeholder="Código"
            value={formData.codigo}
            readOnly
            style={{
                width: "45%",
                padding: "5px",
                backgroundColor: "#eee"
            }}
            />

          <input
            name="cantidad"
            placeholder="Cantidad"
            type="number"
            step="0.1"
            value={formData.cantidad}
            onChange={handleChange}
            style={{
                width: "45%",
                padding: "5px"
            }}
            />
        </div>

        <select
          name="observacion"
          value={formData.observacion}
          onChange={handleChange}
          style={selectEstilo}
        >
          <option value="">Seleccione motivo</option>
          <option value="VENTA">VENTA</option>
          <option value="CONSUMO INTERNO">CONSUMO INTERNO</option>
          <option value="CONSUMO INTERNO">OBSEQUIO O DONACIÓN</option>
          <option value="CONSUMO INTERNO">DETERIORO</option>
          <option value="CONSUMO INTERNO">SOLICITADO POR EL MONASTERIO</option>
          <option value="AJUSTE">AJUSTE</option>
          <option value="OTROS">OTROS</option>
        </select>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            className="botonElegante"
            style={botonGuardar} 
            onClick={guardarSalida}
            disabled={procesando}>
            {modo === "crear" ? "Guardar Salida" : "Actualizar Salida"}
          </button>
        </div>
      </div>

      {/* BOTÓN VOLVER */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button onClick={() => navigate("/menu")} style={estiloBoton}>
          Volver al MENÚ PRINCIPAL
        </button>
      </div>

      {/* TABLA */}
      <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
        Listado de Salidas por fecha
      </h3>

      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Observación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {salidas.map((s) => (
            <tr key={s._id}>
              <td>{new Date(s.fecha).toLocaleDateString("es-VE")}</td>
              <td>{s.categoria}</td>
              <td>{s.codigo}</td>
              <td>{s.productoId?.descripcion}</td>
              <td>{s.cantidad}</td>
              <td>{s.observacion}</td>
              <td>
                <span onClick={() => editarSalida(s)} style={iconoEditar}>✏️</span>
                <span onClick={() => eliminarSalida(s._id)} style={iconoEliminar}>🗑️</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>    
    </div>
    
  );    
};

export default Salidas;