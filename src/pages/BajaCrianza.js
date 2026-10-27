import React, {
  useEffect,
  useRef,
  useState
} from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  obtenerDetalleLoteCrianza,
  registrarBajaCrianza
} from "../services/lotesCrianza";

const campo = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px",
  marginTop: "6px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "16px"
};

const boton = {
  padding: "10px 18px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  backgroundColor: "#B8862D",
  color: "white",
  fontFamily: "Arial",
  fontWeight: "bold",
  cursor: "pointer"
};

export default function BajaCrianza() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const usuario =
    localStorage.getItem("usuarioNombre") || "";

  const clavePendiente =
    `bajaCrianza:${usuario}:${id}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const texto = sessionStorage.getItem(
        clavePendiente
      );

      if (!texto) return null;

      const datos = JSON.parse(texto);

      if (
        typeof datos.claveOperacion !== "string" ||
        typeof datos.fecha !== "string" ||
        !Number.isSafeInteger(datos.cantidad) ||
        datos.cantidad <= 0 ||
        typeof datos.motivo !== "string"
      ) {
        return null;
      }

      return datos;
    } catch {
      return null;
    }
  });

  const [formulario, setFormulario] = useState(() => ({
    fecha:
      pendiente?.fecha ||
      obtenerFechaVenezuela().slice(0, 10),
    cantidad: pendiente?.cantidad || "",
    motivo: pendiente?.motivo || ""
  }));

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    setCargando(true);

    obtenerDetalleLoteCrianza(id)
      .then((datos) => {
        if (activo) setDetalle(datos);
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
  }, [id]);

  function cambiar(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function borrarPendiente() {
    try {
      sessionStorage.removeItem(clavePendiente);
    } catch {
      // No cambia el resultado confirmado por el servidor.
    }

    setPendiente(null);
  }

  async function guardar(e) {
    e.preventDefault();

    if (
      ocupadoRef.current ||
      !detalle ||
      cargando
    ) {
      return;
    }

    let solicitud = pendiente;

    if (!solicitud) {
      const cantidad = Number(formulario.cantidad);
      const motivo = formulario.motivo.trim();

      if (
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        !motivo
      ) {
        setError(
          "Indique una cantidad entera mayor que cero y el motivo."
        );
        return;
      }

      if (cantidad > detalle.resumen.enCrianza) {
        setError(
          "La cantidad supera los animales disponibles."
        );
        return;
      }

      solicitud = {
        fecha: formulario.fecha,
        cantidad,
        motivo,
        claveOperacion: window.crypto.randomUUID()
      };

      try {
        // Conserva la misma solicitud si se refresca
        // esta pestaña o falla la conexión.
        sessionStorage.setItem(
          clavePendiente,
          JSON.stringify(solicitud)
        );
      } catch {
        setError(
          "No se pudo conservar la solicitud en este navegador. No se envió la baja."
        );
        return;
      }

      setPendiente(solicitud);
    }

    ocupadoRef.current = true;
    setGuardando(true);
    setError("");

    try {
      const respuesta = await registrarBajaCrianza(
        id,
        solicitud
      );

      borrarPendiente();

      window.alert(respuesta.mensaje);

      navigate("/lotes-crianza", {
        replace: true
      });
    } catch (fallo) {
      if (
        fallo.status === 400 ||
        fallo.status === 409
      ) {
        // El servidor rechazó la operación.
        // Se permite corregir los datos.
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} ` +
          "Use REINTENTAR LA MISMA BAJA para comprobar o completar esta solicitud."
        );
      }
    } finally {
      ocupadoRef.current = false;
      setGuardando(false);
    }
  }

  const cantidad = Number(formulario.cantidad);

  const restante =
    detalle &&
    Number.isSafeInteger(cantidad) &&
    cantidad > 0
      ? detalle.resumen.enCrianza - cantidad
      : null;

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
          REGISTRAR BAJA DE POLLOS
        </h2>

        {cargando && (
          <p style={{ textAlign: "center" }}>
            Cargando lote...
          </p>
        )}

        {detalle && (
          <>
            <h3 style={{ textAlign: "center" }}>
              Lote: {detalle.lote.nombre}
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
                  margin: 0,
                  padding: "14px",
                  backgroundColor: "#E8D1A5"
                }}
              >
                Baja de animales
              </h3>

              <div style={{ padding: "20px" }}>
                <p>
                  <strong>
                    Disponibles en crianza:{" "}
                    {detalle.resumen.enCrianza} pollos
                  </strong>
                </p>

                <fieldset
                  disabled={
                    guardando || Boolean(pendiente)
                  }
                  style={{
                    border: "none",
                    padding: 0,
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
                      Fecha de la baja
                      <input
                        style={campo}
                        type="date"
                        name="fecha"
                        value={formulario.fecha}
                        onChange={cambiar}
                        min={String(
                          detalle.lote.fechaInicio
                        ).slice(0, 10)}
                        max={obtenerFechaVenezuela().slice(
                          0,
                          10
                        )}
                        required
                      />
                    </label>

                    <label>
                      Cantidad de animales
                      <input
                        style={campo}
                        type="number"
                        name="cantidad"
                        value={formulario.cantidad}
                        onChange={cambiar}
                        min="1"
                        max={detalle.resumen.enCrianza}
                        step="1"
                        required
                      />
                    </label>
                  </div>

                  <label
                    style={{
                      display: "block",
                      marginTop: "16px"
                    }}
                  >
                    Motivo de la baja
                    <textarea
                      style={{
                        ...campo,
                        minHeight: "100px"
                      }}
                      name="motivo"
                      value={formulario.motivo}
                      onChange={cambiar}
                      maxLength={500}
                      required
                    />
                  </label>
                </fieldset>

                {!pendiente && restante !== null && (
                  <p
                    style={{
                      backgroundColor: "#f2eee8",
                      padding: "12px"
                    }}
                  >
                    En crianza después de registrar:{" "}
                    <strong>{restante} pollos</strong>
                  </p>
                )}

                <p>
                  Los pollos sacrificados para obtener
                  productos se registran en{" "}
                  <strong>PRODUCCIÓN</strong>.
                </p>

                {pendiente && !guardando && (
                  <p>
                    Hay una solicitud pendiente de
                    confirmar. El reintento utiliza
                    el mismo identificador para evitar
                    duplicarla.
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <button
                    type="submit"
                    style={boton}
                    disabled={guardando}
                  >
                    {guardando
                      ? "PROCESANDO..."
                      : pendiente
                        ? "REINTENTAR LA MISMA BAJA"
                        : "GUARDAR BAJA"}
                  </button>

                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      navigate("/lotes-crianza")
                    }
                    style={{
                      ...boton,
                      backgroundColor: "#888"
                    }}
                  >
                    {pendiente
                      ? "VOLVER A LOTES"
                      : "CANCELAR"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

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