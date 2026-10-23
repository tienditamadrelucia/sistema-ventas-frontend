import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerUsuarios,
  crearUsuario,
  eliminarUsuario,
  actualizarUsuario
} from "../services/usuarios";
import { registrarAccion } from "../utils/registrarAccion";
import { API_URL } from "../config";

const formularioVacio = () => ({
  nombre: "",
  usuario: "",
  clave: "",
  rol: "",
  accesoTiendita: true,
  accesoMonasterio: false
});

// Solo conservar datos públicos en la lista.
function usuarioPublico(user) {
  return {
    _id: user._id,
    nombre: user.nombre,
    usuario: user.usuario,
    rol: user.rol,
    accesoTiendita: user.accesoTiendita !== false,
    accesoMonasterio: user.accesoMonasterio === true
  };
}

function Usuarios() {
  const navigate = useNavigate();
  const inputNombreRef = useRef(null);

  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";
  const rol = localStorage.getItem("rolUsuario")
    ?.toUpperCase()
    .trim();
  const esAdministrador = rol === "ADMINISTRADOR";

  const [usuarios, setUsuarios] = useState([]);
  const [modo, setModo] = useState("crear");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState(formularioVacio);
  const [logs, setLogs] = useState([]);
  const [sedeLogs, setSedeLogs] = useState("TODAS");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoLogs, setCargandoLogs] = useState(false);

  const procesando = cargando || guardando || cargandoLogs;

  const botonAccion = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const botonGuardar = {
    ...botonAccion,
    width: "100%",
    padding: "10px",
    backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
    color: "white",
    fontFamily: "Arial Black",
    marginTop: "10px"
  };

  const estiloInput = {
    width: "95%",
    padding: "6px",
    marginBottom: "8px"
  };

  const cabeceraTabla = {
    backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE",
    color: esMonasterio ? "#33231A" : "#000"
  };

  useEffect(() => {
    inputNombreRef.current?.focus();
  }, [modo]);

  useEffect(() => {
    // Eliminar la caché anterior, que pudo contener claves.
    localStorage.removeItem("usuarios");

    if (!esAdministrador) return;

    let activo = true;

    async function cargar() {
      setCargando(true);

      try {
        const data = await obtenerUsuarios();

        if (data?.ok === false) {
          throw new Error(
            data.mensaje || data.error || "No se pudieron cargar los usuarios"
          );
        }

        const lista = Array.isArray(data)
          ? data
          : [data?.usuarios, data?.data, data?.results]
              .find(Array.isArray);

        if (!lista) {
          throw new Error("La respuesta de usuarios no es válida");
        }

        if (activo) {
          setUsuarios(lista.map(usuarioPublico));
        }
      } catch (error) {
        if (activo) {
          alert(error.message || "Error cargando usuarios");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [esAdministrador]);

  useEffect(() => {
  if (esAdministrador) recargarLogs();
}, [esAdministrador, sedeLogs]);

  async function recargarLogs(pagina = 1) {
    setCargandoLogs(true);

    try {
      const parametros = new URLSearchParams({
        page: String(pagina),
        limit: "20",
        sede: sedeLogs
      });

      const res = await fetch(
        `${API_URL}/api/logs?${parametros}`,
        {
          credentials: "include"
        }
      );

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.mensaje || data?.error || "No se pudo cargar la bitácora"
        );
      }

      if (Array.isArray(data)) {
        setLogs(data);
        setPage(1);
        setTotalPages(1);
      } else {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      alert(error.message || "Error cargando la bitácora");
    } finally {
      setCargandoLogs(false);
    }
  }

  async function actualizarBitacora(accion) {
    try {
      const resultado = await registrarAccion(accion);

      if (resultado?.ok === false) {
        throw new Error("No se pudo registrar la acción");
      }
    } catch {
      alert(
        "El cambio se guardó, pero no se pudo registrar en la bitácora."
      );
    }

    await recargarLogs();
  }

  function limpiarFormulario() {
    setFormData(formularioVacio());
    setModo("crear");
    setUsuarioEditando(null);
    inputNombreRef.current?.focus();
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(actual => ({ ...actual, [name]: value }));
  };

  const handlePermiso = (e) => {
    const { name, checked } = e.target;
    setFormData(actual => ({ ...actual, [name]: checked }));
  };

  function formularioValido(creando) {
    if (
      !formData.nombre.trim() ||
      !formData.usuario.trim() ||
      !formData.rol ||
      (creando && !formData.clave.trim())
    ) {
      alert(
        creando
          ? "Complete todos los campos"
          : "Complete nombre, usuario y rol"
      );
      return false;
    }

    if (formData.clave !== "" && !formData.clave.trim()) {
      alert("La contraseña no puede contener solo espacios");
      return false;
    }

    return true;
  }

  const handleGuardar = async () => {
    if (procesando || !formularioValido(true)) return;

    setGuardando(true);

    try {
      const resultado = await crearUsuario({ ...formData });

      if (!resultado?.ok || !resultado.usuario?._id) {
        throw new Error(
          resultado?.mensaje ||
          resultado?.error ||
          "No se pudo crear el usuario"
        );
      }

      const creado = usuarioPublico(resultado.usuario);
      setUsuarios(actual => [...actual, creado]);
      limpiarFormulario();

      await actualizarBitacora(
        `Registró al usuario "${creado.usuario}"`
      );
    } catch (error) {
      alert(error.message || "Error creando usuario");
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (user) => {
    if (procesando) return;

    setModo("editar");
    setUsuarioEditando(usuarioPublico(user));
    setFormData({
      nombre: user.nombre || "",
      usuario: user.usuario || "",
      clave: "",
      rol: user.rol || "",
      accesoTiendita: user.accesoTiendita !== false,
      accesoMonasterio: user.accesoMonasterio === true
    });

    inputNombreRef.current?.focus();
  };

  const handleActualizar = async () => {
    if (
      procesando ||
      !usuarioEditando ||
      !formularioValido(false)
    ) {
      return;
    }

    const datos = { ...formData };

    if (datos.clave === "") {
      delete datos.clave;
    }

    setGuardando(true);

    try {
      const resultado = await actualizarUsuario(
        usuarioEditando._id,
        datos
      );

      if (!resultado?.ok || !resultado.usuario?._id) {
        throw new Error(
          resultado?.mensaje ||
          resultado?.error ||
          "No se pudo actualizar el usuario"
        );
      }

      const actualizado = usuarioPublico(resultado.usuario);

      // Usar la respuesta del servidor, nunca formData con la clave.
      setUsuarios(actual =>
        actual.map(user =>
          user._id === actualizado._id ? actualizado : user
        )
      );

      limpiarFormulario();

      await actualizarBitacora(
        `Actualizó al usuario "${actualizado.usuario}"`
      );
    } catch (error) {
      alert(error.message || "Error actualizando usuario");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, usuario) => {
    if (procesando) return;
    if (!window.confirm(`¿Eliminar al usuario "${usuario}"?`)) return;

    setGuardando(true);

    try {
      const resultado = await eliminarUsuario(id);

      if (!resultado?.ok) {
        throw new Error(
          resultado?.mensaje ||
          resultado?.error ||
          "No se pudo eliminar el usuario"
        );
      }

      setUsuarios(actual => actual.filter(user => user._id !== id));

      if (usuarioEditando?._id === id) {
        limpiarFormulario();
      }

      await actualizarBitacora(
        `Eliminó al usuario "${usuario}"`
      );
    } catch (error) {
      alert(error.message || "Error eliminando usuario");
    } finally {
      setGuardando(false);
    }
  };

  if (!esAdministrador) {
    return <h2 style={{ color: "red" }}>Acceso denegado</h2>;
  }
    return (
    <div>
      {procesando && (
        <div
          role="status"
          style={{
            background: "#84868A",
            color: "white",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            zIndex: 999999
          }}
        >
          Procesando, por favor espere...
        </div>
      )}

      <Encabezado sede={sede} />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Gestión de Usuarios
        </h2>

        <div
          style={{
            width: "350px",
            maxWidth: "100%",
            boxSizing: "border-box",
            margin: "0 auto 20px",
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
            aria-label="Nombre completo"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            disabled={procesando}
            style={estiloInput}
          />

          <input
            type="text"
            name="usuario"
            aria-label="Usuario"
            placeholder="Usuario"
            value={formData.usuario}
            onChange={handleChange}
            disabled={procesando}
            autoComplete="off"
            style={estiloInput}
          />

          <input
            type="password"
            name="clave"
            aria-label={
              modo === "crear"
                ? "Contraseña"
                : "Nueva contraseña opcional"
            }
            placeholder={
              modo === "crear"
                ? "Contraseña"
                : "Nueva contraseña (opcional)"
            }
            value={formData.clave}
            onChange={handleChange}
            disabled={procesando}
            autoComplete="new-password"
            style={estiloInput}
          />

          {modo === "editar" && (
            <p style={{ fontSize: "13px", marginTop: 0 }}>
              Deja la contraseña vacía para conservar la actual.
            </p>
          )}

          <select
            name="rol"
            aria-label="Rol"
            value={formData.rol}
            onChange={handleChange}
            disabled={procesando}
            style={{
              width: "100%",
              padding: "6px",
              marginBottom: "8px"
            }}
          >
            <option value="">Seleccione un rol</option>
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="USUARIO">USUARIO</option>
          </select>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              Acceso a:
            </div>

            <label style={{ marginRight: "20px" }}>
              <input
                type="checkbox"
                name="accesoTiendita"
                checked={formData.accesoTiendita}
                onChange={handlePermiso}
                disabled={procesando}
              />
              {" "}TIENDITA
            </label>

            <label>
              <input
                type="checkbox"
                name="accesoMonasterio"
                checked={formData.accesoMonasterio}
                onChange={handlePermiso}
                disabled={procesando}
              />
              {" "}MONASTERIO
            </label>
          </div>

          {modo === "crear" ? (
            <button
              onClick={handleGuardar}
              disabled={procesando}
              style={botonGuardar}
            >
              Guardar
            </button>
          ) : (
            <>
              <button
                onClick={handleActualizar}
                disabled={procesando}
                style={{
                  ...botonAccion,
                  backgroundColor: "#6699FF",
                  color: "white",
                  width: "48%",
                  marginRight: "4%"
                }}
              >
                Actualizar
              </button>

              <button
                onClick={limpiarFormulario}
                disabled={procesando}
                style={{
                  ...botonAccion,
                  backgroundColor: "#999",
                  color: "white",
                  width: "48%"
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() =>
              navigate(esMonasterio ? "/menu-monasterio" : "/menu")
            }
            style={{
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
            }}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        <h3>Usuarios registrados</h3>

        <div style={{ overflowX: "auto" }}>
          <table
            width="100%"
            border="1"
            cellPadding="8"
            style={{
              borderCollapse: "collapse",
              marginBottom: "20px"
            }}
          >
            <thead>
              <tr style={cabeceraTabla}>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Tiendita</th>
                <th>Monasterio</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map(user => (
                <tr key={user._id}>
                  <td>{user.nombre}</td>
                  <td>{user.usuario}</td>
                  <td>{user.rol}</td>
                  <td>{user.accesoTiendita ? "✅" : "❌"}</td>
                  <td>{user.accesoMonasterio ? "✅" : "❌"}</td>
                  <td>
                    <button
                      onClick={() => handleEditar(user)}
                      disabled={procesando}
                      style={{
                        ...botonAccion,
                        marginRight: "6px",
                        backgroundColor: "#FFD966"
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        handleEliminar(user._id, user.usuario)
                      }
                      disabled={procesando}
                      style={{
                        ...botonAccion,
                        backgroundColor: "red",
                        color: "white"
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    {cargando
                      ? "Cargando usuarios..."
                      : "No hay usuarios registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <h3>Bitácora de acciones</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap"
            }}
          >
            <label htmlFor="sede-bitacora">Mostrar acciones de:</label>

            <select
              id="sede-bitacora"
              value={sedeLogs}
              disabled={procesando}
              onChange={(e) => {
                setLogs([]);
                setPage(1);
                setTotalPages(1);
                setSedeLogs(e.target.value);
              }}
              style={{ padding: "7px" }}
            >
              <option value="TIENDITA">Tiendita</option>
              <option value="MONASTERIO">Monasterio</option>
              <option value="TODAS">Todas las sedes</option>
              <option value="SIN_SEDE">Sin sede registrada</option>
            </select>

            <button
              type="button"
              disabled={procesando}
              onClick={() => recargarLogs(page)}
              style={botonAccion}
            >
              Actualizar bitácora
            </button>
          </div>

        <div style={{ overflowX: "auto" }}>
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
                <th>Sede</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    {new Date(log.fecha).toLocaleString("es-VE", {
                      timeZone: "America/Caracas"
                    })}
                  </td>
                  <td>{log.usuario || "—"}</td>
                  <td>
                    {["TIENDITA", "MONASTERIO"].includes(log.sede)
                      ? log.sede
                      : "Sin sede registrada"}
                    </td>
                    <td>{log.accion || "—"}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    {cargandoLogs
                      ? "Cargando bitácora..."
                      : "No hay acciones registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            disabled={procesando || page <= 1}
            onClick={() => recargarLogs(page - 1)}
          >
            ◀ Anterior
          </button>

          <span style={{ margin: "0 15px" }}>
            Página {page} de {totalPages}
          </span>

          <button
            disabled={procesando || page >= totalPages}
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