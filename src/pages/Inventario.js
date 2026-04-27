import Encabezado from "../components/Encabezado";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  guardarTomaInventario,
  editarTomaInventario,
  eliminarTomaInventario
} from "../services/ser_inventario";
import { cargarCategorias } from "../services/categorias";
import axios from "axios";
import { manejarError } from "../utils/manejarError";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

  // -------------------------
  // ESTILOS
  // -------------------------

  const selectEstilo = {
    width: "50%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#EDC5CD",
    fontFamily: "Arial",
    fontSize: "14px",
    marginLeft: "20px"
  };

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
    marginTop: "5px",
    marginLeft: "5px"
  };

  const estiloBotonGde = {
    width: "25%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "5px",
    marginLeft: "5px"
  };

  const estiloBotonAjuste = (habilitado) => ({
    padding: "8px 12px",
    backgroundColor: habilitado ? "#D98897" : "#aaa",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: habilitado ? "pointer" : "not-allowed",
    marginTop: "10px"
  });

  // -------------------------
  // ESTADOS
  // -------------------------

  const Inventario = () => {
  const navigate = useNavigate();

  const [toma, setToma] = useState({});
  const [fecha, setFecha] = useState("");
  const [productos, setProductos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [tomas, setTomas] = useState({}); // { idProducto: cantidadFisica }
  const rolUsuario = localStorage.getItem("rol");
  const APIURL = `${API_URL}/api`;
  
  const [formData, setFormData] = useState({
    fecha: "",        // Fecha de la toma de inventario
    productoId: "",   // Código o ID del producto
    stockSistema: "", // Stock final del sistema en esa fecha
    stockFisico: "",  // Toma física realizada
    observacion: ""   //observaciones si hay diferencia
    });

  // Cargar inventario al cambiar fecha o categoría
useEffect(() => {    
  cargarInventario();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fecha, categoria]);


  useEffect(() => {
  async function cargar() {    
    const data = await cargarCategorias();
    setCategorias(data);
  }
  cargar();
  }, []);

 const handleBuscar = async () => {
  try {
    const data = await obtenerInventario(formData.fecha, formData.categoria) || {};

    // Productos seguros
    const productosSeguros = Array.isArray(data.productos) ? data.productos : [];
    setProductos(productosSeguros);

    // Convertir tomas en DICCIONARIO (igual que cargarInventario)
    const tomasSeguras = {};

    if (Array.isArray(data.tomas)) {
      data.tomas.forEach(t => {
        tomasSeguras[t.productoId] = {
          id: t._id,
          stockFisico: t.stockFisico,
          observacion: t.observacion,
          existe: true,
          editando: false
        };
      });
    }

    // AGREGAR productos sin toma (AQUÍ VA TU BLOQUE)
    productosSeguros.forEach(p => {
      if (!tomasSeguras[p.codigo]) {
        tomasSeguras[p.codigo] = {
          stockFisico: "",
          observacion: "",
          existe: false,
          editando: false
        };
      }
    });

    // Guardar en estado
    setToma(tomasSeguras);

    registrarAccion("Consultó inventario del " + fecha + " / Categoría: " + categoria);

  } catch (error) {
    manejarError(error);
    alert("Se mostrará la tabla vacía para continuar trabajando", error);

    setProductos([]);
    setToma({});
  }
}; 

  async function cargarInventario() {
    if (!fecha || !categoria) return;

    const data = await obtenerInventario(fecha, categoria);

    setProductos(data.productos);

    const estadoTomas = {};

    // Tomas existentes
    data.tomas.forEach(t => {
      estadoTomas[t.productoId] = {
        id: t._id,
        stockFisico: t.stockFisico,
        observacion: t.observacion,
        existe: true,
        editando: false
      };
    });    

    // Productos sin toma
    data.productos.forEach(p => {
      if (!estadoTomas[p.codigo]) {
        estadoTomas[p.codigo] = {
          stockFisico: "",
          observacion: "",
          existe: false,
          editando: false
        };
      }
    });

    setToma(estadoTomas);
  }


  const handleBorrar = () => {
  setFormData({
    ...formData,
    fecha: "",
    categoria: "",
    cantidadFisica: "",
    productoId: ""
  });
  setProductos([]); // si quieres limpiar la lista
  };

  const handleGuardar = async () => {
  try {
    const payload = {
      fecha: formData.fecha, 
      categoria: formData.categoria,     
      items: productos.map(producto => ({
        productoId: producto._id,
        stockSistema: Number(producto.stockFinalSistema || 0),
        stockFisico: Number(toma[producto.codigo]?.stockFisico || 0),
        observacion: toma[producto.codigo]?.observacion || ""
      }))
    };        

    try {
      const res = await axios.post( `${APIURL}/api/inventario/guardar`, payload);
    

  } catch (error) {
    alert("ERROR DEL BACKEND:\n" + JSON.stringify(error.response?.data || error.message, null, 2));
  }
    alert("Inventario guardado correctamente");
    registrarAccion("Guardó inventario del " + formData.fecha + " (" + productos.length + " productos)");

  } catch (error) {
    manejarError(error);
    }
};


  function handleToma(idProducto, valor) {
  setTomas((prev) => ({
    ...prev,
    [idProducto]: valor
  }));
  }

  function actualizarCampo(codigo, campo, valor) {
    setToma(prev => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [campo]: valor
      }
    }));
    registrarAccion("Modificó toma física del producto " + codigo);
  }

  function activarEdicion(codigo) {
    setToma(prev => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        editando: true
      }
    }));
  }

  async function guardarToma(codigo, stockSistema) {
    const formData = {
      fecha,
      productoId: codigo,
      stockSistema,
      stockFisico: Number(toma[codigo].stockFisico),
      observacion: toma[codigo].observacion
    };

    const res = await guardarTomaInventario(formData);
    if (res.ok) cargarInventario();
  }

  async function editarToma(codigo) {
    const id = toma[codigo].id;

    const formData = {
      stockFisico: Number(toma[codigo].stockFisico),
      observacion: toma[codigo].observacion
    };

    const res = await editarTomaInventario(id, formData);
    if (res.ok) cargarInventario();
  }

  async function eliminarToma(codigo) {
    const id = toma[codigo].id;
    await eliminarTomaInventario(id);
    cargarInventario();
  }

  function registrarAjuste(codigo, stockSistema) {
    const stockFisico = Number(toma[codigo].stockFisico);
    const diferencia = stockFisico - stockSistema;

    if (diferencia === 0) return;

    // Aquí llamas a tu módulo de movimientos
    // Entrada si diferencia > 0
    // Salida si diferencia < 0
  }
  
  // -------------------------
  // RETURN
  // -------------------------

  return (  
  <div>    
    <Encabezado />

    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
        Toma de Inventario
      </h2>

      {/* SELECCIÓN DE CATEGORÍA y FECHA*/}
      <div
        style={{
          width: "650px",
          margin: "0 auto 20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          Seleccionar Categoría
        </h3>

        <div style={{ textAlign: "left" }}>
            <label>Fecha del Inventario:</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              style={{ width: "20%", marginBottom: "10px", padding: "5px", marginLeft: "20px" }}
              onChange={(e) =>
                setFormData({
                ...formData,
                fecha: e.target.value
                })
                }
            />
            <select
              name="categoria"
              value={formData.categoria}
              onChange={(e) =>
                setFormData({
                ...formData,
                categoria: e.target.value
                })
              }
              style={selectEstilo}
            >
              <option value="">Seleccione categoría</option>
              {categorias.map((cat) => (
              <option key={cat._id} value={cat.codigo}>
                {cat.descripcion}
              </option>
              ))}
            </select>            
        </div>
        {/* BOTÓN BUSCAR */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleBuscar} // tu función para cargar inventario
            style={estiloBoton}
          >
            Buscar
          </button>

          {/* BOTÓN GUARDAR */}
          <button
            type="button"
            onClick={handleGuardar} // tu función para limpiar filtros
            style={estiloBoton}
          >
            Guardar
          </button>
          {/* BOTÓN BORRAR */}
          <button
            type="button"
            onClick={handleBorrar} // tu función para limpiar filtros
            style={estiloBoton}
          >
            Borrar
          </button>
          {/* BOTÓN VOLVER */}  
          <button onClick={() => navigate("/menu")} style={estiloBotonGde}>
            MENÚ PRINCIPAL
          </button>
        </div> 
      </div>

      {/* LISTA DE PRODUCTOS */}      
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "center"
          }}
        >
        {formData.categoria && productos.map((producto) => {
          const stockSistema = Number(producto.stockFinalSistema || 0);
          const valorToma = toma[producto.codigo]?.stockFisico;
          const tomaFisica =
            valorToma === "" || valorToma === undefined
              ? 0
              : parseFloat(valorToma);
          const diferencia = tomaFisica - stockSistema;

          return (          
            <div
              key={producto.codigo}
              style={{
                width: "270px",
                margin: "0 auto 20px auto",
                padding: "5px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#fafafa",                
              }}            
            >
              <div style={{ display: "flex", gap: "20px", textAlign: "center" }}>
                <img
                  src={producto.foto}
                  alt="Foto"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",                    
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p><strong>Código:</strong> {producto.codigo}</p>
                <p><strong>Producto:</strong> {producto.descripcion}</p>
                <p><strong>Stock final (sistema):</strong> {stockSistema.toFixed(2)}</p>
                <label><strong>Toma física: </strong></label>                
                <input
                  type="number"
                  step="0.10"
                  value={toma[producto.codigo]?.stockFisico ?? ""}
                  onChange={(e) => actualizarCampo(producto.codigo, "stockFisico", e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    width: "50%",
                    padding: "5px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc"
                  }}
                />
                <label><strong>Observación: </strong></label>
                <input
                  type="text"                  
                  value={toma[producto.codigo]?.observacion ?? ""}
                  onChange={(e) => actualizarCampo(producto.codigo, "observacion", e.target.value.toUpperCase())}
                  style={{
                    width: "50%",
                    padding: "5px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc"
                  }}
                />
                <p>
                  <strong>Diferencia:</strong>{" "}
                  <span style={{ color: diferencia === 0 ? "green" : diferencia > 0 ? "blue" : "red" }}>
                    {diferencia.toFixed(2)}
                  </span>
                </p>
                <button
                  style={estiloBotonAjuste(rol === "ADMINISTRADOR")}
                  onClick={() => registrarAjuste(producto.codigo, stockSistema)}
                >
                  Registrar Ajuste
                </button>            
              </div>            
            </div>            
          );
        })}
      </div>                   
    </div>    
  </div>    
  );
};
export default Inventario;