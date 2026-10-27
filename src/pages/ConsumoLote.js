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
  obtenerConsumoLoteCrianza,
  registrarConsumoLoteCrianza
} from "../services/lotesCrianza";

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

const destinosBase = [
  { codigo: "COCINA_MONASTERIO", nombre: "Cocina del Monasterio" },
  { codigo: "PASAPALOS", nombre: "Pasapalos para consumo interno" },
  { codigo: "CELEBRACION", nombre: "Celebración" },
  { codigo: "OTRO", nombre: "Otro destino" }
];

function kilos(valor) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function fechaTexto(valor) {
  return String(valor || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");
}

function unidades(tipo) {
  return tipo === "PAQUETE_DOS"
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

export default function ConsumoLote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `consumoLote:${
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
        ["MONASTERIO", "TIENDITA"].includes(datos.sede) &&
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
  const [sede, setSede] = useState(
    pendiente?.sede || "MONASTERIO"
  );
  const [destino, setDestino] = useState(
    pendiente?.destino || "COCINA_MONASTERIO"
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
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    setDatos(null);
    setError("");

    if (!fecha) {
      setCargando(false);

      return () => {
        activo = false;
      };
    }

    setCargando(true);

    obtenerConsumoLoteCrianza(id, sede, fecha)
      .then((respuesta) => {
        if (
          !Array.isArray(respuesta.productos) ||
          !Array.isArray(respuesta.consumos) ||
          !Array.isArray(respuesta.destinos) ||
          !respuesta.lote
        ) {
          throw new Error(
            "La consulta de consumo no tiene el formato esperado."
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
  }, [id, sede, fecha, revision]);

  const productos =
    datos?.productos || pendiente?.referencias || [];

  const destinos =
    datos?.destinos || destinosBase;

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

  function cambiarContexto(e) {
    if (e.target.name === "fecha") {
      setFecha(e.target.value);
    } else {
      setSede(e.target.value);
    }

    limpiarFilas();
    setMensaje("");
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
      // El resultado ya fue confirmado.
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
        if (
          !fecha ||
          !destinos.some(
            (item) => item.codigo === destino
          )
        ) {
          throw new Error(
            "Complete la fecha y el destino del consumo."
          );
        }

        if (
          destino === "OTRO" &&
          !observaciones.trim()
        ) {
          throw new Error(
            "Describa el destino en Observaciones."
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
                `Revise ${saldo.descripcion}: al retirar todas las piezas debe retirar también su peso total, y viceversa.`
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
          sede,
          destino,
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
    setMensaje("");

    try {
      const respuesta = await registrarConsumoLoteCrianza(
        id,
        solicitud
      );

      borrarPendiente();
      limpiarFilas();
      setObservaciones("");
      setMensaje(respuesta.mensaje);
      window.alert(respuesta.mensaje);
      setRevision((valor) => valor + 1);
    } catch (fallo) {
      if ([400, 409, 423].includes(fallo.status)) {
        borrarPendiente();
        setError(fallo.message);
      } else {
        setError(
          `${fallo.message} Reintente la misma solicitud antes de registrar otro consumo.`
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
          REGISTRAR CONSUMO INTERNO
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
            Retiro de productos para consumo
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
                  value={fecha}
                  onChange={cambiarContexto}
                  min={
                    datos
                      ? String(datos.lote.fechaInicio).slice(0, 10)
                      : undefined
                  }
                  max={obtenerFechaVenezuela().slice(0, 10)}
                />
              </label>

              <label>
                Sede de donde se retira
                <select
                  style={campo}
                  name="sede"
                  value={sede}
                  onChange={cambiarContexto}
                >
                  <option value="MONASTERIO">MONASTERIO</option>
                  <option value="TIENDITA">TIENDITA</option>
                </select>
              </label>
            </div>

            {cargando && (
              <p>Consultando existencias...</p>
            )}

            {datos && productos.length === 0 && (
              <p>
                No hay entradas vinculadas a este lote en
                esta sede para la fecha seleccionada.
              </p>
            )}

            <div
              style={{
                overflowX: "auto",
                marginTop: "20px"
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "800px",
                  borderCollapse: "collapse"
                }}
              >
                <thead style={{ backgroundColor: "#E8D1A5" }}>
                  <tr>
                    <th style={celda}>Producto</th>
                    <th style={celda}>Disponible del lote</th>
                    <th style={celda}>Piezas / paquetes</th>
                    <th style={celda}>Peso a retirar (kg)</th>
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
                            aria-label="Producto para consumo"
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
                            aria-label="Kilos para consumo"
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
                            onClick={() => quitar(fila.uid)}
                            style={{
                              ...boton,
                              backgroundColor: "#888"
                            }}
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

            <p>
              <strong>
                Peso total para consumo:{" "}
                {kilos(totalGramos / 1000)} kg
              </strong>
            </p>

            <label>
              Destino del consumo
              <select
                style={campo}
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              >
                {destinos.map((item) => (
                  <option
                    key={item.codigo}
                    value={item.codigo}
                  >
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: "block",
                marginTop: "15px"
              }}
            >
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
            Este retiro descuenta existencias del lote.
            No genera una venta ni una salida de dinero.
          </p>

          {pendiente && !guardando && (
            <p>
              Hay una solicitud pendiente de confirmar.
              El reintento conserva su identificador.
            </p>
          )}

          {mensaje && (
            <p role="status" style={{ color: "#286140" }}>
              {mensaje}
            </p>
          )}

          <div style={{ textAlign: "center" }}>
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
                  ? "REINTENTAR EL MISMO CONSUMO"
                  : "GUARDAR CONSUMO"}
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

        {datos && (
          <section style={{ marginTop: "25px" }}>
            <h3>Consumos registrados en {sede}</h3>

            {datos.consumos.length === 0 ? (
              <p>Todavía no hay consumos registrados.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead
                    style={{ backgroundColor: "#E8D1A5" }}
                  >
                    <tr>
                      <th style={celda}>Fecha</th>
                      <th style={celda}>Destino</th>
                      <th style={celda}>Productos consumidos</th>
                      <th style={celda}>Observaciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {datos.consumos.map((consumo) => (
                      <tr key={consumo._id}>
                        <td style={celda}>
                          {fechaTexto(consumo.fecha)}
                        </td>

                        <td style={celda}>
                          {destinos.find(
                            (item) => item.codigo === consumo.destino
                          )?.nombre || consumo.destino}
                        </td>

                        <td style={celda}>
                          {consumo.detalles.map((detalle) => (
                            <div key={detalle.productoId}>
                              {detalle.descripcion}:{" "}
                              {kilos(detalle.pesoKg)} kg

                              {detalle.presentacion !== "SOLO_PESO" && (
                                <>
                                  {" · "}
                                  {detalle.cantidadPresentaciones}
                                  {" "}
                                  {unidades(detalle.presentacion)}
                                </>
                              )}
                            </div>
                          ))}
                        </td>

                        <td style={celda}>
                          {consumo.observaciones || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "25px"
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
            onClick={() =>
              navigate(
                localStorage.getItem("sede") === "TIENDITA"
                  ? "/menu"
                  : "/menu-monasterio"
              )
            }
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </main>
    </div>
  );
}