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
  obtenerDetalleLoteCrianza,
  registrarProduccionCrianza
} from "../services/lotesCrianza";

const tipos = [
  ["PECHUGA", "Pechuga", "piezas"],
  ["MUSLOS", "Muslos", "paquetes de 2"],
  ["ALAS", "Alas", ""],
  ["PATAS", "Patas", ""],
  ["POLLO_ENTERO", "Pollo entero", "piezas"],
  ["MILANESA", "Milanesa", ""],
  ["CHURRASCO", "Churrasco", ""]
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

function filasIniciales(detalles = []) {
  return tipos.map(([tipoProducto]) => {
    const anterior = detalles.find(
      (detalle) => detalle.tipoProducto === tipoProducto
    );

    return {
      tipoProducto,
      productoId: anterior?.productoId || "",
      pesoKg: anterior?.pesoKg ?? "",
      cantidadPresentaciones:
        anterior?.cantidadPresentaciones ?? ""
    };
  });
}

function mostrarPeso(peso) {
  return Number(peso).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

export default function ProduccionPollo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `produccionPollo:${
      localStorage.getItem("usuarioNombre") || ""
    }:${id}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const datos = JSON.parse(
        sessionStorage.getItem(clavePendiente) || "null"
      );

      return (
        datos &&
        typeof datos.claveOperacion === "string" &&
        typeof datos.fecha === "string" &&
        Number.isSafeInteger(datos.pollosProcesados) &&
        Array.isArray(datos.detalles)
      )
        ? datos
        : null;
    } catch {
      return null;
    }
  });

  const [fecha, setFecha] = useState(
    pendiente?.fecha ||
    obtenerFechaVenezuela().slice(0, 10)
  );
  const [pollos, setPollos] = useState(
    pendiente?.pollosProcesados || ""
  );
  const [observaciones, setObservaciones] = useState(
    pendiente?.observaciones || ""
  );
  const [filas, setFilas] = useState(() =>
    filasIniciales(pendiente?.detalles)
  );

  const [detalle, setDetalle] = useState(null);
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

        if (resultados[0].status === "fulfilled") {
          setDetalle(resultados[0].value);
        }

        if (resultados[1].status === "fulfilled") {
          setProductos(resultados[1].value);
        }

        const fallo = resultados.find(
          (resultado) => resultado.status === "rejected"
        );

        if (fallo) throw fallo.reason;
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
  }, [id]);

  function cambiarFila(indice, nombre, valor) {
    setFilas((anteriores) =>
      anteriores.map((fila, posicion) =>
        posicion === indice
          ? { ...fila, [nombre]: valor }
          : fila
      )
    );
  }

  function borrarPendiente() {
    try {
      sessionStorage.removeItem(clavePendiente);
    } catch {
      // El resultado confirmado por el servidor se conserva.
    }

    setPendiente(null);
  }

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
        const cantidadPollos = Number(pollos);

        if (
          !Number.isSafeInteger(cantidadPollos) ||
          cantidadPollos <= 0 ||
          cantidadPollos > detalle.resumen.enCrianza
        ) {
          throw new Error(
            "Revise la cantidad de pollos procesados."
          );
        }

        const utilizadas = filas.filter(
          (fila) =>
            fila.productoId ||
            fila.pesoKg !== "" ||
            fila.cantidadPresentaciones !== ""
        );

        if (utilizadas.length === 0) {
          throw new Error(
            "Registre al menos un producto obtenido."
          );
        }

        const ids = new Set();

        const detalles = utilizadas.map((fila) => {
          const tipo = tipos.find(
            (item) => item[0] === fila.tipoProducto
          );

          const pesoKg = Number(fila.pesoKg);
          const gramos = Math.round(pesoKg * 1000);

          if (
            !fila.productoId ||
            !productos.some(
              (producto) => producto._id === fila.productoId
            )
          ) {
            throw new Error(
              `Seleccione el producto para ${tipo[1]}.`
            );
          }

          if (ids.has(fila.productoId)) {
            throw new Error(
              "No puede seleccionar el mismo producto en dos filas."
            );
          }

          ids.add(fila.productoId);

          if (
            !Number.isFinite(pesoKg) ||
            pesoKg <= 0 ||
            !Number.isSafeInteger(gramos) ||
            Math.abs(
              pesoKg * 1000 - gramos
            ) >= 0.000001
          ) {
            throw new Error(
              `Revise el peso de ${tipo[1]}. Use hasta tres decimales.`
            );
          }

          const cantidadPresentaciones = tipo[2]
            ? Number(fila.cantidadPresentaciones)
            : null;

          if (
            tipo[2] &&
            (
              !Number.isSafeInteger(cantidadPresentaciones) ||
              cantidadPresentaciones <= 0
            )
          ) {
            throw new Error(
              `Indique la cantidad de ${tipo[2]} de ${tipo[1]}.`
            );
          }

          return {
            tipoProducto: fila.tipoProducto,
            productoId: fila.productoId,
            pesoKg: gramos / 1000,
            cantidadPresentaciones
          };
        });

        solicitud = {
          fecha,
          pollosProcesados: cantidadPollos,
          observaciones: observaciones.trim(),
          detalles,
          claveOperacion: window.crypto.randomUUID()
        };

        sessionStorage.setItem(
          clavePendiente,
          JSON.stringify(solicitud)
        );

        setPendiente(solicitud);
      } catch (fallo) {
        setError(
          fallo.message ||
          "No se pudo preparar la solicitud. No se envió la producción."
        );
        return;
      }
    }

    ocupadoRef.current = true;
    setGuardando(true);
    setError("");

    try {
      const respuesta = await registrarProduccionCrianza(
        id,
        solicitud
      );

      borrarPendiente();
      window.alert(respuesta.mensaje);

      navigate("/lotes-crianza", {
        replace: true
      });
    } catch (fallo) {
      if ([400, 409, 423].includes(fallo.status)) {
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} ` +
          "Reintente la misma solicitud para evitar duplicarla."
        );
      }
    } finally {
      ocupadoRef.current = false;
      setGuardando(false);
    }
  }

  const totalGramos = filas.reduce((suma, fila) => {
    const peso = Number(fila.pesoKg);

    return suma + (
      Number.isFinite(peso) && peso > 0
        ? Math.round(peso * 1000)
        : 0
    );
  }, 0);

  const restantes = detalle
    ? detalle.resumen.enCrianza - Number(pollos || 0)
    : null;

  return (
    <div>
      <Encabezado />

      <main style={{ padding: "20px", color: "#5A2D16" }}>
        <h2 style={{ textAlign: "center" }}>
          REGISTRAR PRODUCCIÓN DE POLLOS
        </h2>

        {cargando && <p>Cargando lote y productos...</p>}

        {detalle && (
          <form
            onSubmit={guardar}
            style={{
              maxWidth: "1100px",
              margin: "20px auto",
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
              Lote: {detalle.lote.nombre}
            </h3>

            <div style={{ padding: "16px" }}>
              <fieldset
                disabled={
                  cargando ||
                  guardando ||
                  Boolean(pendiente)
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
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px"
                  }}
                >
                  <label>
                    Fecha
                    <input
                      style={campo}
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      min={String(
                        detalle.lote.fechaInicio
                      ).slice(0, 10)}
                      max={obtenerFechaVenezuela().slice(0, 10)}
                      required
                    />
                  </label>

                  <label>
                    Disponibles en crianza
                    <input
                      style={campo}
                      value={detalle.resumen.enCrianza}
                      readOnly
                    />
                  </label>

                  <label>
                    Pollos procesados
                    <input
                      style={campo}
                      type="number"
                      min="1"
                      step="1"
                      max={detalle.resumen.enCrianza}
                      value={pollos}
                      onChange={(e) => setPollos(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <h3>Productos obtenidos</h3>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: "650px",
                      borderCollapse: "collapse"
                    }}
                  >
                    <thead style={{ backgroundColor: "#E8D1A5" }}>
                      <tr>
                        <th style={celda}>Tipo / producto</th>
                        <th style={celda}>Piezas / paquetes</th>
                        <th style={celda}>Peso total (kg)</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filas.map((fila, indice) => {
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

                                  {productos.map((producto) => (
                                    <option
                                      key={producto._id}
                                      value={producto._id}
                                      disabled={filas.some(
                                        (otra, posicion) =>
                                          posicion !== indice &&
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
                                  {tipo[2]}
                                  <input
                                    style={campo}
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={fila.cantidadPresentaciones}
                                    onChange={(e) =>
                                      cambiarFila(
                                        indice,
                                        "cantidadPresentaciones",
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
                                aria-label={`Peso de ${tipo[1]} en kilos`}
                                type="number"
                                min="0.001"
                                step="0.001"
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

                <p>
                  <strong>
                    Peso total obtenido:{" "}
                    {mostrarPeso(totalGramos / 1000)} kg
                  </strong>
                </p>

                {!pendiente && (
                  <p>
                    Pollos que continúan en crianza:{" "}
                    <strong>{restantes}</strong>
                  </p>
                )}

                <p>
                  Registre cada producto una sola vez:
                  la pechuga destinada a milanesa no se
                  incluye también como pechuga.
                </p>

                <label>
                  Observaciones
                  <textarea
                    style={{ ...campo, minHeight: "70px" }}
                    maxLength={2000}
                    value={observaciones}
                    onChange={(e) =>
                      setObservaciones(e.target.value)
                    }
                  />
                </label>
              </fieldset>

              <p>
                Esta producción queda disponible en Monasterio.
                El consumo y los envíos se registran después.
              </p>

              {pendiente && !guardando && (
                <p>
                  Hay una solicitud pendiente de confirmar.
                  El reintento conserva su identificador.
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >
                <button
                  type="submit"
                  style={boton}
                  disabled={
                    guardando ||
                    cargando ||
                    (!pendiente && productos.length === 0)
                  }
                >
                  {guardando
                    ? "PROCESANDO..."
                    : pendiente
                      ? "REINTENTAR LA MISMA PRODUCCIÓN"
                      : "GUARDAR PRODUCCIÓN"}
                </button>

                <button
                  type="button"
                  disabled={guardando}
                  style={{ ...boton, backgroundColor: "#888" }}
                  onClick={() => navigate("/lotes-crianza")}
                >
                  {pendiente ? "VOLVER A LOTES" : "CANCELAR"}
                </button>
              </div>
            </div>
          </form>
        )}

        {error && (
          <p
            role="alert"
            style={{ color: "#b00020", textAlign: "center" }}
          >
            {error}
          </p>
        )}

        <div style={{ textAlign: "center" }}>
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