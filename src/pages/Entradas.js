import Encabezado from "../components/Encabezado";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cargarProductos } from "../services/productos";
import { cargarCategorias } from "../services/categorias";
import {  
  cargarEntradas,
  crearEntrada,
  actualizarEntrada,
  eliminarEntradaApi
} from "../services/entradas";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Entradas = () => {
  const navigate = useNavigate();

  // -------------------------
  // ESTILOS GLOBALES
  // -------------------------
  const [procesando, setProcesando] = useState(false);
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
  const [entradas, setEntradas] = useState([]);
  const [modo, setModo] = useState("crear");
  const [entradaEditando, setEntradaEditando] = useState(null);
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

  // -------------------------
  // CARGAR PRODUCTOS Y ENTRADAS
  // -------------------------

  useEffect(() => {
  const cargarTodo = async () => {
    const cats = await cargarCategorias();
    setCategorias(cats);

    const prods = await cargarProductos();
    setProductos(prods);
    
    const resEntradas = await cargarEntradas(1, "");
    setEntradas(resEntradas.entradas);
    setPaginaActual(resEntradas.paginaActual);
    setTotalPaginas(resEntradas.totalPaginas);
  };
  cargarTodo();
  }, []);

  useEffect(() => {
  const cargarPorFecha = async () => {
    const res = await cargarEntradas(paginaActual, formData.fecha || "");
    setEntradas(res.entradas);
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

  // -------------------------
  // FILTRO DE PRODUCTOS POR CATEGORÍA
  // -------------------------

  const productosFiltrados = formData.categoria
    ? productos.filter((p) => p.categoria === formData.categoria)
    : [];

  // -------------------------
  // MANEJO DE FORMULARIO
  // -------------------------

  const handleChange = (e) => {
  const { name, value } = e.target;

  // -----------------------------
  // 1. CANTIDAD (decimales)
  // -----------------------------
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

  // -----------------------------
  // 2. CATEGORÍA (descripción → código)
  // -----------------------------
  if (name === "categoria") {
    const categoriaObj = categorias.find((c) => c.descripcion === value);
    setFormData({
      ...formData,
      categoria: value      
    });
    return;
  }

  // -----------------------------
  // 3. PRODUCTO (Mongo _id)
  // -----------------------------
  if (name === "productoId") {
    const prod = productos.find((p) => p._id === value);
    setFormData({
      ...formData,
      productoId: value,
      codigo: prod ? prod.codigo : ""
    });

    return;
  }

  // -----------------------------
  // 4. CUALQUIER OTRO CAMPO
  // -----------------------------
  setFormData({
    ...formData,
    [name]: typeof value === "string" ? value.toUpperCase() : value
  });
};

  // -------------------------
  // GUARDAR / ACTUALIZAR ENTRADA
  // -------------------------

  const guardarEntrada = async () => {
    if (procesando) return; //evita doble clic
    setProcesando(true);
  
    try {
  if (
    !formData.fecha ||
    !formData.categoria ||
    !formData.productoId ||
    !formData.codigo ||
    !formData.cantidad ||
    !formData.observacion
  ) {
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
    const res = await crearEntrada(formData);
    if (!res.ok) {
      alert(res.error || "Error creando entrada en pages");
      return;
    }
    await registrarAccion(`Registró entrada de ${formData.cantidad} del producto ${formData.codigo}`);
  } else {
    const res = await actualizarEntrada(entradaEditando, formData);
    if (!res.ok) {
      alert(res.error || "Error actualizando entrada");
      return;
    }
    await registrarAccion(`Actualizó entrada del producto ${formData.codigo}`);
  }

  const recarga = await cargarEntradas(paginaActual, formData.fecha || "");
  setEntradas(recarga.entradas);
  setPaginaActual(recarga.paginaActual);
  setTotalPaginas(recarga.totalPaginas);

  limpiarFormulario();
  } finally {
        // ⭐ SIEMPRE se ejecuta, incluso si hubo return arriba
        setProcesando(false);
      }
};

  // -------------------------
  // EDITAR ENTRADA
  // -------------------------

  const editarEntrada = (entrada) => {
  const prod = productos.find((p) => p._id === (entrada.productoId._id || entrada.productoId));

  setModo("editar");
  setEntradaEditando(entrada._id); // ahora viene de Mongo  
  setFormData({
    fecha: entrada.fecha.slice(0, 10), // input date
    categoria: entrada.categoria,
    productoId: entrada.productoId._id || entrada.productoId,
    codigo: prod ? prod.codigo : "",
    cantidad: entrada.cantidad,
    observacion: entrada.observacion
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
    setEntradaEditando(null);
    setFormData({
      fecha: new Date().toISOString().substring(0, 10),
      categoria: "",
      productoId: "",
      codigo: 0,
      cantidad: 0,
      observacion: ""
    });
  };

  // -------------------------
  // ELIMINAR ENTRADA
  // -------------------------

  const eliminarEntrada = async (id) => {
  if (window.confirm("¿Eliminar esta entrada?")) {
    const res = await eliminarEntradaApi(id, usuarioActual);
    if (!res.ok) {
      alert(res.error || "No se pudo eliminar la entrada");
      return;
    }

    const recarga = await cargarEntradas(paginaActual, formData.fecha || "");
    setEntradas(recarga.entradas);
    setPaginaActual(recarga.paginaActual);
    setTotalPaginas(recarga.totalPaginas);

    await registrarAccion(`Eliminó una entrada`);
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
          {modo === "crear" ? "Registrar Entradas" : "Editar Entrada"}
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
                    width: "40%",
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
                style={{ width: "40%" }}
            />
        </div>

        <select
          name="observacion"
          value={formData.observacion}
          onChange={handleChange}
          style={selectEstilo}
        >
          <option value="">Seleccione motivo</option>
          <option value="COMPRAS">COMPRAS</option>
          <option value="PRODUCCIÓN DEL MONASTERIO">PRODUCCIÓN DEL MONASTERIO</option>
          <option value="DONACIONES">DONACIONES</option>
          <option value="REPOSICIÓN">REPOSICIÓN</option>
          <option value="AJUSTE">AJUSTE</option>
        </select>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            style={botonGuardar} 
            onClick={guardarEntrada}
            disabled={procesando}>
            {modo === "crear" ? "Guardar Entrada" : "Actualizar Entrada"}
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
        Listado de Entradas por fecha
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
          {entradas.map((e) => (
            <tr key={e._id}>
              <td>{new Date(e.fecha).toLocaleDateString("es-VE")}</td>
              <td>{e.categoria}</td>
              <td>{e.productoId?.codigo}</td>
              <td>{e.productoId?.descripcion}</td>
              <td>{e.cantidad}</td>
              <td>{e.observacion}</td>
              <td>
                <span onClick={() => editarEntrada(e)} style={iconoEditar}>✏️</span>
                <span onClick={() => eliminarEntrada(e._id)} style={iconoEliminar}>🗑️</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>    
  );
};

export default Entradas;