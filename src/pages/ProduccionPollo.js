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
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  evaluarControlProduccion
} from "../utils/controlProduccionPollo";
import {
  obtenerDetalleLoteCrianza,
  registrarProduccionCrianza,
  actualizarProduccionCrianza
} from "../services/lotesCrianza";

const tipos = [
  ["PECHUGA", "Pechuga", "cantidadPresentaciones", "Pechugas completas"],
  ["MUSLOS", "Muslos", "cantidadPresentaciones", "Paquetes de 2 muslos"],
  ["ALAS", "Alas", "", ""],
  ["PATAS", "Patas", "", ""],
  ["POLLO_ENTERO", "Pollo entero", "cantidadPresentaciones", "Pollos enteros"],
  ["MILANESA", "Milanesa", "pechugasUtilizadas", "Pechugas utilizadas"],
  ["CHURRASCO", "Churrasco", "muslosUtilizados", "Muslos individuales utilizados"]
];

const campo = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "15px"
};

const boton = {
  padding: "10px 16px",
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
  padding: "8px",
  textAlign: "left"
};

function prepararFormulario(datos = {}, historico = false) {
  return {
    fecha: String(
      datos.fecha || obtenerFechaVenezuela()
    ).slice(0, 10),
    pollosProcesados: datos.pollosProcesados ?? "",
    pesoControlKg: datos.pesoControlKg ?? "",
    mermasKg: datos.mermasKg ?? (historico ? "" : 0),
    observaciones: datos.observaciones || "",

    filas: tipos.map(([tipoProducto]) => {
      const anterior = (datos.detalles || []).find(
        (detalle) => detalle.tipoProducto === tipoProducto
      );

      return {
        tipoProducto,
        productoId: anterior?.productoId || "",
        pesoKg: anterior?.pesoKg ?? "",
        cantidadPresentaciones:
          anterior?.cantidadPresentaciones ?? "",
        pechugasUtilizadas:
          anterior?.pechugasUtilizadas ?? "",
        muslosUtilizados:
          anterior?.muslosUtilizados ?? ""
      };
    })
  };
}

