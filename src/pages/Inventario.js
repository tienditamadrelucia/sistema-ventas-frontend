import Encabezado from "../components/Encabezado";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerInventario,
  guardarInventario,
  buscarInventarioGuardado,    
  eliminarTomaInventario, 
  crearEntrada, 
  crearSalida
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
  const [inventarioGuardado, setInventarioGuardado] = useState(false);
  const [fecha, setFecha] = useState("");
  const [productos, setProductos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [tomas, setTomas] = useState({}); // { idProducto: cantidadFisica }  
  const APIURL = `${API_URL}/api`;
  const [procesando, setProcesando] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: "",        // Fecha de la toma de inventario
    productoId: "",   // Código o ID del producto
    stockSistema: "", // Stock final del sistema en esa fecha
    stockFisico: "",  // Toma física realizada
    observacion: ""   //observaciones si hay diferencia
    });

  const rol = localStorage.getItem("rolUsuario")?.toUpperCase().trim();  

  useEffect(() => {
  async function cargar() {    
    const data = await cargarCategorias();
    setCategorias(data);
  }
  cargar();
  }, []);

const handleBuscar = async () => {
  setProcesando(true);
  await cargarInventario();
};

const cargarInventario = async () => {
  try {
    const { fecha, categoria } = formData;
    if (!fecha || !categoria) return;
    // 1. Buscar inventario guardado
    const guardado = await buscarInventarioGuardado(fecha, categoria);
    if (Array.isArray(guardado) && guardado.length > 0) {
      setInventarioGuardado(true);
      // 2. Convertir items guardados a productos
      const productosConToma = guardado.map(item => ({
        _id: item.productoId,
        codigo: item.codigo || "",
        descripcion: item.descripcion || "",
        foto: item.foto || "",
        stockReal: item.stockReal ?? item.stock ?? 0,
        stockFisico:
          item.stockFisico === null ||
          item.stockFisico === undefined
          ? ""
          : String(item.stockFisico),
        observacion: item.observacion    
      }));
      // ⭐ ORDENAR POR CÓDIGO NUMÉRICO
      productosConToma.sort((a, b) => Number(a.codigo) - Number(b.codigo));
      setProductos(productosConToma);
      // ⭐ RECONSTRUIR TOMA
      const nuevoToma = {};
      guardado.forEach(item => {
      nuevoToma[item.codigo] = {
        stockFisico:
          item.stockFisico === "" ||
          item.stockFisico === null ||
          item.stockFisico === undefined
          ? ""
          : String(item.stockFisico),
          observacion: item.observacion ?? ""
      };

      });
      setToma(nuevoToma);
      registrarAccion(
        "Cargó inventario GUARDADO del " + fecha + " / Categoría: " + categoria
      );
      return;
    }
    // 3. Si NO existe → cargar inventario del sistema
    const data = await obtenerInventario(categoria);
    // ⭐ ORDENAR INVENTARIO DEL SISTEMA TAMBIÉN
    const productosOrdenados = Array.isArray(data.productos)
      ? data.productos.sort((a, b) => Number(a.codigo) - Number(b.codigo))
      : [];
    setProductos(productosOrdenados);
    registrarAccion(
      "Cargó inventario del sistema del " + fecha + " / Categoría: " + categoria      
    );    
  } catch (error) {
    manejarError(error);
    } finally {
    setProcesando(false);
    }    
};


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
    setProcesando(true);
  try {
    const payload = {
      fecha: formData.fecha,
      categoria: formData.categoria,
      items: productos.map(producto => ({
        productoId: producto._id,
        stockReal: Number(producto.stockReal ?? producto.stock ?? 0),
        stockFisico: 
          toma[producto.codigo]?.stockFisico === ""  ||
          toma[producto.codigo]?.stockFisico === undefined
          ? ""
          : Number(toma[producto.codigo]?.stockFisico),
        observacion: toma[producto.codigo]?.observacion || ""
      }))      
    };    
    console.log("ANTES DE GUARDAR:", toma);
    const res = await guardarInventario(payload);
    alert("Inventario guardado correctamente");
    setInventarioGuardado(true);
    registrarAccion(
      "Guardó inventario del " + formData.fecha + " (" + productos.length + " productos)"
    );
  } catch (error) {
    manejarError(error);
  }
  setProcesando(false);
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
 
  async function guardarToma(producto) {
  const codigo = producto.codigo;     
  const productoId = producto._id;    
  const registro = toma[codigo] ?? {}; 

  // ✔ stockFisico siempre será un número válido
  const stockFisico =
    registro.stockFisico === "" || registro.stockFisico == null
      ? 0
      : Number(registro.stockFisico);
    alert("observación " + registro.observacion);
  const payload = {
    fecha: formData.fecha,    // ← viene del scope superior
    categoria: formData.categoria,
    productoId,
    stockReal: Number(producto.stockReal ?? 0),
    stockFisico,    
    observacion: registro.observacion || ""   // ✔ ahora sí llega
  };
  console.log("PAYLOAD INVENTARIO:", payload); // 👈 AÑADE ESTO
  await guardarInventario(payload);
}

  async function editarToma(codigo) {
    const id = toma[codigo].id;

    const formData = {
      stockFisico: toma[codigo].stockFisico === "" ? "" : Number(toma[codigo].stockFisico),
      observacion: toma[codigo].observacion
    };

  //  const res = await editarTomaInventario(id, formData);
    //if (res.ok) cargarInventario();
  }

  async function eliminarToma(codigo) {
    const id = toma[codigo].id;
    await eliminarTomaInventario(id);
    //cargarInventario();
  }

 async function registrarAjuste(producto) {
  setProcesando(true);
  const codigo = producto.codigo;
  const productoId = producto._id;
  const registro = toma[codigo] ?? {};

  const stockSistema = Number(producto.stockReal ?? 0);
  const stockFisico =
    registro.stockFisico === "" || registro.stockFisico == null
      ? 0
      : Number(registro.stockFisico);

  const diferencia = stockFisico - stockSistema;

  if (diferencia === 0) {
    alert("No hay diferencia para ajustar.");
    return;
  }

  try {
    // 🔹 AQUÍ VA EL NUEVO BLOQUE
    if (!inventarioGuardado) {      
      await handleGuardar();          // guarda toda la toma      
      setInventarioGuardado(true);    // marcamos que ya existe inventario
    }
    const data = {
      fecha: formData.fecha,
      productoId,
      cantidad: diferencia,
      observacion: "AJUSTE"
    };
    if (!inventarioGuardado) {
      await handleGuardar();
      setInventarioGuardado(true);
    }
    console.log("DATA AJUSTE: ", data);
    if (diferencia < 0) {
      // SALIDA → cantidad siempre positiva
      data.cantidad = Math.abs(diferencia);
      await crearSalida(data);

      } else if (diferencia > 0) {
        // ENTRADA → cantidad positiva
        data.cantidad = diferencia;
        await crearEntrada(data);

      } else {
        // diferencia === 0
        alert("No hay diferencia para ajustar.");
        return;
    }

    const resp = await fetch(`${APIURL}/inventario/stock-real/${codigo}`);
    const info = await resp.json();
    setProductos(prev =>
      prev.map(p =>
        p._id === productoId ? { ...p, stockReal: info.stockReal } : p
      )
    );
    setTimeout(() => guardarToma(producto), 50);
    alert("Ajuste realizado correctamente.");
    setProcesando(false);
  } catch (error) {
    console.error("Error registrando ajuste:", error);
    alert("Error registrando el ajuste.");
  }
}
 
  // -------------------------
  // RETURN
  // -------------------------

  return (  
  <div>    
    {procesando && (
    <div style={{
      background: "#6699FF",
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
          const stockSistema = producto.stockReal === "" || producto.stockReal === undefined
            ? 0
            : parseFloat(producto.stockReal);
          const valorToma = toma[producto.codigo]?.stockFisico;
          // Para el cálculo, si está vacío usar 0, pero sin alterar el valor real
          const tomaParaCalculo =
            valorToma === "" || valorToma === undefined
            ? 0
            : parseFloat(valorToma);            
          const diferencia = valorToma - stockSistema; // ej: -5.04 + 0.56 = -4.48            

          return (          
            <div
              key={producto._id}
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
                <p><strong>Stock final (sistema):</strong> {producto.stockReal}</p>
                <label><strong>Toma física: </strong></label>
                <input
                  type="text"
                  style={{
                    width: "50%",
                    padding: "5px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc"
                  }}
                  step="0.10"
                  value={toma[producto.codigo]?.stockFisico ?? ""}
                  onChange={(e) => {
                    const v=e.target.value;
                    //permitir vacío
                    if (v === "") {
                      actualizarCampo(producto.codigo, "stockFisico", "");
                      return;
                    }
                    // ⭐ permitir solo números con decimales (regex)
                    if (/^\d*\.?\d*$/.test(v)) {
                      actualizarCampo(producto.codigo, "stockFisico", v);
                      }
                    }}
                  />                

                <label><strong>Observación: </strong></label>
                <input
                  type="text"
                  value={toma[producto.codigo]?.observacion ?? ""}
                  onChange={(e) =>
                  actualizarCampo(
                  producto.codigo,
                  "observacion",
                  e.target.value.toUpperCase()
                  )
                  }
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
                <span style={{
                  color:
                  diferencia === 0
                  ? "green"
                  : diferencia > 0
                  ? "blue"
                  : "red"
                  }}>
                  {diferencia.toFixed(2)}
                </span>
              </p>

              <button
                style={estiloBotonAjuste(rol === "ADMINISTRADOR")}
                enabled={rol === "ADMINISTRADOR"}
                onClick={() => registrarAjuste(producto)}
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