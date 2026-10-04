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
import {obtenerFechaVenezuela} from "../utils/fechaVenezuela";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Entradas = () => {
  const navigate = useNavigate();
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  // -------------------------
  // ESTILOS GLOBALES
  // -------------------------
  const [procesando, setProcesando] = useState(false);
  const estiloBotonVolver = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#5A2D16" : "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonGuardar = {
    width: "30%",
    padding: "6px",
    backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
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
    backgroundColor: esMonasterio ? "#E8D1A5" : "#EDC5CD",
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
    fecha: obtenerFechaVenezuela(),
    categoria: "",
    productoId: "",
    codigo: 0,
    cantidad: 0,
    preciocompra: 0,
    precioventa: 0,
    observacion: ""
  });
  
  useEffect(() => {
  const cargar = async () => {
    const cats = await cargarCategorias();
    setCategorias(cats.categorias || cats);

    const prods = await cargarProductos(sede);    
    setProductos(prods.productos || prods);

    const res = await cargarEntradas(paginaActual, 20, sede);
    setEntradas(res.entradas);
    setTotalPaginas(res.totalPages || 1);
  };

  cargar();
}, [paginaActual, sede]);


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
  // 1. CANTIDAD
  // -----------------------------
  if (name === "cantidad") {
    let numero = value.replace(",", ".");
    setFormData({ ...formData, cantidad: numero });
    return;
  }

  // -----------------------------
  // 2. CATEGORÍA
  // -----------------------------
  if (name === "categoria") {
    setFormData({
      ...formData,
      categoria: value
    });
    return;
  }

  // -----------------------------
  // 3. PRODUCTO
  // -----------------------------
  if (name === "productoId") {
    const prod = productos.find((p) => p._id === value);
    const esProduccionMonasterio =
      prod?.origen === "PRODUCCION_MONASTERIO";
    setFormData({
      ...formData,
      productoId: value,
      codigo: prod?.codigo || "",      
      precioCompra: esProduccionMonasterio
        ? 0
        : Number(prod?.costo || 0),
      precioVenta: Number(prod?.venta || 0),
      observacion: esProduccionMonasterio
        ? "PRODUCCIÓN DEL MONASTERIO"
        : ""
    });

    return;   // ⭐ IMPORTANTE
  }

  // -----------------------------
