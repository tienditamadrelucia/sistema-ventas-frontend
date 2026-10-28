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
  obtenerConsumoLoteCrianza
} from "../services/lotesCrianza";
import {
  crearEnvioLote
} from "../services/enviosLote";

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
  backgroundColor: "#B8862D",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontFamily: "Arial",
  fontWeight: "bold",
  cursor: "pointer"
};

const celda = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left"
};

function kilos(valor) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function unidades(presentacion) {
  return presentacion === "PAQUETE_DOS"
    ? "paquetes de 2"
    : "piezas";
}

function filaVacia(uid) {
  return {
    uid,
    productoId: "",
    pesoKg: "",
    cantidadPresentaciones: ""
  };
}

export default function EnviarLote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `envioLote:${
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
        Array.isArray(datos.detalles) &&
        datos.detalles.length > 0 &&
        datos.detalles.length <= 7
      )
        ? datos
        : null;
    } catch {
      return null;
    }
  });

  const contadorRef = useRef(
    pendiente?.detalles.length || 1
  );

  const [fecha, setFecha] = useState(
    pendiente?.fecha ||
    obtenerFechaVenezuela().slice(0, 10)
  );

  const [observaciones, setObservaciones] = useState(
    pendiente?.observaciones || ""
  );

  const [filas, setFilas] = useState(() =>
    pendiente
      ? pendiente.detalles.map((detalle, indice) => ({
          ...detalle,
          uid: indice + 1,
          cantidadPresentaciones:
            detalle.cantidadPresentaciones ?? ""
        }))
      : [filaVacia(1)]
  );

  const [datos, setDatos] = useState(null);
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    setDatos(null);
    setError("");

    if (!fecha) {
      setError("Seleccione la fecha del envío.");
      setCargando(false);

      return () => {
        activo = false;
      };
    }

    setCargando(true);

    obtenerConsumoLoteCrianza(
      id,
      "MONASTERIO",
      fecha
    )
      .then((respuesta) => {
        if (
          !respuesta.lote ||
          !Array.isArray(respuesta.productos)
        ) {
          throw new Error(
            "La consulta de existencias no tiene el formato esperado."
          );
        }

        if (activo) setDatos(respuesta);
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
  }, [id, fecha, revision]);

  const productos =
    datos?.productos || pendiente?.referencias || [];

  const bloqueado =
    cargando || guardando || Boolean(pendiente);

  const saldoDe = (productoId) =>
    productos.find(
      (item) => item.productoId === productoId
    );

  function limpiarFilas() {
    contadorRef.current += 1;
    setFilas([filaVacia(contadorRef.current)]);
  }

  function cambiarFecha(e) {
    setFecha(e.target.value);
    limpiarFilas();
  }

  function cambiarFila(uid, nombre, valor) {
    setFilas((anteriores) =>
      anteriores.map((fila) =>
        fila.uid === uid
          ? nombre === "productoId"
            ? {
                ...fila,
                productoId: valor,
                pesoKg: "",
                cantidadPresentaciones: ""
              }
            : { ...fila, [nombre]: valor }
          : fila
      )
    );
  }

  function agregar() {
    contadorRef.current += 1;

    setFilas((anteriores) => [
      ...anteriores,
      filaVacia(contadorRef.current)
    ]);
  }

  function quitar(uid) {
    if (filas.length === 1) {
      limpiarFilas();
    } else {
      setFilas((anteriores) =>
        anteriores.filter((fila) => fila.uid !== uid)
      );
    }
  }

  function borrarPendiente() {
    try {
      sessionStorage.removeItem(clavePendiente);
    } catch {
      // El envío ya fue confirmado.
    }

    setPendiente(null);
  }

  async function guardar(e) {
    e.preventDefault();

    if (
      ocupadoRef.current ||
      cargando ||
      (!datos && !pendiente)
    ) {
      return;
    }

    let solicitud = pendiente;

    if (!solicitud) {
      try {
        if (!fecha) {
          throw new Error(
            "Seleccione la fecha del envío."
          );
        }

        const ids = new Set();

        const detalles = filas.map((fila) => {
          const saldo = saldoDe(fila.productoId);

          if (!saldo || !saldo.habilitado) {
            throw new Error(
              saldo?.bloqueos?.join(" ") ||
              "Seleccione un producto disponible en cada fila."
            );
          }

          if (ids.has(fila.productoId)) {
            throw new Error(
              "No puede repetir un producto."
            );
          }

          ids.add(fila.productoId);

          const pesoKg = Number(fila.pesoKg);
          const gramos = Math.round(pesoKg * 1000);

          const disponibles = Math.round(
            saldo.disponibleKg * 1000
          );

          if (
            !Number.isFinite(pesoKg) ||
            pesoKg <= 0 ||
            !Number.isSafeInteger(gramos) ||
            gramos <= 0 ||
            Math.abs(pesoKg * 1000 - gramos) >= 0.000001 ||
            gramos > disponibles
          ) {
            throw new Error(
              `Revise los kilos de ${saldo.descripcion}: no pueden superar lo disponible y admiten hasta tres decimales.`
            );
          }

          const cantidadPresentaciones =
            saldo.presentacion === "SOLO_PESO"
              ? null
              : Number(fila.cantidadPresentaciones);

          if (saldo.presentacion !== "SOLO_PESO") {
            if (
              !Number.isSafeInteger(cantidadPresentaciones) ||
              cantidadPresentaciones <= 0 ||
              cantidadPresentaciones >
                saldo.presentacionesDisponibles
            ) {
              throw new Error(
                `Revise las piezas o paquetes de ${saldo.descripcion}.`
              );
            }

            if (
              (gramos === disponibles) !==
              (
                cantidadPresentaciones ===
                saldo.presentacionesDisponibles
              )
            ) {
              throw new Error(
                `Revise ${saldo.descripcion}: al enviar todas las piezas debe enviar también su peso total, y viceversa.`
              );
            }
          }

          return {
            productoId: fila.productoId,
            pesoKg: gramos / 1000,
            cantidadPresentaciones
          };
        });

        solicitud = {
          fecha,
          observaciones: observaciones.trim(),
          detalles,
          claveOperacion: window.crypto.randomUUID(),
          referencias: productos.filter(
            (producto) => ids.has(producto.productoId)
          )
        };

        sessionStorage.setItem(
          clavePendiente,
          JSON.stringify(solicitud)
        );

        setPendiente(solicitud);
      } catch (fallo) {
        setError(fallo.message);
        window.alert(fallo.message);
        return;
      }
    }

    ocupadoRef.current = true;
    setGuardando(true);
    setError("");

    try {
      const respuesta = await crearEnvioLote(
        id,
        solicitud
      );

      borrarPendiente();

      window.alert(
        `${respuesta.mensaje}\n\n` +
        `Número de envío: ${respuesta.envio.numeroEnvio}`
      );

      navigate(`/lotes-crianza/${id}`, {
        replace: true
      });
    } catch (fallo) {
      if ([400, 409, 423].includes(fallo.status)) {
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} Reintente la misma solicitud antes de preparar otro envío.`
        );
      }

      window.alert(fallo.message);
    } finally {
      ocupadoRef.current = false;
      setGuardando(false);
    }
  }

  const totalGramos = filas.reduce((suma, fila) => {
    const valor = Number(fila.pesoKg);

    return suma + (
      Number.isFinite(valor) && valor > 0
        ? Math.round(valor * 1000)
        : 0
    );
  }, 0);

  const bloqueados = productos.filter(
    (producto) => producto.bloqueos?.length > 0
  );

  return (
    <div>
      <Encabezado />

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          color: "#5A2D16"
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          ENVIAR PRODUCCIÓN A TIENDITA
        </h2>

        {datos && (
          <h3 style={{ textAlign: "center" }}>
            Lote: {datos.lote.nombre}
          </h3>
        )}

        <form
          noValidate
          onSubmit={guardar}
          style={{
            border: "1px solid #5A2D16",
            borderRadius: "8px",
            padding: "18px"
          }}
        >
          <h3
            style={{
              backgroundColor: "#E8D1A5",
              padding: "12px"
            }}
          >
            Preparar envío
          </h3>

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
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px"
              }}
            >
              <label>
                Fecha de envío
                <input
                  style={campo}
                  type="date"
                  value={fecha}
                  onChange={cambiarFecha}
                  min={
                    datos
                      ? String(datos.lote.fechaInicio).slice(0, 10)
                      : undefined
                  }
                  max={obtenerFechaVenezuela().slice(0, 10)}
                />
              </label>

              <label>
                Origen
                <input
                  style={campo}
                  value="MONASTERIO"
                  readOnly
                />
              </label>

              <label>
                Destino
                <input
                  style={campo}
                  value="TIENDITA"
                  readOnly
                />
              </label>
            </div>

            <p>
              Número de envío: se asignará al confirmar.
            </p>

            {cargando && (
              <p>Consultando existencias...</p>
            )}

            {datos && productos.length === 0 && (
              <p>
                No hay entradas de este lote para la
                fecha seleccionada.
              </p>
            )}

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "800px",
                  borderCollapse: "collapse"
                }}
              >
                <thead
                  style={{ backgroundColor: "#E8D1A5" }}
                >
                  <tr>
                    <th style={celda}>Producto</th>
                    <th style={celda}>Disponible del lote</th>
                    <th style={celda}>
                      Piezas / paquetes a enviar
                    </th>
                    <th style={celda}>Peso a enviar (kg)</th>
                    <th style={celda}>Quitar</th>
                  </tr>
                </thead>

                <tbody>
                  {filas.map((fila) => {
                    const saldo = saldoDe(fila.productoId);

                    return (
                      <tr key={fila.uid}>
                        <td style={celda}>
                          <select
                            style={campo}
                            aria-label="Producto para envío"
                            value={fila.productoId}
                            onChange={(e) =>
                              cambiarFila(
                                fila.uid,
                                "productoId",
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Seleccione un producto
                            </option>

                            {productos.map((producto) => (
                              <option
                                key={producto.productoId}
                                value={producto.productoId}
                                disabled={
                                  !producto.habilitado ||
                                  filas.some(
                                    (otra) =>
                                      otra.uid !== fila.uid &&
                                      otra.productoId === producto.productoId
                                  )
                                }
                              >
                                {producto.descripcion} — {producto.codigo}
                                {!producto.habilitado
                                  ? " (no disponible)"
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={celda}>
                          {saldo
                            ? saldo.bloqueos?.length
                              ? "Saldo por revisar"
                              : (
                                <>
                                  {kilos(saldo.disponibleKg)} kg

                                  {saldo.presentacion !== "SOLO_PESO" && (
                                    <>
                                      {" · "}
                                      {saldo.presentacionesDisponibles}
                                      {" "}
                                      {unidades(saldo.presentacion)}
                                    </>
                                  )}
                                </>
                              )
                            : "—"}
                        </td>

                        <td style={celda}>
                          {saldo &&
                          saldo.presentacion !== "SOLO_PESO" ? (
                            <label>
                              {unidades(saldo.presentacion)}
                              <input
                                style={campo}
                                type="number"
                                min="1"
                                step="1"
                                max={
                                  saldo.presentacionesDisponibles ??
                                  undefined
                                }
                                value={fila.cantidadPresentaciones}
                                onChange={(e) =>
                                  cambiarFila(
                                    fila.uid,
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
                            type="number"
                            aria-label="Kilos para envío"
                            min="0.001"
                            step="0.001"
                            max={saldo?.disponibleKg ?? undefined}
                            value={fila.pesoKg}
                            onChange={(e) =>
                              cambiarFila(
                                fila.uid,
                                "pesoKg",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td style={celda}>
                          <button
                            type="button"
                            style={{
                              ...boton,
                              backgroundColor: "#888"
                            }}
                            onClick={() => quitar(fila.uid)}
                          >
                            QUITAR
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              style={{ ...boton, marginTop: "12px" }}
              onClick={agregar}
              disabled={
                filas.length >= 7 ||
                !productos.some(
                  (producto) =>
                    producto.habilitado &&
                    !filas.some(
                      (fila) =>
                        fila.productoId === producto.productoId
                    )
                )
              }
            >
              AGREGAR PRODUCTO
            </button>

            <p style={{ textAlign: "center" }}>
              <strong>
                Peso total del envío:{" "}
                {kilos(totalGramos / 1000)} kg
              </strong>
            </p>

            <label>
              Observaciones
              <textarea
                style={{ ...campo, minHeight: "80px" }}
                maxLength={2000}
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(e.target.value)
                }
              />
            </label>
          </fieldset>

          <p>
            Al confirmar se genera la salida del Monasterio.
            El envío queda EN TRÁNSITO hasta que Tiendita
            confirme lo recibido.
          </p>

          {pendiente && !guardando && (
            <p>
              Hay una solicitud pendiente. El reintento
              conserva su identificador para evitar duplicarla.
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <button
              type="submit"
              style={boton}
              disabled={
                guardando ||
                cargando ||
                (!datos && !pendiente)
              }
            >
              {guardando
                ? "PROCESANDO..."
                : pendiente
                  ? "REINTENTAR EL MISMO ENVÍO"
                  : "CONFIRMAR ENVÍO"}
            </button>

            <button
              type="button"
              disabled={guardando}
              style={{ ...boton, backgroundColor: "#888" }}
              onClick={() =>
                navigate(`/lotes-crianza/${id}`)
              }
            >
              {pendiente ? "VOLVER AL LOTE" : "CANCELAR"}
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
        </form>

        {error && (
          <div role="alert" style={{ color: "#b00020" }}>
            <p>{error}</p>

            <button
              type="button"
              style={boton}
              disabled={guardando || cargando}
              onClick={() =>
                setRevision((valor) => valor + 1)
              }
            >
              ACTUALIZAR CONSULTA
            </button>
          </div>
        )}

        {bloqueados.length > 0 && (
          <section style={{ marginTop: "20px" }}>
            <h3>Productos con saldo por revisar</h3>

            {bloqueados.map((producto) => (
              <p key={producto.productoId}>
                <strong>{producto.descripcion}:</strong>{" "}
                {producto.bloqueos.join(" ")}
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}