import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import {obtenerFechaVenezuela} from "../utils/fechaVenezuela";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Productos = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // -------------------------
  // ESTILOS GLOBALES
  // -------------------------
  
  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B",
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
    backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
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
    backgroundColor: esMonasterio ? "#E8D1A5" : "#EDC5CD",
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
  const [modo, setModo] = useState("crear");
  const [productoEditando, setProductoEditando] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const formularioRef = useRef(null);  
  const [procesando, setProcesando] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [actividadesProductivas, setActividadesProductivas] = useState([]);

  const [formData, setFormData] = useState({
    codigo: 0,
    categoria: "",
    descripcion: "",
    medida: "",
    stock: "",
    fechaIngreso: obtenerFechaVenezuela(),
    costo: "",
    venta: "",
    foto: "",

    origen: "COMPRADO",
    generaParticipacion: false,
    beneficiarioParticipacion: "NINGUNO",
    tipoParticipacion: "NINGUNA",
    valorParticipacion: "",
    actividadProductiva: ""
  });

  useEffect(() => {
  const cargarCategorias = async () => {
    const res = await fetch(`${API_URL}/api/categorias`);
    const data = await res.json();
    setCategorias(data);
  };
  cargarCategorias();
  cargarActividadesProductivas();
  }, []);

  const cargarActividadesProductivas = async () => {
  try {
    const res = await fetch(`${API_URL}/api/actividad-productiva`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Error cargando actividades productivas:", data);
      return;
    }

    setActividadesProductivas(data);
  } catch (error) {
    console.error("Error cargando actividades productivas:", error);
  }
};

  const productosFiltrados = formData.categoria
    ? productos.filter((p) => p.categoria === formData.categoria)
    : productos;    

  const inputFotoRef = useRef(null);
  
  const cargarProductos = async (categoria = "") => {
  const res = await fetch(`${API_URL}/api/productos?sede=${encodeURIComponent(sede)}`);
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
    registrarAccion("Ingresó al módulo Productos");
    setProcesando(false);
  }, []);    

  useEffect(() => {
  limpiarFormulario();   // 👈 genera el primer código al iniciar  
  }, []);

  useEffect(() => {
  return () => {
    if (formData.preview) {
      URL.revokeObjectURL(formData.preview);
    }
  };
}, [formData.preview]);


    // -------------------------
  // MANEJO DE FORMULARIO
  // -------------------------

  const handleChange = (e) => {
  const { name, value, files } = e.target;
  // ⭐ Imagen
  if (name === "foto") {
  const file = files[0];
  if (file) {
    setFormData((prev) => ({
      ...prev,
      foto: file,
      preview: URL.createObjectURL(file)
    }));
  }
  return;
}

  // ⭐ Campos numéricos SIN convertir a número
  const camposNumericos = ["stock", "costo", "venta", "valorParticipacion"];
  if (camposNumericos.includes(name)) {
    setFormData((prev) => ({
      ...prev,
      [name]: value   // ⭐ Mantener como string
    }));
    return;
  }

  // Texto a mayúsculas
  const valorFinal =
    typeof value === "string" ? value.toUpperCase() : value;

  // ⭐ Otros campos
  setFormData((prev) => ({
    ...prev,
    [name]: valorFinal
  }));
};
  
  // -------------------------
  // GUARDAR / ACTUALIZAR
  // -------------------------
