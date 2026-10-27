import React, {
  useEffect,
  useRef,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  obtenerLotesCrianza,
  crearLoteCrianza,
  eliminarLoteCrianza
} from "../services/lotesCrianza";

const formularioVacio = () => ({
  nombre: "",
  fechaInicio: obtenerFechaVenezuela().slice(0, 10),
  cantidadInicial: "",
  proveedor: "",
  observaciones: ""
});

const campo = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "15px"
};

const boton = {
  padding: "9px 18px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  backgroundColor: "#B8862D",
  color: "white",
  fontFamily: "Arial",
  fontWeight: "bold",
  cursor: "pointer"
};

const celda = {
  border: "1px solid #ccc",
  padding: "9px",
  textAlign: "center"
};

function mostrarFecha(fecha) {
  const texto = String(fecha || "").slice(0, 10);
  const partes = texto.split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : "";
}

export default function LotesCrianza() {
  const navigate = useNavigate();
  const esAdministrador =
  localStorage.getItem("rolUsuario") === "ADMINISTRADOR";
  const guardandoRef = useRef(false);

  const [formulario, setFormulario] = useState(
    formularioVacio
  );
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerLotesCrianza()
      .then((lista) => {
        if (activo) setLotes(lista);
      })
      .catch((fallo) => {
        if (activo) setError(fallo.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  function cambiar(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function limpiar() {
    if (guardandoRef.current) return;

    setFormulario(formularioVacio());
    setMensaje("");
  }

  async function guardar(e) {
    e.preventDefault();

    if (guardandoRef.current) return;

    const cantidad = Number(
      formulario.cantidadInicial
    );

    if (
      !formulario.nombre.trim() ||
      !Number.isSafeInteger(cantidad) ||
      cantidad <= 0
    ) {
      setError(
        "Indique el nombre y una cantidad entera mayor que cero."
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await crearLoteCrianza({
        ...formulario,
        nombre: formulario.nombre.trim(),
        cantidadInicial: cantidad
      });

      // Se incorpora la respuesta del servidor.
      // No es necesario volver a enviar la compra.
      setLotes((anteriores) =>
        [
          respuesta.lote,
          ...anteriores.filter(
            (lote) =>
              lote._id !== respuesta.lote._id
          )
        ].sort((a, b) =>
          String(b.fechaInicio).localeCompare(
          String(a.fechaInicio)
          ) ||
            String(b._id).localeCompare(
            String(a._id)
          )
        )
      );

      setFormulario(formularioVacio());
      setMensaje("Lote registrado correctamente.");
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  async function eliminar(lote) {
  if (
    !esAdministrador ||
    guardandoRef.current
  ) {
    return;
  }

  const confirmar = window.confirm(
    `¿Desea eliminar el lote "${lote.nombre}"?\n\n` +
    "Sólo podrá eliminarse si no tiene registros asociados."
  );

  if (!confirmar) return;

  guardandoRef.current = true;
  setGuardando(true);
  setError("");
  setMensaje("");

  try {
    const respuesta = await eliminarLoteCrianza(
      lote._id
    );

    setLotes((anteriores) =>
      anteriores.filter(
        (item) => item._id !== lote._id
      )
    );

    setMensaje(respuesta.mensaje);
  } catch (fallo) {
    setError(fallo.message);
  } finally {
    guardandoRef.current = false;
    setGuardando(false);
  }
}

  return (
    <div>
      <Encabezado />

      <main
        style={{
          padding: "20px",
          color: "#5A2D16"
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          PRODUCCIÓN DEL MONASTERIO
        </h2>

        <h3 style={{ textAlign: "center" }}>
          Pollos · Registro de lotes
        </h3>

        <form
          onSubmit={guardar}
          style={{
            maxWidth: "650px",
            margin: "25px auto",
            border: "1px solid #5A2D16",
            borderRadius: "8px",
            overflow: "hidden"
          }}
        >
          <h3
            style={{
              backgroundColor: "#E8D1A5",
              textAlign: "center",
              padding: "12px",
              margin: 0
            }}
          >
            Nuevo lote de crianza
          </h3>

          <fieldset
            disabled={guardando}
            style={{
              border: "none",
              padding: "20px",
              margin: 0,
              minWidth: 0
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px"
              }}
            >
              <label>
                Nombre del lote
                <input
                  style={campo}
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiar}
                  placeholder="POLLOS — OCTUBRE 2026"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Fecha de inicio
                <input
                  style={campo}
                  type="date"
                  name="fechaInicio"
                  value={formulario.fechaInicio}
                  onChange={cambiar}
                  max={obtenerFechaVenezuela().slice(0, 10)}
                  required
                />
              </label>

              <label>
                Cantidad de pollitos
                <input
                  style={campo}
                  type="number"
                  name="cantidadInicial"
                  value={formulario.cantidadInicial}
                  onChange={cambiar}
                  min="1"
                  step="1"
                  required
                />
              </label>

              <label>
                Proveedor (opcional)
                <input
                  style={campo}
                  name="proveedor"
                  value={formulario.proveedor}
                  onChange={cambiar}
                  maxLength={200}
                />
              </label>
            </div>

            <label
              style={{
                display: "block",
                marginTop: "16px"
              }}
            >
              Observaciones
              <textarea
                style={{
                  ...campo,
                  minHeight: "85px",
                  resize: "vertical"
                }}
                name="observaciones"
                value={formulario.observaciones}
                onChange={cambiar}
                maxLength={2000}
              />
            </label>

            <p style={{ color: "#666" }}>
              Este registro identifica el lote.
              Los gastos se vincularán por separado.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <button type="submit" style={boton}>
                {guardando
                  ? "PROCESANDO..."
                  : "GUARDAR LOTE"}
              </button>

              <button
                type="button"
                onClick={limpiar}
                style={{
                  ...boton,
                  backgroundColor: "#888"
                }}
              >
                LIMPIAR
              </button>
            </div>
          </fieldset>
        </form>

        {error && (
          <p
            role="alert"
            style={{
              color: "#b00020",
              textAlign: "center"
            }}
          >
            {error}
          </p>
        )}

        {mensaje && (
          <p
            role="status"
            style={{
              color: "#286140",
              textAlign: "center"
            }}
          >
            {mensaje}
          </p>
        )}

        <section
          style={{
            maxWidth: "1100px",
            margin: "25px auto"
          }}
        >
          <h3>Lotes registrados</h3>

          {cargando ? (
            <p>Cargando lotes...</p>
          ) : lotes.length === 0 ? (
            <p>
              {error
                ? "No se pudo cargar la lista."
                : "Todavía no hay lotes registrados."}
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}
              >
                <thead
                  style={{
                    backgroundColor: "#E8D1A5"
                  }}
                >
                  <tr>
                    <th style={celda}>Lote</th>
                    <th style={celda}>Inicio</th>
                    <th style={celda}>
                      Pollitos iniciales
                    </th>
                    <th style={celda}>Proveedor</th>
                    <th style={celda}>
                      Observaciones
                    </th>
                    <th style={celda}>Seguimiento</th>
                    {esAdministrador && (
                      <th
                        style={{
                        ...celda,
                        width: "50px"
                        }}
                      >
                        Eliminar
                      </th>
                    )}                    
                  </tr>
                </thead>

                <tbody>
                  {lotes.map((lote) => (
                    <tr key={lote._id}>
                      <td style={celda}>
                        {lote.nombre}
                      </td>
                      <td style={celda}>
                        {mostrarFecha(lote.fechaInicio)}
                      </td>
                      <td style={celda}>
                        {lote.cantidadInicial}
                      </td>
                      <td style={celda}>
                        {lote.proveedor || "—"}
                      </td>
                      <td style={celda}>
                        {lote.observaciones || "—"}
                      </td>
                      <td style={celda}>
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() =>
                              navigate(
                              `/lotes-crianza/${lote._id}/baja`
                              )
                            }
                            style={boton}
                          >
                            REGISTRAR BAJA
                          </button>
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() =>
                              navigate(
                              `/lotes-crianza/${lote._id}/produccion`
                            )
                            }
                            style={{
                              ...boton,
                              marginLeft: "8px",
                              marginTop: "5px"
                            }}
                          >
                            REGISTRAR PRODUCCIÓN
                          </button>
                      </td>
                      {esAdministrador && (
                        <td
                          style={{
                          ...celda,
                          width: "50px"
                          }}
                        >
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() => eliminar(lote)}
                            title="Eliminar lote sin registros asociados"
                            aria-label={`Eliminar lote ${lote.nombre}`}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: "4px",
                              fontSize: "19px",
                              cursor: guardando
                                ? "not-allowed"
                                : "pointer",
                              opacity: guardando ? 0.5 : 1
                            }}
                          >
                            🗑️
                          </button>
                        </td>                        
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              navigate("/menu-monasterio")
            }
            style={{
              ...boton,
              backgroundColor: "#5A2D16"
            }}
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </main>
    </div>
  );
}