export default function ProduccionPollo() {
  const { id, produccionId } = useParams();
  const editando = Boolean(produccionId);
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `produccionPollo:${
      localStorage.getItem("usuarioNombre") || ""
    }:${id}` +
    (editando ? `:editar:${produccionId}` : "");

  const [pendiente, setPendiente] = useState(() => {
    try {
      const datos = JSON.parse(
        sessionStorage.getItem(clavePendiente) || "null"
      );

      return (
        datos &&
        typeof datos.claveOperacion === "string" &&
        typeof datos.fecha === "string" &&
        Array.isArray(datos.detalles) &&
        Number.isSafeInteger(datos.pollosProcesados)
      )
        ? datos
        : null;
    } catch {
      return null;
    }
  });

  const [formulario, setFormulario] = useState(() =>
    prepararFormulario(pendiente || {})
  );

  const [detalle, setDetalle] = useState(null);
  const [jornadaBase, setJornadaBase] = useState(null);

  const [versionEsperada, setVersionEsperada] = useState(
    pendiente?.versionEsperada ?? null
  );

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const resultados = await Promise.allSettled([
          obtenerDetalleLoteCrianza(id),

          fetch(
            `${API_URL}/api/productos?sede=MONASTERIO`,
            { credentials: "include" }
          ).then(async (res) => {
            const datos = await res.json();

            if (!res.ok || !Array.isArray(datos)) {
              throw new Error(
                datos?.mensaje ||
                "No se pudieron cargar los productos."
              );
            }

            return datos
              .filter(
                (producto) =>
                  producto.sede === "MONASTERIO" &&
                  producto.origen === "PRODUCCION_MONASTERIO"
              )
              .sort((a, b) =>
                String(a.descripcion).localeCompare(
                  String(b.descripcion),
                  "es",
                  {
                    sensitivity: "base",
                    numeric: true
                  }
                )
              );
          })
        ]);

        if (!activo) return;

        const fallo = resultados.find(
          (resultado) => resultado.status === "rejected"
        );

        if (fallo) throw fallo.reason;

        const datos = resultados[0].value;

        const jornada = editando
          ? datos.producciones.find(
              (item) => item._id === produccionId
            )
          : null;

        if (editando && !jornada && !pendiente) {
          throw new Error("La jornada no existe.");
        }

        setDetalle(datos);
        setProductos(resultados[1].value);
        setJornadaBase(jornada);

        if (!pendiente) {
          setFormulario(
            prepararFormulario(jornada || {}, editando)
          );

          setVersionEsperada(
            jornada ? (jornada.__v ?? 0) : null
          );
        }
      } catch (fallo) {
        if (activo) setError(fallo.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };

    // La solicitud pendiente se conserva durante esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, produccionId]);

  function cambiar(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function cambiarFila(indice, nombre, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      filas: anterior.filas.map((fila, posicion) =>
        posicion === indice
          ? { ...fila, [nombre]: valor }
          : fila
      )
    }));
  }

  function borrarPendiente() {
    try {
      sessionStorage.removeItem(clavePendiente);
    } catch {
      // El resultado ya fue confirmado por el servidor.
    }

    setPendiente(null);
  }

  const utilizadas = formulario.filas.filter(
    (fila) =>
      fila.productoId ||
      [
        "pesoKg",
        "cantidadPresentaciones",
        "pechugasUtilizadas",
        "muslosUtilizados"
      ].some((nombre) => fila[nombre] !== "")
  );

  const control = evaluarControlProduccion({
    ...formulario,
    detalles: utilizadas
  });

  const disponibles = detalle
    ? detalle.resumen.enCrianza +
      (editando ? jornadaBase?.pollosProcesados || 0 : 0)
    : 0;

  const bloqueado =
    cargando || guardando || Boolean(pendiente);

  async function guardar(e) {
    e.preventDefault();

    if (
      ocupadoRef.current ||
      cargando ||
      !detalle
    ) {
      return;
    }

    let solicitud = pendiente;

    if (!solicitud) {
      try {
        if (!control.valido) {
          throw new Error(control.errores.join(" "));
        }

        if (
          Number(formulario.pollosProcesados) >
          disponibles
        ) {
          throw new Error(
            "La cantidad supera los pollos disponibles para esta jornada."
          );
        }

        const ids = new Set();

        const detalles = utilizadas.map((fila) => {
          if (
            !productos.some(
              (producto) => producto._id === fila.productoId
            )
          ) {
            throw new Error(
              `Seleccione un producto válido para ${fila.tipoProducto}.`
            );
          }

          if (ids.has(fila.productoId)) {
            throw new Error("No puede repetir un producto.");
          }

          ids.add(fila.productoId);

          const esPieza = [
            "PECHUGA",
            "MUSLOS",
            "POLLO_ENTERO"
          ].includes(fila.tipoProducto);

          return {
            productoId: fila.productoId,
            tipoProducto: fila.tipoProducto,
            pesoKg: Number(fila.pesoKg),

            cantidadPresentaciones: esPieza
              ? Number(fila.cantidadPresentaciones)
              : null,

            ...(fila.tipoProducto === "MILANESA"
              ? {
                  pechugasUtilizadas:
                    Number(fila.pechugasUtilizadas)
                }
              : {}),

            ...(fila.tipoProducto === "CHURRASCO"
              ? {
                  muslosUtilizados:
                    Number(fila.muslosUtilizados)
                }
              : {})
          };
        });

        if (
          editando &&
          !Number.isSafeInteger(versionEsperada)
        ) {
          throw new Error(
            "Vuelva a abrir la jornada para editarla."
          );
        }

        solicitud = {
          fecha: formulario.fecha,
          pollosProcesados:
            Number(formulario.pollosProcesados),
          pesoControlKg: control.peso.controlKg,
          mermasKg: control.peso.mermasKg,
          observaciones: formulario.observaciones.trim(),
          detalles,
          ...(editando ? { versionEsperada } : {}),
          claveOperacion: window.crypto.randomUUID()
        };

        sessionStorage.setItem(
          clavePendiente,
          JSON.stringify(solicitud)
        );

        setPendiente(solicitud);
      } catch (fallo) {
        setError(fallo.message);
        return;
      }
    }

    ocupadoRef.current = true;
    setGuardando(true);
    setError("");

    try {
      const respuesta = editando
        ? await actualizarProduccionCrianza(
            id,
            produccionId,
            solicitud
          )
        : await registrarProduccionCrianza(
            id,
            solicitud
          );

      borrarPendiente();
      window.alert(respuesta.mensaje);

      navigate(`/lotes-crianza/${id}`, {
        replace: true
      });
    } catch (fallo) {
      if ([400, 409, 423].includes(fallo.status)) {
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} Reintente conservando la misma solicitud.`
        );
      }
    } finally {
      ocupadoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <div>
      <Encabezado />

      <main
        style={{
          padding: "20px",
          color: "#5A2D16",
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          {editando
            ? "MODIFICAR PRODUCCIÓN DE POLLOS"
            : "REGISTRAR PRODUCCIÓN DE POLLOS"}
        </h2>

        {cargando && (
          <p>Cargando jornada y productos...</p>
        )}

        {detalle && (
          <>
            <h3 style={{ textAlign: "center" }}>
              Lote: {detalle.lote.nombre}
            </h3>

            {editando &&
              jornadaBase?.versionControl !== 1 && (
                <p>
                  Esta jornada se registró sin los nuevos
                  controles. Complete las cantidades y los
                  pesos reales antes de corregirla.
                </p>
              )}

            <form
              onSubmit={guardar}
              style={{
                border: "1px solid #5A2D16",
                borderRadius: "8px",
                padding: "18px"
              }}
            >
              <fieldset
                disabled={bloqueado}
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
                    gap: "15px"
                  }}
                >
                  <label>
                    Fecha
                    <input
                      style={campo}
                      type="date"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={cambiar}
                      min={String(
                        detalle.lote.fechaInicio
                      ).slice(0, 10)}
                      max={obtenerFechaVenezuela().slice(0, 10)}
                      required
                    />
                  </label>

                  <label>
                    Disponibles para esta jornada
                    <input
                      style={campo}
                      value={disponibles}
                      readOnly
                    />
                  </label>

                  <label>
                    Pollos procesados
                    <input
                      style={campo}
                      type="number"
                      name="pollosProcesados"
                      min="1"
                      step="1"
                      max={disponibles}
                      value={formulario.pollosProcesados}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    (kg) de control antes de despiezar 
                    <input
                      style={campo}
                      type="number"
                      name="pesoControlKg"
                      min="0.001"
                      step="0.001"
                      value={formulario.pesoControlKg}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    (kg) Huesos, recortes y otras mermas 
                    <input
                      style={campo}
                      type="number"
                      name="mermasKg"
                      min="0"
                      step="0.001"
                      value={formulario.mermasKg}
                      onChange={cambiar}
                      required
                    />
                  </label>
                </div>

                <p>
                  El peso de control incluye todo lo que se
                  distribuirá entre productos y mermas.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: "700px",
                      borderCollapse: "collapse"
                    }}
                  >
                    <thead
                      style={{ backgroundColor: "#E8D1A5" }}
                    >
                      <tr>
                        <th style={celda}>Producto</th>
                        <th style={celda}>
                          Cantidad de referencia
                        </th>
                        <th style={celda}>
                          Peso obtenido (kg)
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {formulario.filas.map((fila, indice) => {
                        const tipo = tipos[indice];

                        return (
                          <tr key={fila.tipoProducto}>
                            <td style={celda}>
                              <label>
                                {tipo[1]}
                                <select
                                  style={campo}
                                  value={fila.productoId}
                                  onChange={(e) =>
                                    cambiarFila(
                                      indice,
                                      "productoId",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">
                                    Sin producción / seleccione producto
                                  </option>

                                  {fila.productoId &&
                                    !productos.some(
                                      (p) =>
                                        p._id === fila.productoId
                                    ) && (
                                      <option value={fila.productoId}>
                                        Producto anterior: revise su configuración
                                      </option>
                                    )}

                                  {productos.map((producto) => (
                                    <option
                                      key={producto._id}
                                      value={producto._id}
                                      disabled={formulario.filas.some(
                                        (otra, i) =>
                                          i !== indice &&
                                          otra.productoId === producto._id
                                      )}
                                    >
                                      {producto.descripcion} — {producto.codigo}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </td>

                            <td style={celda}>
                              {tipo[2] ? (
                                <label>
                                  {tipo[3]}
                                  <input
                                    style={campo}
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={fila[tipo[2]]}
                                    onChange={(e) =>
                                      cambiarFila(
                                        indice,
                                        tipo[2],
                                        e.target.value
                                      )
                                    }
                                  />
                                </label>
                              ) : "—"}
                            </td>

                            <td style={celda}>
                              <input
                                style={campo}
                                type="number"
                                min="0.001"
                                step="0.001"
                                aria-label={`Peso de ${tipo[1]} en kilos`}
                                value={fila.pesoKg}
                                onChange={(e) =>
                                  cambiarFila(
                                    indice,
                                    "pesoKg",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {[
                  control.pechugas,
                  control.muslos,
                  control.peso
                ].map((item, indice) => (
                  <p
                    key={indice}
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      color: item.completo ? "#286140" : "#a22",
                      backgroundColor: item.completo
                        ? "#edf6ed"
                        : "#fff5ef"
                    }}
                  >
                    {item.mensaje}
                  </p>
                ))}

                <p>
                  Las pechugas destinadas a milanesa y los
                  muslos destinados a churrasco no se registran
                  también como productos sin deshuesar.
                </p>

                <label>
                  Observaciones
                  <textarea
                    style={{ ...campo, minHeight: "70px" }}
                    name="observaciones"
                    maxLength={2000}
                    value={formulario.observaciones}
                    onChange={cambiar}
                  />
                </label>
              </fieldset>

              {pendiente && !guardando && (
                <p>
                  Hay una solicitud pendiente.
                  El reintento conserva su identificador.
                </p>
              )}

              <div
                style={{
                  textAlign: "center",
                  marginTop: "15px"
                }}
              >
                <button
                  type="submit"
                  style={boton}
                  disabled={
                    guardando ||
                    cargando ||
                    (
                      !pendiente &&
                      (!control.valido || productos.length === 0)
                    )
                  }
                >
                  {guardando
                    ? "PROCESANDO..."
                    : pendiente
                      ? "REINTENTAR LA MISMA SOLICITUD"
                      : editando
                        ? "GUARDAR CORRECCIÓN"
                        : "GUARDAR PRODUCCIÓN"}
                </button>
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

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "20px"
          }}
        >
          <button
            type="button"
            disabled={guardando}
            style={{ ...boton, backgroundColor: "#888" }}
            onClick={() =>
              navigate(`/lotes-crianza/${id}`)
            }
          >
            VOLVER AL LOTE
          </button>

          <button
            type="button"
            disabled={guardando}
            style={{ ...boton, backgroundColor: "#5A2D16" }}
            onClick={() => navigate("/menu-monasterio")}
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </main>
    </div>
  );
}