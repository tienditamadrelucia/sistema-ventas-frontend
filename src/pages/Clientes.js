import Encabezado from "../components/Encabezado";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from "../services/clientes";
import { registrarAccion } from "../utils/registrarAccion";

const Clientes = () => {
  const navigate = useNavigate();

  // ============================
  // SEDE
  // ============================
  // Los clientes son compartidos.
  // La sede solamente se usa para apariencia y navegación.
  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  const usuarioActual =
    localStorage.getItem("usuario") || "ADMIN";

  // ============================
  // ESTADOS
  // ============================
  const [clientes, setClientes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modo, setModo] = useState("crear");
  const [clienteEditando, setClienteEditando] = useState(null);
  const formularioRef = useRef(null);

  const [procesando, setProcesando] = useState(false);

  const [formData, setFormData] = useState({
    identificacion: "",
    nombreCompleto: "",
    direccion: "",
    telefono: "",
    fechaIngreso: new Date().toISOString().substring(0, 10)
  });

  // ============================
  // ESTILOS
  // ============================
  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: esMonasterio
      ? "#5A2D16"
      : "#F9CEAE",
    color: esMonasterio ? "white" : "#333",
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
    backgroundColor: esMonasterio
      ? "#B8862D"
      : "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    marginTop: "8px",
    opacity: procesando ? 0.6 : 1,
    cursor: procesando
      ? "not-allowed"
      : "pointer"
  };

  // ============================
  // CARGAR CLIENTES
  // ============================
  async function cargarClientes(pagina = 1) {
    try {
      const data = await obtenerClientes(pagina);

      setClientes(
        Array.isArray(data.clientes)
          ? data.clientes
          : []
      );

      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);

    } catch (error) {
      console.error(
        "Error cargando clientes:",
        error
      );

      setClientes([]);
    }
  }

  useEffect(() => {
    cargarClientes(1);
  }, []);

  // ============================
  // CAMBIOS DEL FORMULARIO
  // ============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // TELÉFONO
    if (name === "telefono") {
      const soloNumeros =
        value.replace(/\D/g, "");

      setFormData({
        ...formData,
        telefono: soloNumeros
      });

      return;
    }

    // RESTO DE CAMPOS
    setFormData({
      ...formData,
      [name]:
        typeof value === "string"
          ? value.toUpperCase()
          : value
    });
  };

  // ============================
  // VALIDAR TELÉFONO
  // ============================
  const validarTelefono = (valor) => {
    const regex =
      /^(0276|0412|0416|0426|0414|0424)\d{7}$/;

    return regex.test(valor);
  };

  // ============================
  // GUARDAR / ACTUALIZAR
  // ============================
  const guardarCliente = async () => {
    if (procesando) return;

    // Validar identificación
    if (!formData.identificacion) {
      alert("Debe ingresar la identificación.");
      return;
    }

    const regexIdentificacion =
      /^[VEJG][0-9]+$/;

    if (
      !regexIdentificacion.test(
        formData.identificacion
      )
    ) {
      alert(
        "❌ Formato de identificación inválido. " +
        "Debe comenzar con V, E, J o G y luego números."
      );
      return;
    }

    // Verificar duplicado en la página actual
    if (
      clientes.some(
        (c) =>
          c.identificacion ===
            formData.identificacion &&
          c._id !== clienteEditando?._id
      )
    ) {
      alert("❌ La identificación ya existe");
      return;
    }

    if (!formData.nombreCompleto.trim()) {
      alert("Debe ingresar el nombre del cliente.");
      return;
    }

    if (!validarTelefono(formData.telefono)) {
      alert(
        "Teléfono inválido. Ejemplo: 04121234567"
      );
      return;
    }

    setProcesando(true);

    try {
      // Siempre usar la fecha del día
      const fechaFinal = new Date();

      if (modo === "crear") {
        await crearCliente({
          ...formData,
          fechaIngreso: fechaFinal
        });

        await registrarAccion(
          `Registró al cliente "${formData.nombreCompleto}"`
        );

      } else {
        await actualizarCliente(
          clienteEditando._id,
          {
            ...formData,
            fechaIngreso: fechaFinal
          }
        );

        await registrarAccion(
          `Actualizó al cliente "${formData.nombreCompleto}"`
        );
      }

      // Recargar respetando paginación
      await cargarClientes(page);

      limpiarFormulario();

    } catch (error) {
      console.error(
        "Error en guardarCliente:",
        error
      );

      alert(
        "Ocurrió un error guardando el cliente."
      );

    } finally {
      setProcesando(false);
    }
  };

  // ============================
  // EDITAR
  // ============================
  const editarCliente = (cliente) => {
    setModo("editar");
    setClienteEditando(cliente);

    setFormData({
      identificacion:
        cliente.identificacion || "",
      nombreCompleto:
        cliente.nombreCompleto || "",
      direccion:
        cliente.direccion || "",
      telefono:
        cliente.telefono || "",
      fechaIngreso:
        cliente.fechaIngreso || ""
    });

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth"
      });
    }, 50);
  };

  // ============================
  // LIMPIAR FORMULARIO
  // ============================
  const limpiarFormulario = () => {
    setModo("crear");
    setClienteEditando(null);

    setFormData({
      identificacion: "",
      nombreCompleto: "",
      direccion: "",
      telefono: "",
      fechaIngreso:
        new Date()
          .toISOString()
          .substring(0, 10)
    });
  };

  // ============================
  // ELIMINAR
  // ============================
  const eliminar = async (id) => {
    if (!window.confirm(
      "¿Eliminar este cliente?"
    )) {
      return;
    }

    try {
      const res =
        await eliminarCliente(
          id,
          usuarioActual
        );

      if (res.ok !== true) {
        alert(
          res.error ||
          "No se pudo eliminar el cliente"
        );

        return;
      }

      await registrarAccion(
        "Eliminó un cliente"
      );

      // Recargar respetando paginación
      await cargarClientes(page);

    } catch (error) {
      console.error(
        "Error eliminando cliente:",
        error
      );

      alert(
        "Ocurrió un error eliminando el cliente."
      );
    }
  };

  // ============================
  // VOLVER
  // ============================
  const volverMenu = () => {
    navigate(
      esMonasterio
        ? "/menu-monasterio"
        : "/menu"
    );
  };

  // ============================
  // PANTALLA
  // ============================
  return (
    <div>

      {/* MENSAJE PROCESANDO */}
      {procesando && (
        <div
          style={{
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
          }}
        >
          Procesando, por favor espere...
        </div>
      )}

      <Encabezado sede={sede} />

      <div style={{ padding: "20px" }}>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "bold"
          }}
        >
          Gestión de Clientes
        </h2>

        {/* ============================
            FORMULARIO
        ============================ */}
        <div
          ref={formularioRef}
          style={{
            width: "550px",
            margin: "0 auto 20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white"
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginBottom: "15px",
              fontWeight: "bold"
            }}
          >
            {modo === "crear"
              ? "Registrar Cliente"
              : "Editar Cliente"}
          </h3>

          {/* IDENTIFICACIÓN */}
          <input
            type="text"
            name="identificacion"
            placeholder="Identificación (V12345678 / J123456789)"
            value={formData.identificacion}
            style={{
              width: "45%",
              marginBottom: "10px",
              padding: "5px"
            }}
            onChange={(e) => {
              let valor =
                e.target.value.toUpperCase();

              // Solo V, E, J o G + números
              valor = valor.replace(
                /[^VEJG0-9]/g,
                ""
              );

              setFormData((prev) => ({
                ...prev,
                identificacion: valor
              }));
            }}
            onBlur={() => {
              const valor =
                formData.identificacion;

              // No validar si está vacío
              if (!valor) return;

              const regex =
                /^[VEJG][0-9]+$/;

              if (!regex.test(valor)) {
                alert(
                  "❌ Formato inválido. " +
                  "Debe comenzar con V, E, J o G y luego números."
                );

                setFormData((prev) => ({
                  ...prev,
                  identificacion: ""
                }));

                return;
              }

              // Comprobación inmediata
              const existe =
                clientes.some(
                  (c) =>
                    c.identificacion ===
                      valor &&
                    c._id !==
                      clienteEditando?._id
                );

              if (existe) {
                alert(
                  "❌ La identificación ya existe"
                );

                setFormData((prev) => ({
                  ...prev,
                  identificacion: ""
                }));
              }
            }}
          />

          {/* NOMBRE */}
          <input
            name="nombreCompleto"
            placeholder="Nombre Completo"
            value={formData.nombreCompleto}
            onChange={handleChange}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "5px"
            }}
          />

          {/* DIRECCIÓN */}
          <input
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "5px"
            }}
          />

          {/* TELÉFONO */}
          <input
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "5px"
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center"
            }}
          >
            <button
              style={botonGuardar}
              disabled={procesando}
              onClick={guardarCliente}
            >
              {modo === "crear"
                ? "Guardar Cliente"
                : "Actualizar Cliente"}
            </button>
          </div>
        </div>

        {/* ============================
            BOTÓN VOLVER
        ============================ */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px"
          }}
        >
          <button
            onClick={volverMenu}
            style={estiloBoton}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* ============================
            TABLA
        ============================ */}
        <h3
          style={{
            textAlign: "center",
            marginBottom: "1px",
            fontWeight: "bold"
          }}
        >
          Listado de Clientes
        </h3>

        <table
          border="1"
          cellPadding="1"
          style={{
            width: "100%",
            textAlign: "center",
            borderCollapse: "collapse"
          }}
        >
          <thead
            style={{
              backgroundColor: esMonasterio
                ? "#E8D1A5"
                : "#F9CEAE"
            }}
          >
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
            {Array.isArray(clientes) &&
              clientes.map((c) => (
                <tr key={c._id}>
                  <td>{c.identificacion}</td>

                  <td>{c.nombreCompleto}</td>

                  <td>{c.direccion}</td>

                  <td>{c.telefono}</td>

                  <td>
                    {c.fechaIngreso
                      ? new Date(
                          c.fechaIngreso
                        ).toLocaleDateString(
                          "es-VE"
                        )
                      : ""}
                  </td>

                  <td>
                    <span
                      onClick={() =>
                        editarCliente(c)
                      }
                      style={{
                        cursor: "pointer",
                        marginRight: "10px"
                      }}
                    >
                      ✏️
                    </span>

                    <span
                      onClick={() =>
                        eliminar(c._id)
                      }
                      style={{
                        cursor: "pointer",
                        color: "#B84A4A"
                      }}
                    >
                      🗑️
                    </span>
                  </td>
                </tr>
              ))}

            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "15px",
                    fontWeight: "bold"
                  }}
                >
                  No hay clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ============================
            PAGINACIÓN
        ============================ */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center"
          }}
        >
          <button
            disabled={page === 1}
            onClick={() =>
              cargarClientes(1)
            }
          >
            Inicio ⏮️
          </button>

          <button
            disabled={page === 1}
            onClick={() =>
              cargarClientes(page - 1)
            }
          >
            ◀ Anterior
          </button>

          <span
            style={{
              margin: "0 15px"
            }}
          >
            Página {page} de {totalPages}
          </span>

          <button
            disabled={
              page >= totalPages
            }
            onClick={() =>
              cargarClientes(page + 1)
            }
          >
            Siguiente ▶
          </button>

          <button
            disabled={
              page >= totalPages
            }
            onClick={() =>
              cargarClientes(totalPages)
            }
          >
            Ir al final ⏭️
          </button>
        </div>

      </div>
    </div>
  );
};

export default Clientes;