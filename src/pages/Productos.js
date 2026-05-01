import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Productos = () => {
  const navigate = useNavigate();

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
    fontFamily: "Arial Black, Arial, sans-serif",
    letterSpacing: "1px",
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
  const [modo, setModo] = useState("crear");
  const [productoEditando, setProductoEditando] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const formularioRef = useRef(null);  
  const [procesando, setProcesando] = useState(false);

  const [formData, setFormData] = useState({
    codigo: 0,
    categoria: "",
    descripcion: "",
    medida: "",
    stock: "",
    fechaIngreso: new Date().toISOString().split("T")[0], // ⭐ fecha de hoy
    costo: "",
    venta: "",
    foto: ""
  });

  const productosFiltrados = formData.categoria
    ? productos.filter((p) => p.categoria === formData.categoria)
    : productos;

  const inputFotoRef = useRef(null);

  // -------------------------
  // LOCALSTORAGE
  // -------------------------

  useEffect(() => {
    setProcesando(true);    
  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos`);

      if (!res.ok) {
        throw new Error("Error cargando productos");
      }

      const data = await res.json();
      setProductos(data);

      // ⭐ Asegurar que eliminando SIEMPRE esté en false al entrar
      

    } catch (error) {
      console.error("Error cargando productos:", error);
      setProductos([]);      
    }
  };
  cargarProductos();
  registrarAccion("Ingresó al módulo Productos");
  setProcesando(false);
}, []);

  useEffect(() => {
  const cargarCategorias = async () => {
    const res = await fetch(`${API_URL}/api/categorias`);
    const data = await res.json();
    setCategorias(data);
  };
  cargarCategorias();
  }, []);

  useEffect(() => {
  limpiarFormulario();   // 👈 genera el primer código al iniciar  
  }, []);

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
        foto: URL.createObjectURL(file),
        fotoFile: file   // guardamos el File REAL para enviarlo al backend
      }));
    }
    return;
  }

  // ⭐ Campos numéricos SIN convertir a número
  const camposNumericos = ["stock", "costo", "venta"];
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
  // -------------------------
  // VALIDAR CAMPOS OBLIGATORIOS
  // -------------------------
  if (
    !formData.descripcion ||
    !formData.categoria ||
    !formData.venta ||
    !formData.stock === "" ||
    !formData.medida ||
    !formData.fechaIngreso
  ) {
    alert("Complete todos los campos obligatorios");
    return;
  }

  // -------------------------
  // VALIDAR COSTO < VENTA
  // -------------------------
  if (Number(formData.venta) <= Number(formData.costo)) {
    alert("El precio de venta debe ser mayor al costo.");
    return;
  }

  // -------------------------
  // CREAR PRODUCTO
  // -------------------------
  if (modo === "crear") {
       setProcesando(true);

    // No enviamos el código porque lo genera el backend
    const { codigo, ...productoSinCodigo } = formData;

    const respuesta = await fetch(`${API_URL}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoSinCodigo)
    });

    const data = await respuesta.json();

    // 👇 AQUÍ guardas el código generado
    setFormData((prev) => ({
      ...prev,
      codigo: data.producto.codigo
    }));

    await registrarAccion(`Registró el producto "${formData.descripcion}"`);

  } else {
    if (!productoEditando) {
    alert("Error interno: no hay producto seleccionado para editar.");
    return;
  }    
    // -------------------------
    // EDITAR PRODUCTO
    // -------------------------
    setProcesando(true);
    await fetch(`${API_URL}/api/productos/${productoEditando}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    setProcesando(false);
    await registrarAccion(`Actualizó el producto "${formData.descripcion}"`);
  }

  // -------------------------
  // RECARGAR LISTA DE PRODUCTOS
  // -------------------------
  const res = await fetch(`${API_URL}/api/productos`);
  setProductos(await res.json());

  // -------------------------
  // LIMPIAR FORMULARIO
  // -------------------------
  limpiarFormulario();
  setProcesando(false);
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
    foto: prod.foto
  });
  setTimeout(() => {
    formularioRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 50);
};

  // -------------------------
  // ELIMINAR
  // -------------------------

  const eliminarProducto = async (id, descripcion) => {      
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
            const res2 = await fetch(`${API_URL}/api/productos`);
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
  const res = await fetch(`${API_URL}/api/productos/proximo-codigo`);
  const data = await res.json();
    //alert("codigo + data.codigo")
  setFormData({
    codigo: data.codigo,   // 👈 AHORA SÍ: muestra el nuevo código disponible
    categoria: "",
    descripcion: "",
    medida: "",
    stock: "",
    fechaIngreso: new Date().toISOString().split("T")[0], // ⭐ fecha de hoy
    costo: "",
    venta: "",
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
      background: "#6699FF",
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
        Gestión de Productos
      </h2>      

      {/* FORMULARIO */}
      <div
        ref={formularioRef}
        style={{
          width: "550px",
          margin: "0 auto 1px auto",
          padding: "1px",
          border: "1px solid #ccc",
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
          onChange={handleChange}
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
          />

          <input
            name="costo"
            placeholder="Precio de Costo"
            type="number"
            step="0.1"
            value={formData.costo}
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
                src={formData.foto}
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
          ref={inputFotoRef}
          onChange={handleChange}
          style={{ marginBottom: "10px" }}
        />

        <div style={{ display: "flex", justifyContent: "center",marginBottom: "10px" }}>
          <button style={botonGuardar} onClick={guardarProducto}>
            {modo === "crear" ? "Guardar" : "Actualizar"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button onClick={() => navigate("/menu")} style={estiloBoton}>
          Volver al MENÚ PRINCIPAL
        </button>
      </div>

      {/* TABLA */}
      <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
        Lista de Productos
      </h3>

      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
        <thead>
          <tr>
            <th>Foto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Medida</th>
            <th>Stock</th>
            <th>Ingreso</th>
            <th>Costo</th>
            <th>Venta</th>
            <th>Acciones</th>
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
              <td>{p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleDateString("es-VE") : "—"}</td>
              <td>{p.costo}</td>
              <td>{p.venta}</td>
              <td style={{ textAlign: "center" }}>
                <span onClick={() => editarProducto(p)} style={iconoEditar}>
                  ✏️
                </span>

                <span onClick={() => eliminarProducto(p._id, p.descripcion)} style={iconoEliminar}>
                  🗑️
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
  </div>
    </div>
  );
};

export default Productos;