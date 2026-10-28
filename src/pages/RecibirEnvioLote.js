import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  listarEnviosLote,
  obtenerEnvioLote,
  recibirEnvioLote
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
  backgroundColor: "#84B09C",
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
  return Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function etiquetaCantidad(presentacion) {
  return presentacion === "PAQUETE_DOS"
    ? "Paquetes de 2"
    : "Piezas";
}

function numeroDecimal(valor) {
  const texto = String(valor ?? "").trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,3})?$/.test(texto)) {
    return null;
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : null;
}

export default function RecibirEnvioLote() {
  const navigate = useNavigate();
  const ocupadoRef = useRef(false);

  const claveGuardado =
    `recepcionEnvio:${localStorage.getItem("usuarioNombre") || ""}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const guardado = JSON.parse(
        sessionStorage.getItem(claveGuardado) || "null"
      );

      return guardado?.envio?._id &&
        guardado?.solicitud?.claveOperacion &&
        Array.isArray(guardado?.solicitud?.detalles)
        ? guardado
        : null;
    } catch {
      return null;
    }
  });

  const [envios, setEnvios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [revision, setRevision] = useState(0);

  const [envio, setEnvio] = useState(pendiente?.envio || null);

  const [fecha, setFecha] = useState(
    pendiente?.solicitud.fecha ||
      obtenerFechaVenezuela().slice(0, 10)
  );

  const [observaciones, setObservaciones] = useState(
    pendiente?.solicitud.observaciones || ""
  );

  const [motivo, setMotivo] = useState(
    pendiente?.solicitud.motivoDiferencias || ""
  );

  const [filas, setFilas] = useState(
    pendiente?.solicitud.detalles || []
  );

  const [cargando, setCargando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const [respuestaEnvios, respuestaProductos] =
          await Promise.all([
            listarEnviosLote({
              sede: "TIENDITA",
              estado: "EN_TRANSITO",
              pagina
            }),
            fetch(
              `${API_URL}/api/productos?sede=TIENDITA`,
              { credentials: "include" }
            )
          ]);

        const catalogo = await respuestaProductos.json();

        if (!respuestaProductos.ok || !Array.isArray(catalogo)) {
          throw new Error(
            "No se pudo cargar el catálogo de productos de Tiendita."
          );
        }

        if (!Array.isArray(respuestaEnvios.envios)) {
          throw new Error(
            "No se pudo obtener la lista de envíos pendientes."
          );
        }

        const disponibles = catalogo
          .filter(
            (producto) =>
              producto.origen === "PRODUCCION_MONASTERIO" &&
              (!producto.sede || producto.sede === "TIENDITA")
          )
          .sort((a, b) =>
            String(a.descripcion || "").localeCompare(
              String(b.descripcion || ""),
              "es",
              { sensitivity: "base", numeric: true }
            )
          );

        if (activo) {
          setEnvios(respuestaEnvios.envios);
          setTotalPaginas(respuestaEnvios.totalPaginas || 1);
          setProductos(disponibles);
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [pagina, revision]);

  async function seleccionarEnvio(id) {
    if (
      !id ||
      ocupadoRef.current ||
      consultando ||
      pendiente
    ) {
      return;
    }

    setConsultando(true);
    setError("");
    setMensaje("");
    setEnvio(null);
    setFilas([]);

    try {
      const respuesta = await obtenerEnvioLote(id, "TIENDITA");
      const seleccionado = respuesta.envio;

      if (
        !seleccionado ||
        seleccionado.estado !== "EN_TRANSITO" ||
        !Array.isArray(seleccionado.detalles)
      ) {
        throw new Error(
          "Este envío ya no está pendiente de recepción. Actualice la lista."
        );
      }

      setEnvio(seleccionado);
      setFecha(obtenerFechaVenezuela().slice(0, 10));
      setObservaciones("");
      setMotivo("");

      setFilas(
        seleccionado.detalles.map((detalle) => ({
          productoOrigenId: String(detalle.productoOrigenId),
          productoDestinoId: "",
          pesoRecibidoKg: "",
          presentacionesRecibidas:
            detalle.presentacion === "SOLO_PESO" ? null : "",
          revisado: false
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setConsultando(false);
    }
  }

  function cambiarFila(indice, propiedad, valor) {
    if (guardando || pendiente) return;

    setFilas((actuales) =>
      actuales.map((fila, posicion) =>
        posicion === indice
          ? { ...fila, [propiedad]: valor }
          : fila
      )
    );
  }
    function prepararSolicitud() {
    if (!envio || envio.estado !== "EN_TRANSITO") {
      throw new Error("Seleccione un envío pendiente.");
    }

    const hoy = obtenerFechaVenezuela().slice(0, 10);
    const fechaEnvio = String(envio.fechaEnvio).slice(0, 10);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      fecha < fechaEnvio ||
      fecha > hoy
    ) {
      throw new Error(
        "La fecha de recepción debe estar entre la fecha del envío y hoy."
      );
    }

    if (filas.length !== envio.detalles.length) {
      throw new Error("Debe revisar todos los productos del envío.");
    }

    if (
      observaciones.trim().length > 2000 ||
      motivo.trim().length > 2000
    ) {
      throw new Error(
        "Las observaciones y el motivo admiten hasta 2000 caracteres."
      );
    }

    const destinosUsados = new Set();
    let tieneDiferencias = false;

    const detalles = envio.detalles.map((original, indice) => {
      const fila = filas[indice];
      const nombre = original.descripcionOrigen;

      if (
        !fila ||
        String(fila.productoOrigenId) !==
          String(original.productoOrigenId)
      ) {
        throw new Error(
          "Los productos no coinciden con el envío. Vuelva a consultarlo."
        );
      }

      const producto = productos.find(
        (item) => String(item._id) === fila.productoDestinoId
      );

      if (!producto) {
        throw new Error(
          `Seleccione el producto de Tiendita para: ${nombre}.`
        );
      }

      if (destinosUsados.has(fila.productoDestinoId)) {
        throw new Error(
          "No puede seleccionar el mismo producto de Tiendita en dos filas."
        );
      }

      destinosUsados.add(fila.productoDestinoId);

      if (fila.revisado !== true) {
        throw new Error(
          `Marque como revisado el producto: ${nombre}.`
        );
      }

      const peso = numeroDecimal(fila.pesoRecibidoKg);

      if (peso === null) {
        throw new Error(
          `Ingrese los kilos recibidos de ${nombre}, con máximo 3 decimales. ` +
          "Si no llegó, escriba 0."
        );
      }

      const gramosRecibidos = Math.round(peso * 1000);
      const gramosEnviados = Math.round(
        Number(original.pesoEnviadoKg) * 1000
      );

      if (
        !Number.isFinite(gramosEnviados) ||
        gramosRecibidos > gramosEnviados
      ) {
        throw new Error(
          `El peso recibido de ${nombre} supera el enviado. ` +
          "Revise las cantidades antes de continuar."
        );
      }

      let cantidad = null;

      if (original.presentacion !== "SOLO_PESO") {
        const textoCantidad = String(
          fila.presentacionesRecibidas ?? ""
        ).trim();

        if (!/^\d+$/.test(textoCantidad)) {
          throw new Error(
            `Ingrese la cantidad recibida de ${nombre} en números enteros.`
          );
        }

        cantidad = Number(textoCantidad);
        const enviadas = Number(original.presentacionesEnviadas);

        if (
          !Number.isSafeInteger(cantidad) ||
          !Number.isSafeInteger(enviadas) ||
          cantidad > enviadas
        ) {
          throw new Error(
            `La cantidad recibida de ${nombre} supera la enviada.`
          );
        }

        if (
          (gramosRecibidos === 0 && cantidad !== 0) ||
          (gramosRecibidos > 0 && cantidad === 0)
        ) {
          throw new Error(
            `Revise ${nombre}: si recibió producto, debe indicar ` +
            "tanto los kilos como la cantidad. Si no llegó, ambos deben ser 0."
          );
        }

        if (cantidad !== enviadas) {
          tieneDiferencias = true;
        }
      }

      if (gramosRecibidos !== gramosEnviados) {
        tieneDiferencias = true;
      }

      return {
        productoOrigenId: String(original.productoOrigenId),
        productoDestinoId: fila.productoDestinoId,
        pesoRecibidoKg: gramosRecibidos / 1000,
        presentacionesRecibidas: cantidad,
        revisado: true
      };
    });

    if (tieneDiferencias && !motivo.trim()) {
      throw new Error(
        "Hay diferencias entre lo enviado y lo recibido. Indique el motivo."
      );
    }

    if (!window.crypto?.getRandomValues) {
      throw new Error(
        "No se pudo preparar la recepción. Abra el sistema mediante su dirección HTTPS."
      );
    }

    const valores = new Uint32Array(4);
    window.crypto.getRandomValues(valores);

    const claveOperacion = Array.from(
      valores,
      (valor) => valor.toString(16).padStart(8, "0")
    ).join("");

    return {
      fecha,
      observaciones: observaciones.trim(),
      motivoDiferencias: motivo.trim(),
      detalles,
      versionEsperada: envio.__v ?? 0,
      claveOperacion
    };
  }

  async function guardarRecepcion(evento) {
    evento.preventDefault();

    if (ocupadoRef.current) return;

    ocupadoRef.current = true;
    setError("");
    setMensaje("");

    let operacion = pendiente;

    try {
      if (!operacion) {
        const solicitud = prepararSolicitud();

        const confirmar = window.confirm(
          `¿Confirmar la recepción del envío ${envio.numeroEnvio}?\n\n` +
          "Se registrarán como entradas únicamente las cantidades recibidas."
        );

        if (!confirmar) return;

        operacion = { envio, solicitud };

        // Se conserva la misma solicitud para poder reintentar
        // sin registrar dos veces la recepción.
        try {
          sessionStorage.setItem(
            claveGuardado,
            JSON.stringify(operacion)
          );
        } catch {
          throw new Error(
            "No se pudo guardar el respaldo de la solicitud en este navegador. " +
            "La recepción no fue enviada."
          );
        }

        setPendiente(operacion);
      }

      setGuardando(true);

      let respuesta;

      try {
        respuesta = await recibirEnvioLote(
          operacion.envio._id,
          operacion.solicitud
        );
      } catch (err) {
        // Estas respuestas confirman que la operación fue rechazada.
        // Los errores de conexión conservan la solicitud para reintentar.
        if ([400, 409, 423].includes(err.status)) {
          try {
            sessionStorage.removeItem(claveGuardado);
            setPendiente(null);
          } catch {
            // Si el navegador no permite quitar el respaldo,
            // se mantiene el reintento con el mismo identificador.
          }
        }

        throw err;
      }

      // La recepción ya fue confirmada por el servidor.
      try {
        sessionStorage.removeItem(claveGuardado);
      } catch {
        // Un reintento posterior conserva la misma operación.
      }

      setPendiente(null);
      setEnvio(null);
      setFilas([]);
      setObservaciones("");
      setMotivo("");

      const texto =
        respuesta.mensaje ||
        "Recepción registrada correctamente.";

      setMensaje(texto);
      window.alert(texto);

      setRevision((actual) => actual + 1);
    } catch (err) {
      setError(err.message);
      window.alert(err.message);
    } finally {
      setGuardando(false);
      ocupadoRef.current = false;
    }
  }

  const bloqueado = guardando || Boolean(pendiente);
    return (
    <div style={{ padding: "20px" }}>
      <Encabezado />

      <h2 style={{ textAlign: "center" }}>
        RECIBIR PRODUCCIÓN DEL MONASTERIO
      </h2>

      <p style={{ textAlign: "center" }}>
        Compruebe cada producto y registre las cantidades que
        realmente llegaron a Tiendita.
      </p>

      {error && (
        <p role="alert" style={{ color: "red", textAlign: "center" }}>
          {error}
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          style={{ color: "#226644", textAlign: "center" }}
        >
          {mensaje}
        </p>
      )}

      {pendiente && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#FFF4D1",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        >
          Hay una recepción pendiente de confirmar.
          Pulse REINTENTAR LA MISMA RECEPCIÓN para consultar
          su resultado sin duplicarla.
        </div>
      )}

      <fieldset
        style={{
          maxWidth: "900px",
          margin: "20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px"
        }}
      >
        <legend>Envíos pendientes de recepción</legend>

        <label htmlFor="envio-pendiente">
          Seleccione el envío:
        </label>

        <select
          id="envio-pendiente"
          style={{ ...campo, marginTop: "6px" }}
          value={envio?._id || ""}
          disabled={
            cargando || consultando || bloqueado
          }
          onChange={(e) => seleccionarEnvio(e.target.value)}
        >
          <option value="">-- Seleccione un envío --</option>

          {envio &&
            !envios.some(
              (item) => String(item._id) === String(envio._id)
            ) && (
              <option value={envio._id}>
                {envio.numeroEnvio}
              </option>
            )}

          {envios.map((item) => (
            <option key={item._id} value={item._id}>
              {item.numeroEnvio}
              {" — "}
              {item.loteId?.nombre || "Lote"}
              {" — "}
              {String(item.fechaEnvio).slice(0, 10)}
            </option>
          ))}
        </select>

        {cargando && <p>Cargando envíos y productos...</p>}
        {consultando && <p>Consultando el envío...</p>}

        {!cargando && envios.length === 0 && !error && (
          <p>No hay envíos pendientes en esta página.</p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "15px"
          }}
        >
          <button
            type="button"
            style={boton}
            disabled={
              pagina <= 1 ||
              cargando ||
              consultando ||
              bloqueado
            }
            onClick={() => setPagina((actual) => actual - 1)}
          >
            ANTERIOR
          </button>

          <span>
            Página {pagina} de {totalPaginas}
          </span>

          <button
            type="button"
            style={boton}
            disabled={
              pagina >= totalPaginas ||
              cargando ||
              consultando ||
              bloqueado
            }
            onClick={() => setPagina((actual) => actual + 1)}
          >
            SIGUIENTE
          </button>

          <button
            type="button"
            style={boton}
            disabled={cargando || consultando || bloqueado}
            onClick={() => setRevision((actual) => actual + 1)}
          >
            ACTUALIZAR LISTA
          </button>
        </div>
      </fieldset>

      {envio && (
        <form noValidate onSubmit={guardarRecepcion}>
          <fieldset
            disabled={bloqueado}
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px"
            }}
          >
            <legend>Comprobación de la recepción</legend>

            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "20px"
              }}
            >
              <div>
                <strong>Envío:</strong> {envio.numeroEnvio}
              </div>

              <div>
                <strong>Lote:</strong>{" "}
                {envio.loteId?.nombre || "Lote de pollos"}
              </div>

              <div>
                <strong>Origen:</strong> MONASTERIO
              </div>

              <div>
                <strong>Destino:</strong> TIENDITA
              </div>

              <div>
                <strong>Estado:</strong>{" "}
                {String(envio.estado).replace(/_/g, " ")}
              </div>
            </div>

            {envio.observacionesEnvio && (
              <p>
                <strong>Observaciones del envío:</strong>{" "}
                {envio.observacionesEnvio}
              </p>
            )}

            <div
              style={{
                maxWidth: "260px",
                marginBottom: "20px"
              }}
            >
              <label htmlFor="fecha-recepcion">
                Fecha de recepción:
              </label>

              <input
                id="fecha-recepcion"
                type="date"
                style={{ ...campo, marginTop: "5px" }}
                value={fecha}
                min={String(envio.fechaEnvio).slice(0, 10)}
                max={obtenerFechaVenezuela().slice(0, 10)}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <p>
              Seleccione el producto correspondiente del catálogo
              de Tiendita. Escriba 0 cuando un producto no haya llegado.
            </p>

            {!cargando && productos.length === 0 && (
              <p style={{ color: "red" }}>
                No se encontraron productos de Tiendita con origen
                PRODUCCION_MONASTERIO. Revise el catálogo antes de
                confirmar.
              </p>
            )}

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}
              >
                <thead style={{ backgroundColor: "#F9CEAE" }}>
                  <tr>
                    <th style={celda}>Producto enviado</th>
                    <th style={celda}>Producto en Tiendita</th>
                    <th style={celda}>Cantidad enviada</th>
                    <th style={celda}>Kg enviados</th>
                    <th style={celda}>Cantidad recibida</th>
                    <th style={celda}>Kg recibidos</th>
                    <th style={celda}>Diferencia</th>
                    <th style={celda}>Revisado</th>
                  </tr>
                </thead>

                <tbody>
                  {envio.detalles.map((detalle, indice) => {
                    const fila = filas[indice] || {};
                    const soloPeso =
                      detalle.presentacion === "SOLO_PESO";

                    const peso = numeroDecimal(
                      fila.pesoRecibidoKg
                    );

                    const diferenciaGramos =
                      peso === null
                        ? null
                        : Math.round(peso * 1000) -
                          Math.round(
                            Number(detalle.pesoEnviadoKg) * 1000
                          );

                    const textoCantidad = String(
                      fila.presentacionesRecibidas ?? ""
                    ).trim();

                    const diferenciaCantidad =
                      soloPeso || !/^\d+$/.test(textoCantidad)
                        ? null
                        : Number(textoCantidad) -
                          Number(detalle.presentacionesEnviadas);

                    const hayDiferencia =
                      (diferenciaGramos !== null &&
                        diferenciaGramos !== 0) ||
                      (diferenciaCantidad !== null &&
                        diferenciaCantidad !== 0);

                    return (
                      <tr key={detalle.productoOrigenId}>
                        <td style={celda}>
                          <strong>
                            {detalle.descripcionOrigen}
                          </strong>
                          <br />
                          Código: {detalle.codigoOrigen}
                        </td>

                        <td style={celda}>
                          <select
                            style={{
                              ...campo,
                              minWidth: "220px"
                            }}
                            aria-label={
                              `Producto de Tiendita para ` +
                              detalle.descripcionOrigen
                            }
                            value={fila.productoDestinoId || ""}
                            onChange={(e) =>
                              cambiarFila(
                                indice,
                                "productoDestinoId",
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              -- Seleccione el producto --
                            </option>

                            {productos.map((producto) => (
                              <option
                                key={producto._id}
                                value={producto._id}
                              >
                                {producto.descripcion}
                                {" — "}
                                {producto.codigo}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={celda}>
                          {soloPeso
                            ? "Solo peso"
                            : `${detalle.presentacionesEnviadas} ${
                                etiquetaCantidad(
                                  detalle.presentacion
                                )
                              }`}
                        </td>

                        <td style={celda}>
                          {kilos(detalle.pesoEnviadoKg)}
                        </td>

                        <td style={celda}>
                          {soloPeso ? (
                            "—"
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              style={{
                                ...campo,
                                minWidth: "90px"
                              }}
                              aria-label={
                                `Cantidad recibida de ` +
                                detalle.descripcionOrigen
                              }
                              value={
                                fila.presentacionesRecibidas ?? ""
                              }
                              onChange={(e) =>
                                cambiarFila(
                                  indice,
                                  "presentacionesRecibidas",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </td>

                        <td style={celda}>
                          <input
                            type="text"
                            inputMode="decimal"
                            style={{
                              ...campo,
                              minWidth: "100px"
                            }}
                            aria-label={
                              `Kilos recibidos de ` +
                              detalle.descripcionOrigen
                            }
                            value={fila.pesoRecibidoKg ?? ""}
                            onChange={(e) =>
                              cambiarFila(
                                indice,
                                "pesoRecibidoKg",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td
                          style={{
                            ...celda,
                            color: hayDiferencia
                              ? "#B22222"
                              : "#226644",
                            minWidth: "120px"
                          }}
                        >
                          {diferenciaGramos === null
                            ? "Pendiente"
                            : `${kilos(
                                diferenciaGramos / 1000
                              )} kg`}

                          {!soloPeso &&
                            diferenciaCantidad !== null && (
                              <div>
                                {diferenciaCantidad}{" "}
                                {etiquetaCantidad(
                                  detalle.presentacion
                                )}
                              </div>
                            )}
                        </td>

                        <td
                          style={{
                            ...celda,
                            textAlign: "center"
                          }}
                        >
                          <input
                            type="checkbox"
                            aria-label={
                              `Revisado: ` +
                              detalle.descripcionOrigen
                            }
                            checked={fila.revisado === true}
                            onChange={(e) =>
                              cambiarFila(
                                indice,
                                "revisado",
                                e.target.checked
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
              <strong>Total enviado:</strong>{" "}
              {kilos(
                envio.detalles.reduce(
                  (suma, detalle) =>
                    suma + Number(detalle.pesoEnviadoKg),
                  0
                )
              )}{" "}
              kg
            </p>

            <div style={{ marginTop: "20px" }}>
              <label htmlFor="motivo-diferencias">
                Motivo de las diferencias
                (obligatorio si falta producto):
              </label>

              <textarea
                id="motivo-diferencias"
                style={{ ...campo, marginTop: "5px" }}
                rows={3}
                maxLength={2000}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "15px" }}>
              <label htmlFor="observaciones-recepcion">
                Observaciones de la recepción:
              </label>

              <textarea
                id="observaciones-recepcion"
                style={{ ...campo, marginTop: "5px" }}
                rows={3}
                maxLength={2000}
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(e.target.value)
                }
              />
            </div>
          </fieldset>

          <p style={{ textAlign: "center" }}>
            Las diferencias quedarán registradas para revisión.
          </p>

          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <button
              type="submit"
              style={{
                ...boton,
                opacity: guardando ? 0.6 : 1
              }}
              disabled={
                guardando ||
                consultando ||
                (!pendiente && cargando)
              }
            >
              {guardando
                ? "PROCESANDO RECEPCIÓN..."
                : pendiente
                  ? "REINTENTAR LA MISMA RECEPCIÓN"
                  : "CONFIRMAR RECEPCIÓN"}
            </button>
          </div>
        </form>
      )}

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          type="button"
          style={{
            ...boton,
            backgroundColor: "#FC9E9B"
          }}
          disabled={guardando}
          onClick={() => navigate("/menu")}
        >
          VOLVER AL MENÚ
        </button>
      </div>
    </div>
  );
}