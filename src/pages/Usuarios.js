import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarios, crearUsuario, eliminarUsuario, actualizarUsuario } from "../services/usuarios";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";

function Usuarios() {

  // -----------------------------
  // 🔹 HOOKS (SIEMPRE VAN ARRIBA)
  // -----------------------------

  const [usuarios, setUsuarios] = useState([]);
  const navigate = useNavigate();
  const [modo, setModo] = useState("crear");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    clave: "",
    rol: ""
  });

  const inputNombreRef = useRef(null);

  // -----------------------------
  // 🔹 ESTILOS (DEBEN IR ANTES DE LA VALIDACIÓN)
  // -----------------------------

  const botonGuardar = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonAccion = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };

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

  // -----------------------------
  // 🔹 EFECTOS
  // -----------------------------

  useEffect(() => {
    inputNombreRef.current?.focus();
  }, []);

  useEffect(() => {
    inputNombreRef.current?.focus();
  }, [modo]);

  useEffect(() => {
    async function cargar() {
      const data = await obtenerUsuarios();
      let lista = [];

      if (Array.isArray(data)) lista = data;
      else if (Array.isArray(data.usuarios)) lista = data.usuarios;
      else if (Array.isArray(data.data)) lista = data.data;
      else if (Array.isArray(data.results)) lista = data.results;
      else {
        const posibleArray = Object.values(data).find(v => Array.isArray(v));
        if (Array.isArray(posibleArray)) lista = posibleArray;
      }

      setUsuarios(lista);
    }

    cargar();
  }, []);

  useEffect(() => {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    recargarLogs();
  }, []);

  async function recargarLogs(pagina = 1) {
    const res = await fetch(`${API_URL}/api/logs?page=${pagina}&limit=20`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setLogs(data);
      setPage(1);
      setTotalPages(1);
      return;
    }

    setLogs(Array.isArray(data.logs) ? data.logs : []);
    setPage(data.page || 1);
    setTotalPages(data.totalPages || 1);
  }

  // -----------------------------
  // 🔹 VALIDACIÓN DE ROL (DEBE IR DESPUÉS DE HOOKS Y ESTILOS)
  // -----------------------------

  const rol = localStorage.getItem("rolUsuario")?.toUpperCase().trim();

  if (rol !== "ADMINISTRADOR") {
    return <h2 style={{ color: "red" }}>Acceso denegado</h2>;
  }

  // -----------------------------
  // 🔹 MANEJO DE FORMULARIO
  // -----------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.usuario || !formData.clave || !formData.rol) {
      alert("Complete todos los campos");
      return;
    }

    const nuevo = await crearUsuario(formData);
    setUsuarios([...usuarios, nuevo]);
    await registrarAccion(`Registró al usuario "${formData.usuario}"`);
    await recargarLogs();

    setFormData({ nombre: "", usuario: "", clave: "", rol: "" });
    setModo("crear");
  };

  const handleEditar = (user) => {
    setModo("editar");
    setUsuarioEditando(user);
    setFormData({
      nombre: user.nombre,
      usuario: user.usuario,
      clave: user.clave,
      rol: user.rol
    });
  };

  const handleActualizar = async () => {
    await actualizarUsuario(usuarioEditando._id, formData);

    const actualizados = usuarios.map((u) =>
      u._id === usuarioEditando._id
        ? { ...u, ...formData }
        : u
    );

    setUsuarios(actualizados);
    setFormData({ nombre: "", usuario: "", clave: "", rol: "" });
    setModo("crear");
    setUsuarioEditando(null);

    await registrarAccion(`Actualizó al usuario "${usuarioEditando.usuario}"`);
    await recargarLogs();
  };

  const handleCancelar = () => {
    setModo("crear");
    setUsuarioEditando(null);
    setFormData({ nombre: "", usuario: "", clave: "", rol: "" });
  };

  const handleEliminar = async (id, usuario) => {
    await eliminarUsuario(id);
    setUsuarios(usuarios.filter((u) => u._id !== id));
    await registrarAccion(`Eliminó al usuario "${usuario}"`);
    await recargarLogs();
  };

  // -----------------------------
  // 🔹 RENDER
  // -----------------------------
  
  return (
    <div>
      <Encabezado />

    <div style={{ padding: "20px" }}>       

      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Gestión de Usuarios
      </h2>

      {/* FORMULARIO */}
      <div
        style={{
          width: "350px",
          margin: "0 auto 20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ textAlign: "center" }}>
          {modo === "crear" ? "Registrar Usuario" : "Editar Usuario"}
        </h3>

        <input
          ref={inputNombreRef}
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={formData.nombre}
          onChange={handleChange}
          style={{ width: "95%", padding: "6px", marginBottom: "8px" }}
        />

        <input
          type="text"
          name="usuario"
          placeholder="Usuario"
          value={formData.usuario}
          onChange={handleChange}
          style={{ width: "95%", padding: "6px", marginBottom: "8px" }}
        />

        <input
          type="text"
          name="clave"
          placeholder="Contraseña"
          value={formData.clave}
          onChange={handleChange}
          style={{ width: "95%", padding: "6px", marginBottom: "8px" }}
        />

        <select
          name="rol"
          value={formData.rol}
          onChange={handleChange}
          style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
        >
          <option value="">Seleccione un rol</option>
          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
          <option value="USUARIO">USUARIO</option>
        </select>

        {modo === "crear" ? (
          <button onClick={handleGuardar} style={botonGuardar}>
            Guardar
          </button>
        ) : (
          <>
            <button
              onClick={handleActualizar}
              style={{ ...botonAccion, backgroundColor: "#6699FF", color: "white", width: "48%", marginRight: "4%" }}
            >
              Actualizar
            </button>
            <button
              onClick={handleCancelar}
              style={{ ...botonAccion, backgroundColor: "#999", color: "white", width: "48%" }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1px" }}> 
        <button
          onClick={() => navigate("/menu")}
          style={estiloBoton}
        >
          Volver al MENÚ PRINCIPAL
        </button>
      </div>    
      {/* TABLA DE USUARIOS */}
      <h3>Usuarios registrados</h3>
      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", marginBottom: "20px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Contraseña</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(usuarios) && usuarios.map((u) => (
            <tr key={u._id}>
              <td>{u.nombre}</td>
              <td>{u.usuario}</td>
              <td>{u.clave}</td>
              <td>{u.rol}</td>
              <td>
                <button
                  onClick={() => handleEditar(u)}
                  style={{ ...botonAccion, marginRight: "6px", backgroundColor: "#FFD966" }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(u._id, u.usuario)}
                  style={{ ...botonAccion, backgroundColor: "red", color: "white" }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}

          {usuarios.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                No hay usuarios registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* BITÁCORA DE ACCIONES */}
      <h3>Bitácora de acciones</h3>
      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th>Fecha y hora</th>
            <th>Usuario</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {(logs || []).map((l) => (
          <tr key={l._id}>
            <td>{new Date(l.fecha).toLocaleString()}</td>
            <td>{l.usuario || "—"}</td>
            <td>{l.accion || "—"}</td>
          </tr>
          ))}

          {(logs || []).length === 0 && (
          <tr>
            <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
              No hay acciones registradas
            </td>
          </tr>
          )}
        </tbody>
      </table>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          disabled={page === 1}
          onClick={() => recargarLogs(page - 1)}
        >
          ◀ Anterior
        </button>

        <span style={{ margin: "0 15px" }}>
          Página {page} de {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => recargarLogs(page + 1)}
        >
          Siguiente ▶
        </button>
      </div>   
    </div>
    </div>
  );
}

export default Usuarios;