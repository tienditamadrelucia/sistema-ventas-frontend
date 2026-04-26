import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from "../services/clientes";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config"; // ajusta la ruta según tu carpeta

const Clientes = () => {
  const navigate = useNavigate();
  const usuarioActual = localStorage.getItem("usuario") || "ADMIN";

  const [clientes, setClientes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modo, setModo] = useState("crear");
  const [clienteEditando, setClienteEditando] = useState(null);
  const formularioRef = useRef(null);  

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [identificacion, setIdentificacion] = useState("");   
  const [procesando, setProcesando] = useState(false); 

  const [formData, setFormData] = useState({
    identificacion: "",
    nombreCompleto: "",
    direccion: "",
    telefono: "",
    fechaIngreso: new Date().toISOString().substring(0, 10),     
  });

  // -------------------------
  // ESTILOS GLOBALES (idénticos a ENTRADAS)
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
    cursor: "pointer",
    marginTop: "8px",
    opacity:procesando ? 0.6 :1,
    cursor: procesando ? "not-allowed":"pointer"
  };

  // Campos editables → fondo blanco
  const inputEstilo = {
    width: "100%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "white",
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

  async function cargarClientes(pagina = 1) {
  const data = await obtenerClientes(pagina);

  setClientes(data.clientes);     // ← ya no hay que adivinar
  setPage(data.page);
  setTotalPages(data.totalPages);
  }

  useEffect(() => {
    cargarClientes(1);
  }, []);  

  const handleChange = (e) => {
  const { name, value } = e.target;

  // VALIDACIÓN IDENTIFICACIÓN
  if (name === "identificacion") {
    let val = value.toUpperCase();

      // Solo permite: 1 letra V/E/J/G + números
      if (/^[VEJG]?[0-9]*$/.test(val)) {
        setFormData({ ...formData, identificacion: val });
      }
      return;
    }

    // VALIDACIÓN TELÉFONO
    if (name === "telefono") {
      let soloNumeros = value.replace(/\D/g, "");
      setFormData({ ...formData, telefono: soloNumeros });
      return;
    }

    // RESTO DE CAMPOS
    setFormData({
      ...formData,
      [name]: typeof value === "string" ? value.toUpperCase() : value
    });
  };

  const guardarCliente = async () => {
  if (procesando) return; //evita doble clic
  setProcesando(true);  
  try {
  try {
    // Validación 
    if (clientes.some(c => c.identificacion === formData.identificacion && c._id !== clienteEditando?._id)) {
      alert("❌ La identificación ya existe");
      return;
      }
    if (!validarTelefono(formData.telefono)) {
      alert("Teléfono inválido. Ejemplo: 04121234567");
      return;
    }
    // Siempre usar fecha del día
    const fechaFinal = new Date();      
    if (modo === "crear") {
      await crearCliente({
        ...formData,
        fechaIngreso: fechaFinal
      });
      await registrarAccion(`Registró al cliente "${formData.nombreCompleto}"`);
    } else {        
      await actualizarCliente(clienteEditando._id, {
        ...formData,
        fechaIngreso: fechaFinal
      });
      await registrarAccion(`Actualizó al cliente "${formData.nombreCompleto}"`);
    }
    // Recargar lista
    const res = await fetch("${API_URL}/api/clientes");
    const data = await res.json();
    setClientes(data);
    limpiarFormulario();
  } catch (error) {
    console.error("Error en guardarCliente:", error);
  }  
  } finally {
    // ⭐ SIEMPRE se ejecuta, incluso si hubo return arriba
    setProcesando(false);
  }
};

  const editarCliente = (cliente) => {
  setModo("editar");
  setClienteEditando(cliente);

  setFormData({
    identificacion: cliente.identificacion || "",
    nombreCompleto: cliente.nombreCompleto || "",
    direccion: cliente.direccion || "",
    telefono: cliente.telefono || "",
    fechaIngreso: cliente.fechaIngreso || ""
  });

  setTimeout(() => {
    formularioRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 50);
};

  const limpiarFormulario = () => {
    setModo("crear");
    setClienteEditando(null);
    setFormData({
      identificacion: "",
      nombreCompleto: "",
      direccion: "",
      telefono: ""      
    });
  };

  const eliminar = async (id) => {
  if (window.confirm("¿Eliminar este cliente?")) {
    const res = await eliminarCliente(id, usuarioActual);
    
    if (!res.ok) {
      alert(res.error || "No se pudo eliminar el cliente");
      return;
    }

    // 🔁 Recargar lista desde el backend
    const resp = await fetch("${API_URL}/api/clientes");
    const data = await resp.json();
    setClientes(data);

    await registrarAccion(`Eliminó un cliente`);
  }
};

   const validarTelefono = (valor) => {
    const regex = /^(0276|0412|0416|0426|0414|0424)\d{7}$/;
    return regex.test(valor);
  };

  return (
    <div>
      <Encabezado />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Gestión de Clientes
        </h2>

        {/* FORMULARIO */}
        <div 
          ref={formularioRef}
          style={{ width: "550px", margin: "0 auto 20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "white" }}>
          <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
            {modo === "crear" ? "Registrar Cliente" : "Editar Cliente"}
          </h3>

          <input
            type="text"
            name="identificacion"
            placeholder="Identificación (V12345678 / J123456789)"
            value={formData.identificacion}
            style={{ width: "45%", marginBottom: "10px", padding: "5px" }}
            onChange={(e) => {
              let valor = e.target.value.toUpperCase(); // V, E, J, G + números              
            // Actualizar el formData
              setFormData(prev => ({ ...prev, identificacion: valor }));
            }}
            onBlur={()=> {
              const valor = formData.identificacion;
            
            // 1️⃣ Validación de formato
            const regex = /^[VEJG][0-9]+$/;

            if (!regex.test(valor)) {
              alert("❌ Formato inválido. Debe comenzar con V, E, J o G y luego números.");
              setFormData(prev => ({ ...prev, identificacion: "" }));
              return;
            }

            // VALIDACIÓN INMEDIATA
            const existe = clientes.some(c =>
              c.identificacion === valor &&
              c._id !== clienteEditando?._id
            );

            if (existe) {
              alert("❌ La identificación ya existe");
              // Opcional: limpiar el campo
              setFormData({ ...formData, identificacion: "" });
            }
            }}
          />         
          
          <input name="nombreCompleto" placeholder="Nombre Completo" value={formData.nombreCompleto} onChange={handleChange} style={{ width: "100%", marginBottom: "10px", padding: "5px" }} />
          <input name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} style={{ width: "100%", marginBottom: "10px", padding: "5px" }} />
          <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} style={{ width: "100%", marginBottom: "10px", padding: "5px" }} />          

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button 
              style={botonGuardar} 
              disabled={procesando}
              onClick={guardarCliente}>
              {modo === "crear" ? "Guardar Cliente" : "Actualizar Cliente"}
            </button>
          </div>
        </div>
        {/* BOTÓN VOLVER */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <button onClick={() => navigate("/menu")} style={estiloBoton}>
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* TABLA */}
        <h3 style={{ textAlign: "center", marginBottom: "1px", fontWeight: "bold" }}>
          Listado de Clientes
        </h3>

        <table border="1" cellPadding="1" style={{ width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Ingreso</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(clientes) && clientes.map((c) => (
            <tr key={c._id}>
              <td>{c.identificacion}</td>
              <td>{c.nombreCompleto}</td>
              <td>{c.direccion}</td>
              <td>{c.telefono}</td>

              {/* Fecha formateada en formato venezolano */}
              <td>{new Date(c.fechaIngreso).toLocaleDateString("es-VE")}</td>

              <td>
                <span
                  onClick={() => editarCliente(c)}
                  style={{ cursor: "pointer", marginRight: "10px" }}
                >
                  ✏️
                </span>

                <span
                  onClick={() => eliminar(c._id)}
                  style={{ cursor: "pointer", color: "#B84A4A" }}
                >
                  🗑️
                </span>
              </td>
            </tr>
            ))}
          </tbody>
        </table>           
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button onClick={() => cargarClientes(1)}>
              Inicio ⏮️
            </button>
            <button
              disabled={page === 1}
              onClick={() => cargarClientes(page - 1)}
            >
              ◀ Anterior
            </button>
            <span style={{ margin: "0 15px" }}>
              Página {page} de {totalPages}
            </span>          
                        
            <button
              disabled={page === totalPages}
              onClick={() => cargarClientes(page + 1)}
            >
              Siguiente ▶
            </button>
            <button onClick={() => cargarClientes(totalPages)}>
              Ir al final ⏭️
            </button>
          </div>
      </div>
    </div>
  );
};

export default Clientes;