// 4. OBSERVACIÓN
// -----------------------------
if (name === "observacion") {
  let nuevoPrecioCompra = formData.precioCompra;
  let nuevoPrecioVenta = formData.precioVenta;

  // PRODUCCIÓN DEL MONASTERIO:
  // no tiene costo de adquisición
  if (value === "PRODUCCIÓN DEL MONASTERIO") {
    nuevoPrecioCompra = 0;
  }

  // Otros motivos no manejan precios
  if (
    value !== "COMPRAS" &&
    value !== "PRODUCCIÓN DEL MONASTERIO"
  ) {
    nuevoPrecioCompra = 0;
    nuevoPrecioVenta = 0;
  }

  setFormData({
    ...formData,
    observacion: value,
    precioCompra: nuevoPrecioCompra,
    precioVenta: nuevoPrecioVenta
  });

  return;
}

  // -----------------------------
  // 5. CUALQUIER OTRO CAMPO
  // -----------------------------
  setFormData({ ...formData, [name]: value });
};

  // -------------------------
  // GUARDAR / ACTUALIZAR ENTRADA
  // -------------------------
  const guardarEntrada = async () => {
  if (procesando) return; 
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

    // ⭐ VALIDACIONES DE PRECIOS SEGÚN MOTIVO
    if (formData.observacion === "COMPRAS") {
      // precioCompra obligatorio
      if (!formData.precioCompra || formData.precioCompra <= 0) {
        alert("Debe ingresar el precio de compra.");
        return;
      }

      // precioVenta obligatorio
      if (!formData.precioVenta || formData.precioVenta <= 0) {
        alert("Debe ingresar el precio de venta.");
        return;
      }

      // Validación del 30%
      if (Number(formData.precioVenta) < Number(formData.precioCompra) * 1.30) {
        alert("El precio de venta debe ser al menos 30% mayor que el precio de compra.");
        return;
      }
    }

    if (formData.observacion === "PRODUCCIÓN DEL MONASTERIO") {

  // Precio de venta obligatorio
  if (
    !formData.precioVenta ||
    Number(formData.precioVenta) <= 0
  ) {
    alert("Debe ingresar el precio de venta.");
    return;
  }

  // La producción del Monasterio no tiene
  // costo de adquisición en Entradas.  
}

    // ⭐ PREPARAR LOS PRECIOS SEGÚN EL MOTIVO
let precioCompraFinal = Number(formData.precioCompra || 0);
let precioVentaFinal = Number(formData.precioVenta || 0);

// PRODUCCIÓN DEL MONASTERIO:
// no tiene costo de adquisición
if (formData.observacion === "PRODUCCIÓN DEL MONASTERIO") {
  precioCompraFinal = 0;
}

// DONACIONES, REPOSICIÓN Y AJUSTE:
// no manejan precios
if (
  formData.observacion !== "COMPRAS" &&
  formData.observacion !== "PRODUCCIÓN DEL MONASTERIO"
) {
  precioCompraFinal = 0;
  precioVentaFinal = 0;
}

// ⭐ DATOS DEFINITIVOS QUE SE ENVIARÁN AL BACKEND
const datosEntrada = {
  ...formData,

  cantidad: Number(formData.cantidad),

  precioCompra: precioCompraFinal,
  precioVenta: precioVentaFinal,

  sede
};

    // ⭐ CREAR O EDITAR
    let res;

    if (modo === "crear") {
      res = await crearEntrada(datosEntrada);
      if (!res.ok) {
        alert(res.error || "Error creando entrada en pages");
        return;
      }
      await registrarAccion(
        `Registró entrada de ${formData.cantidad} del producto ${formData.codigo}`
      );
    } else {
      res = await actualizarEntrada(entradaEditando, datosEntrada);
      if (!res.ok) {
        alert(res.error || "Error actualizando entrada");
        return;
      }
      await registrarAccion(
        `Actualizó entrada del producto ${formData.codigo}`
      );
    }

    // ⭐ RECARGAR LISTA
    const recarga = await cargarEntradas(paginaActual, 20, sede);
    setEntradas(recarga.entradas);
    setPaginaActual(recarga.page);
    setTotalPaginas(recarga.totalPages);

    limpiarFormulario();

  } finally {
    setProcesando(false);
  }
};

  // -------------------------
  // EDITAR ENTRADA
  // -------------------------

  const editarEntrada = (entrada) => {
    const prod = productos.find(
    (p) => p._id === (entrada.productoId._id || entrada.productoId)
    );
    setModo("editar");
    setEntradaEditando(entrada._id);
    setFormData({
      fecha: entrada.fecha.slice(0, 10),
      categoria: entrada.productoId?.categoria || "",
      productoId: entrada.productoId._id || entrada.productoId,
      codigo: entrada.productoId?.codigo || "",
      descripcion: entrada.productoId?.descripcion || "",
      cantidad: entrada.cantidad,
      precioCompra: entrada.precioCompra,
      precioVenta: entrada.precioVenta,
      observacion: entrada.observacion || ""   
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
      fecha: obtenerFechaVenezuela(),
      categoria: "",
      productoId: "",
      codigo: 0,
      cantidad: 0,
      precioCompra: 0,
      precioVenta: 0,
      observacion: ""
    });
  };

  // -------------------------
  // ELIMINAR ENTRADA
  // -------------------------

  const eliminarEntrada = async (entrada) => {
  const rol = localStorage.getItem("rolUsuario");
  // ⭐ SOLO ADMINISTRADOR puede eliminar AJUSTES
  if (entrada.observacion === "AJUSTE") {
    if (rol !== "ADMINISTRADOR") {
      alert("No está permitido eliminar los registros de AJUSTE");
      return;
    }
  //} else {
  //  // ⭐ Ningún usuario puede eliminar entradas normales
  //  alert("No está permitido eliminar este tipo de registro");
  //  return;
  }
  // ⭐ Seguridad adicional
  if (rol === "USUARIO") {
    alert("Debe dirigirse al Supervisor para realizar esta acción");
    return;
  }
  if (window.confirm("¿Eliminar esta entrada?")) {
    const res = await eliminarEntradaApi(entrada._id, usuarioActual); // ✔ CORRECTO
    if (!res.ok) {
      alert(res.error || "No se pudo eliminar la entrada");
      return;
    }
    const recarga = await cargarEntradas(paginaActual, 20, sede);
    setEntradas(recarga.entradas);
    setPaginaActual(recarga.page);
    setTotalPaginas(recarga.totalPages);
    await registrarAccion(`Eliminó una entrada`);
  }
};
  
  // -------------------------
  // RETURN
  // -------------------------

  return (
    <div>
      <Encabezado sede={sede} />

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
        {(formData.observacion === "COMPRAS" || formData.observacion === "PRODUCCIÓN DEL MONASTERIO") && (
        <div style={{ display: "flex", gap: "40px", marginBottom: "10px" }}>
    
          {/* PRECIO COMPRA */}          
          <input
            name="precioCompra"
            placeholder={
              formData.observacion === "PRODUCCIÓN DEL MONASTERIO"
              ? "Costo adquisición: 0"
              : "Precio compra"
            }  
            type="number"
            step="0.01"
            value={formData.precioCompra}
            onChange={handleChange}
            disabled={formData.observacion === "PRODUCCIÓN DEL MONASTERIO"} 
            style={{ width: "40%" }}
          />

          {/* PRECIO VENTA */}          
          <input
            name="precioVenta"
            placeholder="Precio venta"
            type="number"
            step="0.01"
            value={formData.precioVenta}
            onChange={handleChange}
            style={{ width: "40%" }}
          />
        </div>
        )}

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
        <button onClick={() => navigate(esMonasterio ? "/menu-monasterio" : "/menu")} style={estiloBotonVolver}>
          Volver al MENÚ PRINCIPAL
        </button>
      </div>

      {/* TABLA */}
      <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
        Listado de Entradas por fecha
      </h3>

      <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "center" }}>
        <thead
          style={{
            backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
            color: "Black"
            }}
          >
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>P-Compra</th>
            <th>P-Venta</th>
            <th>Observación</th>
            <th>Acciones</th>
          </tr>
        </thead> 

        <tbody>
          {entradas.map((e) => (
          <tr key={e._id}>
              <td>{e.fecha.slice(0, 10).split("-").reverse().join("/")}</td>
              <td>{e.productoId?.categoria}</td>
              <td>{e.productoId?.codigo}</td>
              <td>{e.productoId?.descripcion}</td>
              <td>{Number(e.cantidad).toFixed(3)}</td>
              {/* ⭐ Mostrar precioCompra si existe */}
              <td>
                {e.precioCompra != null ? Number(e.precioCompra).toFixed(2) : "-"}
              </td>
              {/* ⭐ Mostrar precioVenta si existe */}
              <td>
                {e.precioVenta != null ? Number(e.precioVenta).toFixed(2) : "-"}
              </td>
              <td>{e.observacion}</td>
              <td>
                <span onClick={() => editarEntrada(e)} style={iconoEditar}>✏️</span>
                <span onClick={() => eliminarEntrada(e)} style={iconoEliminar}>🗑️</span>
              </td>
            </tr>
          ))}
        </tbody>        
      </table>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button onClick={() => setPaginaActual(1)}>
          Inicio ⏮️
        </button>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
        >
          ◀ Anterior
        </button>
        <span style={{ margin: "0 15px" }}>
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
        >
          Siguiente ▶
        </button>
        <button onClick={() => setPaginaActual(totalPaginas)}>
          Ir al final ⏭️
        </button>
      </div>
    </div>
    </div>    
  );
};

export default Entradas;
