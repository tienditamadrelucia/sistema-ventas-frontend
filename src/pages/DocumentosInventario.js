import React, {
  useEffect,
  useRef,
  useState
} from "react";

import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import { cargarProductos } from "../services/productos";
import { cargarCategorias } from "../services/categorias";

import {
  obtenerFechaVenezuela
} from "../utils/fechaVenezuela";

import {
  crearClaveDocumento,
  consultarOpcionesDocumentos,
  cargarDocumentos,
  obtenerDocumentoInventario,
  crearDocumentoInventario,
  revisarDocumentoInventario,
  eliminarDocumentoInventario
} from "../services/documentosInventario";

const filaVacia = () => ({
  categoria: "",
  productoId: "",
  cantidad: ""
});

const formato = valor =>
  Number(valor || 0).toLocaleString("es-VE", {
    maximumFractionDigits: 3
  });

const mostrarFecha = valor =>
  valor
    ? String(valor)
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/")
    : "";

const nombreUsuario = usuario =>
  usuario?.nombre ||
  usuario?.usuario ||
  "Sin información";

function leerPendiente(clave) {
  try {
    return JSON.parse(
      sessionStorage.getItem(clave) || "null"
    );
  } catch {
    return null;
  }
}

export default function DocumentosInventario({
  tipoInicial = "ENTRADA",
  modoRevision = false
}) {
  const navigate = useNavigate();

  const sedeSesion =
    localStorage.getItem("sede") || "TIENDITA";

  const [sedeConsulta, setSedeConsulta] =
    useState(sedeSesion);

  const hoy = obtenerFechaVenezuela();

  const [formulario, setFormulario] = useState({
    fecha: hoy,
    motivo: "",
    observaciones: ""
  });

  const [filas, setFilas] = useState([
    filaVacia()
  ]);

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [documentos, setDocumentos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [revision, setRevision] = useState(0);

  const [filtros, setFiltros] = useState({
    desde: `${hoy.slice(0, 7)}-01`,
    hasta: hoy,
    tipo: modoRevision ? "TODOS" : tipoInicial,
    estado: modoRevision ? "PENDIENTE" : "TODOS"
  });

  const [consulta, setConsulta] = useState({
    ...filtros,
    sede: sedeSesion
  });

  const [cargandoLista, setCargandoLista] =
    useState(false);

  const [observacionRevision, setObservacionRevision] =
    useState("");

  const [posibleDuplicado, setPosibleDuplicado] =
    useState(false);

  const ocupadoRef = useRef(false);

  const clavePendiente =
    `documentosInventario:` +
    `${localStorage.getItem("usuarioNombre") || "sesion"}:` +
    sedeSesion;

  const [pendiente, setPendiente] = useState(
    () => leerPendiente(clavePendiente)
  );

  const esAdministrador =
    opciones?.esAdministrador === true;

  const bloqueado =
    procesando || Boolean(pendiente);

  const esMonasterio =
    sedeSesion === "MONASTERIO";

  const colorAccion = esMonasterio
    ? "#B8862D"
    : "#84B09C";

  const colorPrincipal = esMonasterio
    ? "#5A2D16"
    : "#FC9E9B";

  const colorTabla = esMonasterio
    ? "#E8D1A5"
    : "#F9CEAE";

  const boton = {
    backgroundColor: colorAccion,
    color: "white",
    padding: "9px 16px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    fontFamily: "Arial",
    fontWeight: "bold",
    cursor: "pointer",
    margin: "5px"
  };

  const campo = {
    padding: "6px",
    border: "1px solid #aaa",
    borderRadius: "4px",
    boxSizing: "border-box",
    maxWidth: "100%"
  };

  const celda = {
    border: "1px solid #bbb",
    padding: "7px"
  };

  // ==========================================
  // CARGAR CATÁLOGOS Y PERMISOS
  // ==========================================
  useEffect(() => {
    let activo = true;

    setCargando(true);
    setOpciones(null);

    Promise.all([
      consultarOpcionesDocumentos(sedeSesion),

      modoRevision
        ? Promise.resolve([])
        : cargarProductos(sedeSesion),

      modoRevision
        ? Promise.resolve([])
        : cargarCategorias()
    ])
      .then(([datos, catalogo, grupos]) => {
        if (!activo) return;

        const listaProductos =
          catalogo?.productos || catalogo;

        const listaCategorias =
          grupos?.categorias || grupos;

        if (
          !Array.isArray(listaProductos) ||
          !Array.isArray(listaCategorias)
        ) {
          throw new Error(
            "No se pudo cargar el catálogo " +
            "de productos o categorías."
          );
        }

        setOpciones(datos);

        setProductos(
          [...listaProductos].sort((a, b) =>
            String(a.descripcion || "").localeCompare(
              String(b.descripcion || ""),
              "es",
              {
                sensitivity: "base",
                numeric: true
              }
            )
          )
        );

        setCategorias(listaCategorias);
        setError("");
      })
      .catch(e => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [sedeSesion, modoRevision]);

  // ==========================================
  // CARGAR LISTADO DE DOCUMENTOS
  // ==========================================
  useEffect(() => {
    if (
      !opciones ||
      (modoRevision && !esAdministrador)
    ) {
      return;
    }

    let activo = true;

    setCargandoLista(true);
    setDetalle(null);

    cargarDocumentos({
      ...consulta,
      page: pagina,
      limit: 20
    })
      .then(datos => {
        if (!activo) return;

        setDocumentos(datos.documentos);
        setTotalPaginas(
          datos.totalPages || 1
        );
      })
      .catch(e => {
        if (!activo) return;

        setDocumentos([]);
        setError(e.message);
      })
      .finally(() => {
        if (activo) setCargandoLista(false);
      });

    return () => {
      activo = false;
    };
  }, [
    consulta,
    pagina,
    revision,
    opciones,
    modoRevision,
    esAdministrador
  ]);

  // ==========================================
  // CAMBIOS EN EL FORMULARIO
  // ==========================================
  function cambiarFormulario(nombre, valor) {
    setFormulario(actual => ({
      ...actual,
      [nombre]: valor
    }));

    setPosibleDuplicado(false);
  }

  function cambiarFila(
    indice,
    nombre,
    valor
  ) {
    setFilas(actual =>
      actual.map((fila, i) =>
        i !== indice
          ? fila
          : {
              ...fila,
              [nombre]: valor,

              ...(nombre === "categoria"
                ? { productoId: "" }
                : {})
            }
      )
    );

    setPosibleDuplicado(false);
  }

  function buscarDocumentos(evento) {
    evento.preventDefault();

    if (filtros.desde > filtros.hasta) {
      setError("Revise el rango de fechas.");
      return;
    }

    setError("");
    setPagina(1);

    setConsulta({
      ...filtros,
      sede: sedeConsulta
    });

    setRevision(valor => valor + 1);
  }
    // ==========================================
  // EJECUTAR Y REINTENTAR UNA OPERACIÓN
  // ==========================================
  async function ejecutar(solicitud) {
    if (ocupadoRef.current) return;

    ocupadoRef.current = true;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      let respuesta;

      if (solicitud.accion === "GUARDAR") {
        respuesta = await crearDocumentoInventario(
          solicitud.datos
        );
      } else if (
        solicitud.accion === "REVISAR"
      ) {
        respuesta = await revisarDocumentoInventario(
          solicitud.id,
          solicitud.datos
        );
      } else if (
        solicitud.accion === "ELIMINAR"
      ) {
        respuesta = await eliminarDocumentoInventario(
          solicitud.id,
          solicitud.datos
        );
      } else {
        throw new Error(
          "La solicitud pendiente no se reconoce."
        );
      }

      try {
        sessionStorage.removeItem(clavePendiente);
      } catch {
        // El servidor conserva el resultado.
      }

      setPendiente(null);

      setMensaje(
        `${respuesta.referencia || ""}: ` +
        `${respuesta.mensaje || "Operación completada."}`
      );

      if (solicitud.accion === "GUARDAR") {
        setFilas([filaVacia()]);

        setFormulario(actual => ({
          ...actual,
          observaciones: ""
        }));
      }

      setDetalle(null);
      setObservacionRevision("");
      setPosibleDuplicado(false);

      setRevision(valor => valor + 1);
    } catch (e) {
      if (e.definitivo) {
        try {
          sessionStorage.removeItem(clavePendiente);
        } catch {
          // Conservar el mensaje del servidor.
        }

        setPendiente(null);

        if (
          solicitud.accion === "GUARDAR" &&
          e.message.startsWith("POSIBLE DUPLICADO:")
        ) {
          setPosibleDuplicado(true);
        }
      }

      setError(e.message);
    } finally {
      ocupadoRef.current = false;
      setProcesando(false);
    }
  }

  // ==========================================
  // CONSERVAR LA SOLICITUD ANTES DE ENVIARLA
  // ==========================================
  async function iniciar(
    accion,
    datos,
    id
  ) {
    if (
      ocupadoRef.current ||
      pendiente
    ) {
      return;
    }

    let solicitud;

    try {
      solicitud = {
        accion,
        id,

        datos: {
          ...datos,
          claveOperacion: crearClaveDocumento()
        }
      };

      sessionStorage.setItem(
        clavePendiente,
        JSON.stringify(solicitud)
      );
    } catch {
      setError(
        "No se pudo conservar la solicitud " +
        "en este navegador. No se enviaron " +
        "datos al servidor."
      );

      return;
    }

    setPendiente(solicitud);

    await ejecutar(solicitud);
  }

  // ==========================================
  // GUARDAR ENTRADA O SALIDA
  // ==========================================
  async function guardar(
    confirmarDuplicado = false
  ) {
    if (bloqueado || cargando) return;

    setError("");

    if (
      !formulario.fecha ||
      formulario.fecha > hoy ||
      !formulario.motivo
    ) {
      setError(
        "Seleccione una fecha válida " +
        "y el motivo del documento."
      );

      return;
    }

    const detalles = [];
    const usados = new Set();

    for (const fila of filas) {
      const cantidad = Number(
        String(fila.cantidad).replace(",", ".")
      );

      const producto = productos.find(
        p => p._id === fila.productoId
      );

      if (
        !fila.categoria ||
        !producto ||
        producto.categoria !== fila.categoria ||
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        setError(
          "Complete categoría, producto y cantidad " +
          "mayor que cero en todos los artículos."
        );

        return;
      }

      if (usados.has(producto._id)) {
        setError(
          "Hay un producto repetido. " +
          "Reúna la cantidad en una sola fila."
        );

        return;
      }

      usados.add(producto._id);

      detalles.push({
        productoId: producto._id,
        cantidad
      });
    }

    let motivoRepeticion = "";

    if (confirmarDuplicado) {
      const respuesta = window.prompt(
        "Después de revisar el documento similar, " +
        "indique por qué corresponde registrar otro:"
      );

      if (respuesta === null) return;

      motivoRepeticion = respuesta.trim();

      if (!motivoRepeticion) {
        setError(
          "Indique el motivo del registro similar."
        );

        return;
      }
    }

    await iniciar(
      "GUARDAR",
      {
        ...formulario,
        tipo: tipoInicial,
        sede: sedeSesion,
        detalles,

        ...(confirmarDuplicado
          ? {
              confirmarPosibleDuplicado: true,
              motivoRepeticion
            }
          : {})
      }
    );
  }

  // ==========================================
  // CONSULTAR DETALLE
  // ==========================================
  async function verDocumento(id) {
    if (
      ocupadoRef.current ||
      procesando
    ) {
      return;
    }

    ocupadoRef.current = true;

    setProcesando(true);
    setError("");

    try {
      const datos =
        await obtenerDocumentoInventario(id);

      setDetalle(datos.documento);
      setObservacionRevision("");
    } catch (e) {
      setError(e.message);
    } finally {
      ocupadoRef.current = false;
      setProcesando(false);
    }
  }

  // ==========================================
  // VERIFICAR O REABRIR
  // ==========================================
  async function revisar(accion) {
    if (
      bloqueado ||
      !detalle ||
      !esAdministrador
    ) {
      return;
    }

    if (
      accion === "REABRIR" &&
      !observacionRevision.trim()
    ) {
      setError(
        "Indique el motivo de reapertura " +
        "en la observación de revisión."
      );

      return;
    }

    const pregunta =
      accion === "VERIFICAR"
        ? "¿Verificar"
        : "¿Reabrir";

    if (
      !window.confirm(
        `${pregunta} el documento ${detalle.referencia}?`
      )
    ) {
      return;
    }

    await iniciar(
      "REVISAR",
      {
        accion,
        observacion: observacionRevision.trim(),
        versionEsperada: detalle.__v
      },
      detalle._id
    );
  }

  // ==========================================
  // ELIMINAR DOCUMENTO COMPLETO
  // ==========================================
  async function eliminar() {
    if (
      bloqueado ||
      !detalle ||
      detalle.estado !== "PENDIENTE"
    ) {
      return;
    }

    const motivo = window.prompt(
      "Indique por qué elimina el documento completo " +
      `${detalle.referencia}:`
    );

    if (motivo === null) return;

    if (!motivo.trim()) {
      setError(
        "Indique el motivo de eliminación."
      );

      return;
    }

    if (
      !window.confirm(
        "Se eliminará el documento y todos " +
        "sus movimientos. ¿Continuar?"
      )
    ) {
      return;
    }

    await iniciar(
      "ELIMINAR",
      {
        motivoEliminacion: motivo.trim(),
        versionEsperada: detalle.__v
      },
      detalle._id
    );
  }
    // ==========================================
  // PANTALLA
  // ==========================================
  return (
    <div>
      <Encabezado sede={sedeSesion} />

      <div
        style={{
          padding: "20px",
          maxWidth: "1400px",
          margin: "0 auto"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: esMonasterio
              ? colorPrincipal
              : "black"
          }}
        >
          {modoRevision
            ? "REVISIÓN DE ENTRADAS Y SALIDAS"
            : tipoInicial === "ENTRADA"
              ? "REGISTRAR ENTRADA"
              : "REGISTRAR SALIDA"}
        </h2>

        {cargando && (
          <p style={{ textAlign: "center" }}>
            Cargando, por favor espere...
          </p>
        )}

        {mensaje && (
          <p
            role="status"
            style={{
              padding: "10px",
              background: "#EDF6EE",
              color: "#245335"
            }}
          >
            {mensaje}
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{
              color: "#A62020",
              whiteSpace: "pre-wrap",
              padding: "10px",
              border: "1px solid #E0BABA"
            }}
          >
            {error}
          </p>
        )}

        {pendiente && (
          <div
            style={{
              border: "1px solid #B8862D",
              padding: "12px",
              background: "#FFF8E9",
              marginBottom: "15px"
            }}
          >
            <p>
              Hay una solicitud pendiente de confirmar:
              {" "}{pendiente.accion}.
              {" "}El reintento conserva su identificador
              y sus datos.
            </p>

            <button
              type="button"
              style={boton}
              disabled={procesando}
              onClick={() => ejecutar(pendiente)}
            >
              REINTENTAR LA MISMA SOLICITUD
            </button>
          </div>
        )}

        {modoRevision &&
          opciones &&
          !esAdministrador && (
            <p>
              Esta pantalla de revisión corresponde
              al administrador.
            </p>
          )}

        {!modoRevision && opciones && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "25px"
            }}
          >
            <fieldset
              disabled={bloqueado}
              style={{
                border: 0,
                padding: 0,
                minWidth: 0
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                  marginBottom: "15px"
                }}
              >
                <label>
                  Fecha:{" "}
                  <input
                    type="date"
                    max={hoy}
                    value={formulario.fecha}
                    onChange={e =>
                      cambiarFormulario(
                        "fecha",
                        e.target.value
                      )
                    }
                    style={campo}
                  />
                </label>

                <label>
                  Motivo:{" "}
                  <select
                    value={formulario.motivo}
                    onChange={e =>
                      cambiarFormulario(
                        "motivo",
                        e.target.value
                      )
                    }
                    style={campo}
                  >
                    <option value="">
                      Seleccione motivo
                    </option>

                    {(
                      opciones.motivos?.[tipoInicial] || []
                    )
                      .filter(
                        motivo =>
                          motivo !== "AJUSTE" ||
                          esAdministrador
                      )
                      .map(motivo => (
                        <option
                          key={motivo}
                          value={motivo}
                        >
                          {motivo}
                        </option>
                      ))}
                  </select>
                </label>

                <span>
                  Referencia: automática al guardar
                </span>
              </div>

              <label>
                Observaciones

                <textarea
                  maxLength={2000}
                  value={formulario.observaciones}
                  onChange={e =>
                    cambiarFormulario(
                      "observaciones",
                      e.target.value
                    )
                  }
                  style={{
                    ...campo,
                    display: "block",
                    width: "100%",
                    minHeight: "60px",
                    margin: "6px 0 15px"
                  }}
                />
              </label>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    minWidth: "780px"
                  }}
                >
                  <thead
                    style={{
                      background: colorTabla
                    }}
                  >
                    <tr>
                      {[
                        "Categoría",
                        "Código",
                        "Producto",
                        "Unidad",
                        "Cantidad",
                        "Quitar"
                      ].map(titulo => (
                        <th
                          key={titulo}
                          style={celda}
                        >
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filas.map((fila, indice) => {
                      const producto = productos.find(
                        p => p._id === fila.productoId
                      );

                      return (
                        <tr key={indice}>
                          <td style={celda}>
                            <select
                              style={{
                                ...campo,
                                width: "100%"
                              }}
                              value={fila.categoria}
                              onChange={e =>
                                cambiarFila(
                                  indice,
                                  "categoria",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">
                                Seleccione
                              </option>

                              {categorias.map(categoria => (
                                <option
                                  key={
                                    categoria._id ||
                                    categoria.codigo
                                  }
                                  value={categoria.codigo}
                                >
                                  {categoria.descripcion ||
                                    categoria.codigo}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td
                            style={{
                              ...celda,
                              textAlign: "center",
                              width: "75px"
                            }}
                          >
                            {producto?.codigo ?? ""}
                          </td>

                          <td style={celda}>
                            <select
                              style={{
                                ...campo,
                                width: "100%"
                              }}
                              value={fila.productoId}
                              onChange={e =>
                                cambiarFila(
                                  indice,
                                  "productoId",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">
                                Seleccione producto
                              </option>

                              {productos
                                .filter(
                                  p =>
                                    p.categoria ===
                                    fila.categoria
                                )
                                .map(p => (
                                  <option
                                    key={p._id}
                                    value={p._id}
                                  >
                                    {p.descripcion}
                                  </option>
                                ))}
                            </select>
                          </td>

                          <td style={celda}>
                            {producto?.medida || ""}
                          </td>

                          <td
                            style={{
                              ...celda,
                              width: "110px"
                            }}
                          >
                            <input
                              aria-label={
                                `Cantidad del artículo ${indice + 1}`
                              }
                              inputMode="decimal"
                              value={fila.cantidad}
                              onChange={e =>
                                cambiarFila(
                                  indice,
                                  "cantidad",
                                  e.target.value
                                )
                              }
                              style={{
                                ...campo,
                                width: "100%"
                              }}
                            />
                          </td>

                          <td
                            style={{
                              ...celda,
                              textAlign: "center",
                              width: "55px"
                            }}
                          >
                            <button
                              type="button"
                              title="Quitar artículo"
                              disabled={filas.length === 1}
                              onClick={() => {
                                setFilas(actual =>
                                  actual.filter(
                                    (_, i) => i !== indice
                                  )
                                );

                                setPosibleDuplicado(false);
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "15px" }}>
                <button
                  type="button"
                  style={boton}
                  disabled={filas.length >= 200}
                  onClick={() => {
                    setFilas(actual => [
                      ...actual,
                      filaVacia()
                    ]);

                    setPosibleDuplicado(false);
                  }}
                >
                  AGREGAR ARTÍCULO
                </button>

                <button
                  type="button"
                  style={boton}
                  onClick={() => guardar(false)}
                >
                  {procesando
                    ? "PROCESANDO..."
                    : tipoInicial === "ENTRADA"
                      ? "GUARDAR ENTRADA"
                      : "GUARDAR SALIDA"}
                </button>

                {posibleDuplicado && (
                  <button
                    type="button"
                    style={{
                      ...boton,
                      background: "#B8862D"
                    }}
                    onClick={() => guardar(true)}
                  >
                    CONFIRMAR REGISTRO SIMILAR
                  </button>
                )}
              </div>
            </fieldset>

            <p>
              Estado al guardar:{" "}
              <strong>PENDIENTE DE REVISIÓN</strong>.
              {" "}Las compras, los envíos, los huevos
              y la producción con seguimiento por lote
              se registran desde sus módulos.
            </p>
          </div>
        )}
                {/* LISTADO Y REVISIÓN */}
        {opciones &&
          (!modoRevision || esAdministrador) && (
            <>
              <h3 style={{ textAlign: "center" }}>
                DOCUMENTOS REGISTRADOS
              </h3>

              <form
                onSubmit={buscarDocumentos}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "15px"
                }}
              >
                <fieldset
                  disabled={procesando}
                  style={{
                    border: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                    padding: 0
                  }}
                >
                  <label>
                    Desde:{" "}
                    <input
                      type="date"
                      required
                      value={filtros.desde}
                      onChange={e =>
                        setFiltros(actual => ({
                          ...actual,
                          desde: e.target.value
                        }))
                      }
                      style={campo}
                    />
                  </label>

                  <label>
                    Hasta:{" "}
                    <input
                      type="date"
                      required
                      value={filtros.hasta}
                      onChange={e =>
                        setFiltros(actual => ({
                          ...actual,
                          hasta: e.target.value
                        }))
                      }
                      style={campo}
                    />
                  </label>

                  {modoRevision && (
                    <label>
                      Sede:{" "}
                      <select
                        value={sedeConsulta}
                        onChange={e =>
                          setSedeConsulta(e.target.value)
                        }
                        style={campo}
                      >
                        <option value="TIENDITA">
                          TIENDITA
                        </option>
                        <option value="MONASTERIO">
                          MONASTERIO
                        </option>
                      </select>
                    </label>
                  )}

                  <label>
                    Tipo:{" "}
                    <select
                      value={filtros.tipo}
                      onChange={e =>
                        setFiltros(actual => ({
                          ...actual,
                          tipo: e.target.value
                        }))
                      }
                      style={campo}
                    >
                      <option value="TODOS">TODOS</option>
                      <option value="ENTRADA">ENTRADA</option>
                      <option value="SALIDA">SALIDA</option>
                    </select>
                  </label>

                  <label>
                    Estado:{" "}
                    <select
                      value={filtros.estado}
                      onChange={e =>
                        setFiltros(actual => ({
                          ...actual,
                          estado: e.target.value
                        }))
                      }
                      style={campo}
                    >
                      <option value="TODOS">TODOS</option>
                      <option value="PENDIENTE">
                        PENDIENTES
                      </option>
                      <option value="VERIFICADO">
                        VERIFICADOS
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    style={boton}
                  >
                    BUSCAR
                  </button>
                </fieldset>
              </form>

              {cargandoLista ? (
                <p>Consultando documentos...</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%"
                    }}
                  >
                    <thead
                      style={{ background: colorTabla }}
                    >
                      <tr>
                        {[
                          "Documento",
                          "Fecha",
                          "Tipo",
                          "Artículos",
                          "Registrado por",
                          "Estado",
                          "Acción"
                        ].map(titulo => (
                          <th
                            key={titulo}
                            style={celda}
                          >
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {documentos.map(doc => (
                        <tr key={doc._id}>
                          <td style={celda}>
                            {doc.referencia}
                          </td>

                          <td style={celda}>
                            {mostrarFecha(doc.fecha)}
                          </td>

                          <td style={celda}>
                            {doc.tipo}
                          </td>

                          <td style={celda}>
                            {doc.detalles?.length || 0}
                          </td>

                          <td style={celda}>
                            {nombreUsuario(doc.registradoPor)}
                          </td>

                          <td style={celda}>
                            {doc.estado}
                          </td>

                          <td style={celda}>
                            <button
                              type="button"
                              style={boton}
                              disabled={procesando}
                              onClick={() =>
                                verDocumento(doc._id)
                              }
                            >
                              VER DETALLE
                            </button>
                          </td>
                        </tr>
                      ))}

                      {documentos.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={celda}
                          >
                            No hay documentos para estos filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div
                style={{
                  textAlign: "center",
                  margin: "12px"
                }}
              >
                <button
                  type="button"
                  disabled={
                    procesando ||
                    cargandoLista ||
                    pagina <= 1
                  }
                  onClick={() =>
                    setPagina(valor => valor - 1)
                  }
                  style={boton}
                >
                  ANTERIOR
                </button>

                <span>
                  Página {pagina} de {totalPaginas}
                </span>

                <button
                  type="button"
                  disabled={
                    procesando ||
                    cargandoLista ||
                    pagina >= totalPaginas
                  }
                  onClick={() =>
                    setPagina(valor => valor + 1)
                  }
                  style={boton}
                >
                  SIGUIENTE
                </button>
              </div>

              {detalle && (
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "15px",
                    borderRadius: "8px",
                    marginTop: "20px"
                  }}
                >
                  <h3
                    style={{
                      background: colorTabla,
                      padding: "10px"
                    }}
                  >
                    {detalle.referencia}
                    {" · "}{detalle.tipo}
                    {" · "}{detalle.sede}
                  </h3>

                  <p>
                    Fecha: {mostrarFecha(detalle.fecha)}
                    {" · "}Motivo: {detalle.motivo}
                    {" · "}Estado:{" "}
                    <strong>{detalle.estado}</strong>
                  </p>

                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {detalle.observaciones}
                  </p>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse"
                      }}
                    >
                      <thead
                        style={{ background: colorTabla }}
                      >
                        <tr>
                          {[
                            "Categoría",
                            "Código",
                            "Producto",
                            "Unidad",
                            "Cantidad"
                          ].map(titulo => (
                            <th
                              key={titulo}
                              style={celda}
                            >
                              {titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {detalle.detalles.map(fila => (
                          <tr
                            key={fila._id || fila.productoId}
                          >
                            <td style={celda}>
                              {fila.categoria}
                            </td>

                            <td style={celda}>
                              {fila.codigo}
                            </td>

                            <td style={celda}>
                              {fila.descripcion}
                            </td>

                            <td style={celda}>
                              {fila.unidad}
                            </td>

                            <td style={celda}>
                              {formato(fila.cantidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p>
                    Registrado por:{" "}
                    {nombreUsuario(detalle.registradoPor)}
                  </p>

                  {detalle.estado === "VERIFICADO" && (
                    <p>
                      Verificado por:{" "}
                      {nombreUsuario(detalle.verificadoPor)}
                      {" · "}Fecha:{" "}
                      {mostrarFecha(detalle.fechaVerificacion)}
                    </p>
                  )}

                  {esAdministrador && (
                    <div style={{ marginTop: "15px" }}>
                      <label>
                        Observación de revisión / motivo
                        de reapertura:

                        <textarea
                          disabled={bloqueado}
                          maxLength={2000}
                          value={observacionRevision}
                          onChange={e =>
                            setObservacionRevision(
                              e.target.value
                            )
                          }
                          style={{
                            ...campo,
                            display: "block",
                            width: "100%",
                            minHeight: "60px"
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={bloqueado}
                        style={boton}
                        onClick={() =>
                          revisar(
                            detalle.estado === "VERIFICADO"
                              ? "REABRIR"
                              : "VERIFICAR"
                          )
                        }
                      >
                        {detalle.estado === "VERIFICADO"
                          ? "REABRIR DOCUMENTO"
                          : "VERIFICAR DOCUMENTO"}
                      </button>
                    </div>
                  )}

                  {detalle.estado === "PENDIENTE" &&
                    (
                      esAdministrador ||
                      localStorage.getItem("rolUsuario") ===
                        "SUPERVISOR"
                    ) && (
                      <button
                        type="button"
                        disabled={bloqueado}
                        style={{
                          ...boton,
                          background: "#A64242"
                        }}
                        onClick={eliminar}
                      >
                        ELIMINAR DOCUMENTO COMPLETO
                      </button>
                    )}

                  {detalle.historialRevision?.length > 0 && (
                    <div>
                      <h4>Historial de revisión</h4>

                      <ul>
                        {detalle.historialRevision.map(
                          (registro, indice) => (
                            <li key={indice}>
                              {mostrarFecha(registro.fecha)}
                              {" · "}{registro.accion}
                              {" · "}
                              {nombreUsuario(registro.usuarioId)}
                              :{" "}
                              {registro.observacion ||
                                "Sin observación"}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        <div
          style={{
            textAlign: "center",
            margin: "20px 0"
          }}
        >
          <button
            type="button"
            disabled={procesando}
            style={{
              ...boton,
              background: colorPrincipal
            }}
            onClick={() =>
              navigate(
                sedeSesion === "MONASTERIO"
                  ? "/menu-monasterio"
                  : "/menu"
              )
            }
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  );
}