const guardarProducto = async () => {
  if (guardando) return; // evita doble click
  setGuardando(true); // deshabilita el botón

  try {
    // VALIDAR CAMPOS
    if (
      !formData.descripcion ||
      !formData.categoria ||
      !formData.actividadProductiva ||
      !formData.venta ||
      formData.stock === "" ||
      !formData.medida ||
      !formData.fechaIngreso
    ) {
      alert("Complete todos los campos obligatorios");
      setGuardando(false); // 🔓 reactivar botón
      return;
    }

    // PRODUCTO COMPRADO: debe tener costo real de adquisición
if (formData.origen === "COMPRADO") {
  if (formData.costo === "" || Number(formData.costo) < 0) {
    alert("Debe indicar el precio de costo del producto comprado.");
    setGuardando(false);
    return;
  }

  if (Number(formData.venta) <= Number(formData.costo)) {
    alert("El precio de venta debe ser mayor al costo.");
    setGuardando(false);
    return;
  }
}

// PRODUCCIÓN DEL MONASTERIO
if (formData.origen === "PRODUCCION_MONASTERIO") {

  if (
    formData.generaParticipacion &&
    formData.tipoParticipacion === "NINGUNA"
  ) {
    alert(
      `Debe seleccionar cómo se calculará la participación para ${
        esMonasterio ? "la Tiendita" : "el Monasterio"
      }.`
    );
    setGuardando(false);
    return;
  }

  if (
    formData.generaParticipacion &&
    Number(formData.valorParticipacion) <= 0
  ) {
    alert(
      `Debe indicar el valor de la participación para ${
        esMonasterio ? "la Tiendita" : "el Monasterio"
      }.`
    );
    setGuardando(false);
    return;
  }

  if (
    formData.generaParticipacion &&
    formData.tipoParticipacion === "PORCENTAJE" &&
    Number(formData.valorParticipacion) > 100
  ) {
    alert("El porcentaje no puede ser mayor de 100%.");
    setGuardando(false);
    return;
  }
}

    setProcesando(true);

    // ⭐ 1. SUBIR FOTO SOLO SI ES ARCHIVO
    let fotoURL = formData.foto;
    if (formData.foto instanceof File) {
      const fd = new FormData();
      fd.append("foto", formData.foto);

      const resp = await fetch(`${API_URL}/api/productos/upload`, {
        method: "POST",
        body: fd
      });

      const data = await resp.json();
      if (!data.url) {
        alert("Error subiendo la imagen");
        setProcesando(false);
        setGuardando(false); // 🔓 reactivar botón
        return;
      }

      fotoURL = data.url;
    }

    // ⭐ 2. PREPARAR PAYLOAD
    const esProduccionMonasterio =
  formData.origen === "PRODUCCION_MONASTERIO";

const generaParticipacion =
  esProduccionMonasterio &&
  Boolean(formData.generaParticipacion);

const payload = {
  ...formData,

  sede: sede,
  foto: fotoURL,
  preview: undefined,

  actividadProductiva: formData.actividadProductiva || null,

  costo: esProduccionMonasterio
    ? 0
    : Number(formData.costo || 0),

  generaParticipacion,

  beneficiarioParticipacion: generaParticipacion
    ? (esMonasterio ? "TIENDITA" : "MONASTERIO")
    : "NINGUNO",

  tipoParticipacion: generaParticipacion
    ? formData.tipoParticipacion
    : "NINGUNA",

  valorParticipacion: generaParticipacion
    ? Number(formData.valorParticipacion || 0)
    : 0
};

    // ⭐ 3. CREAR PRODUCTO
    if (modo === "crear") {
      const respuesta = await fetch(`${API_URL}/api/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await respuesta.json();
      if (!data.ok) {
        alert(data.error || "No se pudo guardar el producto");
        setProcesando(false);
        setGuardando(false); // 🔓 reactivar botón
        return;
      }

      setFormData(prev => ({
        ...prev,
        codigo: data.producto.codigo
      }));

      await registrarAccion(`Registró el producto "${formData.descripcion}"`);
    }

    // ⭐ 4. EDITAR PRODUCTO
    else {
      const respuesta = await fetch(`${API_URL}/api/productos/${productoEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await respuesta.json();
      if (!data.ok) {
        alert(data.error || "No se pudo actualizar el producto");
        setProcesando(false);
        setGuardando(false); // 🔓 reactivar botón
        return;
      }

      await registrarAccion(`Actualizó el producto "${formData.descripcion}"`);
    }

    // ⭐ 5. GUARDAR LA CATEGORÍA QUE DEBE QUEDAR SELECCIONADA
const cat = categoriaSeleccionada || formData.categoria;

// ⭐ 6. LIMPIAR FORMULARIO
limpiarFormulario();

setFormData(prev => ({
  ...prev,
  categoria: cat,
  preview: undefined
}));

// ⭐ 7. RECARGAR LISTA Y ESPERAR A QUE TERMINE
await cargarProductos();

setProcesando(false);

  } finally {
    setGuardando(false); // 🔓 SIEMPRE se reactiva el botón
  }
};

  // -------------------------
  // EDITAR
  // -------------------------

  const editarProducto = (prod) => {
  setModo("editar");
  setProductoEditando(prod._id);
  setFormData({
    codigo: prod.codigo,
    categoria: prod.categoria,
    descripcion: prod.descripcion,
    medida: prod.medida,
    stock: prod.stock,
    fechaIngreso: prod.fechaIngreso
      ? prod.fechaIngreso.substring(0, 10)
      : "",
    costo: prod.costo,
    venta: prod.venta,
    origen: prod.origen || "COMPRADO",
    generaParticipacion:
    prod.generaParticipacion || false,
    beneficiarioParticipacion:
    prod.beneficiarioParticipacion || "NINGUNO",
    tipoParticipacion:
    prod.tipoParticipacion || "NINGUNA",
    valorParticipacion:
    prod.valorParticipacion || "",
    // ⭐ AQUÍ ESTÁ LA SOLUCIÓN
    foto: prod.foto,      
    preview: undefined,
    actividadProductiva:
      prod.actividadProductiva?._id ||
      prod.actividadProductiva ||
      "",
  });
  setTimeout(() => {
    formularioRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 50);
};

  // -------------------------
  // ELIMINAR
  // -------------------------

  const eliminarProducto = async (id, descripcion) => {      
    const rol = localStorage.getItem("rolUsuario");
    if (rol == "USUARIO") {
      alert("Debe dirigirse al Supervisor para realizar esta acción");
      return;
    }
    if (window.confirm("¿Eliminar este producto?")) {
        setProcesando(true);  
        try {
            const res = await fetch(`${API_URL}/api/productos/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" } // Asegúrate de establecer bien los encabezados
            });            
            const data = await res.json(); // Leer respuesta   
            if (!data.ok) {
                alert(data.error || "No se pudo eliminar el producto");
                setProcesando(false);
                return; // Detener aquí
            }  
            await registrarAccion(`Eliminó el producto "${descripcion}"`);  
            // Actualiza la lista de productos después de la eliminación
            const res2 = await fetch(`${API_URL}/api/productos?sede=${encodeURIComponent(sede)}`);
            setProductos(await res2.json());
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
            alert("Ocurrió un error al intentar eliminar el producto");
        } finally {
            setProcesando(false);
        }
    }
};

  // -------------------------
  // LIMPIAR FORMULARIO
  // -------------------------
  const limpiarFormulario = async () => {
  setModo("crear");
  setProductoEditando(null);
  // pedir el próximo código al backend
  const res = await fetch(`${API_URL}/api/productos/proximo-codigo?sede=${encodeURIComponent(sede)}`);
  const data = await res.json();
    //alert("codigo + data.codigo")
  setFormData({
    codigo: data.codigo,   // 👈 AHORA SÍ: muestra el nuevo código disponible
    categoria: "",
    descripcion: "",
    medida: "",
    stock: "",
    fechaIngreso: obtenerFechaVenezuela(), // ⭐ fecha de hoy
    costo: "",
    venta: "",
    origen: "COMPRADO",
    generaParticipacion: false,
    beneficiarioParticipacion: "NINGUNO",
    tipoParticipacion: "NINGUNA",
    valorParticipacion: "",
    actividadProductiva: "",
    foto: ""
  });
  if (inputFotoRef.current) inputFotoRef.current.value = "";
  };

  // -------------------------
  // RETURN
  // -------------------------

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
      <Encabezado sede={sede} />

    <div style={{ padding: "1px" }}>

      <h2 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
        Gestión de Productos
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
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          {modo === "crear" ? "Registrar Producto" : "Editar Producto"}
        </h3>

        <div style={cajaCodigo}>
          Código asignado: {formData.codigo || "—"}
        </div>

        <select
          name="categoria"
          value={formData.categoria}
          onChange={(e) => {
            handleChange(e);
            setCategoriaSeleccionada(e.target.value);   // ⭐ Guardar categoría activa
            cargarProductos(e.target.value);            // ⭐ Cargar solo esa categoría
          }}
          style={selectEstilo}
        >
          <option value="">Seleccione una categoría</option>
          {categorias.map((c) => (
          <option key={c._id} value={c.codigo}>{c.descripcion}</option>          
          ))}
        </select>

        <input
          name="descripcion"
          placeholder="Descripción"
          value={formData.descripcion}
          onChange={handleChange}
          style={{
            width: "97%",
            marginBottom: "10px",
            padding: "5px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
        <select
          name="actividadProductiva"
          value={formData.actividadProductiva || ""}
          onChange={(e) => {
            const valor = e.target.value;
            setFormData((prev) => ({
              ...prev,
              actividadProductiva: valor
            }));
          }}
          style={selectEstilo}
        >
          <option value="">Seleccione una actividad productiva</option>
          {actividadesProductivas
          .filter((a) => a.activa)
          .map((a) => (
          <option key={a._id} value={a._id}>
            {a.descripcion}
          </option>
          ))}
        </select>

        {/* ORIGEN DEL PRODUCTO */}
        <div
          style={{
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            backgroundColor: esMonasterio ? "#F5EBDD" : "#fff7f7"
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "5px"
            }}
          >
            Origen del producto
          </label>
          <select
            name="origen"
            value={formData.origen}
            onChange={(e) => {
            const nuevoOrigen = e.target.value;
              setFormData((prev) => ({
              ...prev,
              origen: nuevoOrigen,
              costo:
                nuevoOrigen === "PRODUCCION_MONASTERIO"
                ? "0"
                : prev.costo,
              generaParticipacion:
              nuevoOrigen === "PRODUCCION_MONASTERIO"
              ? prev.generaParticipacion
              : false,
              beneficiarioParticipacion:
              nuevoOrigen === "PRODUCCION_MONASTERIO" &&
              prev.generaParticipacion
              ? (esMonasterio ? "TIENDITA" : "MONASTERIO")
              : "NINGUNO",
              tipoParticipacion:
              nuevoOrigen === "PRODUCCION_MONASTERIO"
              ? prev.tipoParticipacion
              : "NINGUNA",
              valorParticipacion:
              nuevoOrigen === "PRODUCCION_MONASTERIO"
              ? prev.valorParticipacion
              : ""
            }));
            }}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #ccc"
              }}
            >
              <option value="COMPRADO">
                COMPRADO PARA REVENTA
              </option>
              <option value="PRODUCCION_MONASTERIO">
                PRODUCCIÓN DEL MONASTERIO
              </option>
            </select>
            {formData.origen === "PRODUCCION_MONASTERIO" && (
            <div style={{ marginTop: "12px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "bold"
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.generaParticipacion}
                  onChange={(e) => {
                  const marcado = e.target.checked;
                    setFormData((prev) => ({
                    ...prev,
                    generaParticipacion: marcado,
                    beneficiarioParticipacion: marcado
                    ? (esMonasterio ? "TIENDITA" : "MONASTERIO")
                    : "NINGUNO",
                    tipoParticipacion: marcado
                    ? prev.tipoParticipacion
                    : "NINGUNA",
                    valorParticipacion: marcado
                    ? prev.valorParticipacion
                    : ""
                    }));
                  }}
                />
                {esMonasterio
                  ? "Genera participación para la Tiendita cuando se venda"
                  : "Genera participación para el Monasterio cuando se venda"}
                </label>
                {formData.generaParticipacion && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "10px"
                  }}
                >
                  <select
                    name="tipoParticipacion"
                    value={formData.tipoParticipacion}
                    onChange={handleChange}
                    style={{
                      width: "55%",
                      padding: "5px"
                    }}
                  >
                    <option value="NINGUNA">
                      Seleccione forma de participación
                    </option>
                    <option value="PORCENTAJE">
                      PORCENTAJE DE LA VENTA
                    </option>
                    <option value="MONTO_FIJO">
                      MONTO FIJO POR UNIDAD
                    </option>
                  </select>
                  <input
                    type="number"
                    name="valorParticipacion"
                    min="0"
                    step="0.01"
                    placeholder={
                    formData.tipoParticipacion === "PORCENTAJE"
                    ? "Ej: 10"
                    : "Ej: 1.50"
                    }
                    value={formData.valorParticipacion}
                    onChange={handleChange}
                    style={{
                      width: "40%",
                      padding: "5px"
                    }}
                  />
                </div>
                )}
                {formData.generaParticipacion &&
                formData.tipoParticipacion === "PORCENTAJE" &&
                formData.valorParticipacion !== "" && (
                <div
                  style={{
                    marginTop: "8px",
                    fontWeight: "bold"
                  }}
                >
                  {esMonasterio
                  ? "A la Tiendita le corresponde "
                  : "Al Monasterio le corresponde "}
                  {Number(formData.valorParticipacion).toFixed(2)}%
                  {" "}de la venta.
                </div>
              )}
              {formData.generaParticipacion &&
              formData.tipoParticipacion === "MONTO_FIJO" &&
              formData.valorParticipacion !== "" && (
              <div
                style={{
                  marginTop: "8px",
                  fontWeight: "bold"
                }}
              >
                {esMonasterio
                ? "A la Tiendita le corresponden US$ "
                : "Al Monasterio le corresponden US$ "}
                {Number(formData.valorParticipacion).toFixed(2)}
                {" "}por unidad vendida.
              </div>
            )}
          </div>
        )}
      </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
          <input
            name="medida"
            placeholder="Medida"
            value={formData.medida}
            onChange={handleChange}
            style={{ width: "49%" }}
          />

          <input
            name="fechaIngreso"
            placeholder="Fecha de ingreso"
            type="date"
            value={formData.fechaIngreso}
            onChange={handleChange}
            style={{ width: "49%" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <input
            name="stock"
            placeholder="Stock Inicial"
            type="number"
            step="0.1"
            value={formData.stock}
            onChange={handleChange}
            style={input25}            
            disabled={localStorage.getItem("rolUsuario") === "USUARIO"}
          />

          <input
            name="costo"
            placeholder={
              formData.origen === "PRODUCCION_MONASTERIO"
              ? "Costo adquisición: 0"
              : "Precio de Costo"
            }
            type="number"
            step="0.1"
            value={formData.costo}
            disabled={formData.origen === "PRODUCCION_MONASTERIO"}
            onChange={handleChange}
            style={input25}
          />

          <input
            name="venta"
            placeholder="Precio de Venta"
            type="number"
            step="0.1"
            value={formData.venta}
            onChange={handleChange}
            style={input25}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <div style={cajaImagen}>
            {formData.foto ? (
              <img                
                src={formData.preview ? formData.preview : formData.foto}                  
                alt="foto"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#777", fontSize: "12px" }}>Sin imagen</span>
            )}
          </div>
        </div>

        <input
          type="file"
          name="foto"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setFormData({
              ...formData,
              foto: file,                     // archivo real
              preview: URL.createObjectURL(file) // URL para mostrar
            });          
          }
          }}
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <button
            style={botonGuardar}
            onClick={guardarProducto}
            disabled={modo === "crear" && guardando}   // 🔒 solo bloquea cuando es nuevo
          >
            {guardando ? "Guardando..." : (modo === "crear" ? "Guardar" : "Actualizar")}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button onClick={() => navigate(esMonasterio ? "/menu-monasterio" : "/menu")} style={estiloBoton}>
          Volver al MENÚ PRINCIPAL
        </button>
      </div>

      {/* TABLA */}
      <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
        Lista de Productos
      </h3>

      <table border="1" cellPadding="14" style={{ width: "100%", textAlign: "center" }}>
        <thead style={{ backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE" }}> 
          <tr>
            <th>Foto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Actividad</th>
            <th>Medida</th>
            <th>Stock</th>
            <th>Ingreso</th>
            <th>Costo</th>
            <th>PrecioAnterior</th>
            <th>Venta</th>
            <th>Origen</th>
            <th>Participación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {productosFiltrados.map((p) => {            
            return (
            <tr key={p._id}>
              <td>
                {p.foto && (
                <img
                  src={p.foto}                    
                  alt="foto"
                  width="60"
                />
                )}
              </td>
              <td>{p.codigo}</td>
              <td>{p.categoria}</td>
              <td>{p.descripcion}</td>
              <td>{p.actividadProductiva?.descripcion  || "—"}</td>
              <td>{p.medida}</td>
              <td>{p.stock}</td>
              <td>{p.fechaIngreso.slice(0, 10).split("-").reverse().join("/")}</td>
              <td>{p.costo}</td>
              <td>{p.precioanterior}</td>
              <td>{p.venta}</td>
              <td>
                {p.origen === "PRODUCCION_MONASTERIO" 
                  ? "MONASTERIO"
                  : "COMPRADO"}
              </td>
              <td>
                {p.origen === "PRODUCCION_MONASTERIO" &&
                p.generaParticipacion ? (
              <>
                <strong>
                  {p.beneficiarioParticipacion === "MONASTERIO"
                  ? "MONASTERIO: "
                  : p.beneficiarioParticipacion === "TIENDITA"
                  ? "TIENDITA: "
                  : ""}
                </strong>
                {p.tipoParticipacion === "PORCENTAJE" ? (
                <strong>{Number(p.valorParticipacion || 0).toFixed(2)}%</strong>
                  ) : p.tipoParticipacion === "MONTO_FIJO" ? (
                <strong>
                  US$ {Number(p.valorParticipacion || 0).toFixed(2)} / unidad
                </strong>
                ) : (
                "—"
                )}
              </>
                ) : (
                "—"
                )}
              </td>
              <td style={{ textAlign: "center" }}>
                <span onClick={() => editarProducto(p)} style={iconoEditar}>
                  ✏️
                </span>

                <span onClick={() => eliminarProducto(p._id, p.descripcion)} style={iconoEliminar}>
                  🗑️
                </span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
  </div>
    </div>
  );
};

export default Productos;