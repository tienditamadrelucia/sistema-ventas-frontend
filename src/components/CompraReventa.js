import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import { crearCompraReventa } from "../services/ser_gastos";

const lineaVacia = () => ({
  categoria: "",
  productoId: "",
  cantidad: "",
  costoUnitarioMoneda: ""
});

const dinero = (valor) =>
  Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function CompraReventa({ sede, onVolver }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [pendiente, setPendiente] = useState(null);
  const [guardada, setGuardada] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const [datos, setDatos] = useState({
    fecha: obtenerFechaVenezuela(),
    descripcion: "COMPRA PARA REVENTA",
    moneda: "D",
    tasaCambio: "1",
    numeroRecibo: "",
    cajaChica: false
  });

  const [lineas, setLineas] = useState([lineaVacia()]);

  const enviandoRef = useRef(false);
  const operacionRef = useRef(null);

  useEffect(() => {
  let activo = true;

  const cargar = async () => {
    setCargando(true);
    setErrorCarga("");

    try {
      const [resProductos, resCategorias] = await Promise.all([
        fetch(
          `${API_URL}/api/productos?sede=${encodeURIComponent(sede)}`,
          { credentials: "include" }
        ),
        fetch(
          `${API_URL}/api/categorias`,
          { credentials: "include" }
        )
      ]);

      const [datosProductos, datosCategorias] = await Promise.all([
        resProductos.json(),
        resCategorias.json()
      ]);

      const listaCategorias = Array.isArray(datosCategorias)
        ? datosCategorias
        : datosCategorias?.categorias;

      if (!resProductos.ok || !Array.isArray(datosProductos)) {
        throw new Error(
          datosProductos?.mensaje ||
          "No se pudieron cargar los productos."
        );
      }

      if (!resCategorias.ok || !Array.isArray(listaCategorias)) {
        throw new Error(
          datosCategorias?.mensaje ||
          "No se pudieron cargar las categorías."
        );
      }

      if (activo) {
        const compararNombre = (a, b) =>
          String(a.descripcion || "").localeCompare(
            String(b.descripcion || ""),
            "es",
            {
              sensitivity: "base",
              numeric: true
            }
          );

        setProductos(
          datosProductos
            .filter(
              (p) => (p.origen || "COMPRADO") === "COMPRADO"
            )
            .sort(compararNombre)
        );

        setCategorias(
          [...listaCategorias].sort(compararNombre)
        );
      }
    } catch (error) {
      if (activo) {
        setErrorCarga(error.message);
      }
    } finally {
      if (activo) {
        setCargando(false);
      }
    }
  };

  cargar();

  return () => {
    activo = false;
  };
}, [sede]);

  const cambiarDato = (e) => {
    const { name, value, type, checked } = e.target;

    setDatos((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "moneda"
        ? { tasaCambio: value === "D" ? "1" : "" }
        : {})
    }));
  };

  const cambiarLinea = (indice, campo, valor) => {
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === indice
          ? { ...linea, [campo]: valor }
          : linea
      )
    );
  };

  const cambiarCategoria = (indice, categoria) => {
  setLineas((anteriores) =>
    anteriores.map((linea, i) =>
      i === indice
        ? {
            ...linea,
            categoria,
            productoId: "",
            cantidad: "",
            costoUnitarioMoneda: ""
          }
        : linea
    )
  );
};

const productosDeCategoria = (categoria) =>
  categoria
    ? productos.filter(
        (producto) =>
          String(producto.categoria ?? "") === String(categoria)
      )
    : [];

  const subtotal = (linea) =>
    Math.round(
      (
        Number(linea.cantidad || 0) *
          Number(linea.costoUnitarioMoneda || 0) +
        Number.EPSILON
      ) * 100
    ) / 100;

  const total = lineas.reduce(
    (suma, linea) => suma + subtotal(linea),
    0
  );

  const tasa =
    datos.moneda === "D" ? 1 : Number(datos.tasaCambio);

  const guardar = async (e) => {
    e.preventDefault();

    if (enviandoRef.current) return;

    enviandoRef.current = true;
    setGuardando(true);
    setMensaje("");

    try {
      let solicitud = pendiente;

      if (!solicitud) {
        if (!datos.fecha || !datos.descripcion.trim()) {
          throw new Error("Complete la fecha y la descripción.");
        }

        if (!Number.isFinite(tasa) || tasa <= 0) {
          throw new Error("Indique una tasa mayor que cero.");
        }

        const vistos = new Set();

        const detalles = lineas.map((linea) => {
          const cantidad = Number(linea.cantidad);
          const costo = Number(linea.costoUnitarioMoneda);

          if (
            !linea.productoId ||
            !Number.isFinite(cantidad) ||
            cantidad <= 0 ||
            !Number.isFinite(costo) ||
            costo <= 0
          ) {
            throw new Error(
              "Complete producto, cantidad y costo en cada renglón."
            );
          }

          if (vistos.has(linea.productoId)) {
            throw new Error(
              "Un producto no puede aparecer dos veces."
            );
          }

          vistos.add(linea.productoId);

          return {
            productoId: linea.productoId,
            cantidad,
            costoUnitarioMoneda: costo
          };
        });

        if (!operacionRef.current) {
          operacionRef.current = window.crypto.randomUUID();
        }

        solicitud = {
          ...datos,
          sede,
          tasaCambio: tasa,
          claveOperacion: operacionRef.current,
          detalles
        };
      }

      setPendiente(solicitud);

      try {
        const respuesta = await crearCompraReventa(solicitud);

        if (!respuesta?.ok || !respuesta.gasto) {
          throw new Error(
            "El servidor no confirmó la compra. Consulte los gastos antes de iniciar otra."
          );
        }

        setGuardada(respuesta.gasto);
        setPendiente(null);
      } catch (error) {
        // Si no sabemos si se guardó, conservamos la misma
        // solicitud y el mismo identificador para reintentar.
        if (
          [400, 401, 403, 404, 422, 423].includes(error.status)
        ) {
          setPendiente(null);
        }

        throw error;
      }
    } catch (error) {
      setMensaje(
        error.message || "No se pudo guardar la compra."
      );
    } finally {
      enviandoRef.current = false;
      setGuardando(false);
    }
  };

    const bloqueado = guardando || Boolean(pendiente);

  const esMonasterio = sede === "MONASTERIO";

  const colorPrincipal = esMonasterio
    ? "#5A2D16"
    : "#FC9E9B";

  const colorAccion = esMonasterio
    ? "#B8862D"
    : "#84B09C";

  const colorTabla = esMonasterio
    ? "#E8D1A5"
    : "#F9CEAE";

  const colorSuave = esMonasterio
    ? "#F5EBDD"
    : "#fff7f7";

  const caja = {
    width: "550px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0 auto 20px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  };

  const campo = {
    width: "100%",
    padding: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  const selector = {
    ...campo,
    backgroundColor: esMonasterio ? "#E8D1A5" : "#EDC5CD"
  };

  const etiqueta = {
    display: "block",
    fontWeight: "bold",
    marginBottom: "5px"
  };

  const boton = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: colorAccion,
    color: "white",
    fontFamily: "Arial Black, Arial, sans-serif",
    cursor: "pointer",
    minWidth: "160px",
    maxWidth: "100%"
  };

  const botonVolver = {
    ...boton,
    backgroundColor: colorPrincipal
  };

  const celda = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center"
  };

  const aviso = {
    ...caja,
    backgroundColor: colorSuave,
    boxShadow: "none"
  };

  if (guardada) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Compra guardada correctamente</h2>

        <div style={caja}>
          <p>
            Se registró un gasto con sus entradas y se
            actualizaron los costos promedio.
          </p>

          <h3 style={{ color: colorAccion }}>
            Total: {dinero(guardada.monto)} {guardada.moneda}
          </h3>

          <button
            type="button"
            style={botonVolver}
            onClick={onVolver}
          >
            Volver a gastos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontWeight: "bold"
        }}
      >
        Gestión de Compras para Reventa
      </h2>

      {guardando && (
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
            zIndex: 1000
          }}
        >
          Guardando compra, por favor espere...
        </div>
      )}

      {cargando && (
        <p role="status" style={{ textAlign: "center" }}>
          Cargando categorías y productos...
        </p>
      )}

      {errorCarga && (
        <div
          role="alert"
          style={{ ...aviso, color: "#B84A4A" }}
        >
          {errorCarga}
        </div>
      )}

      {mensaje && (
        <div
          role="alert"
          style={{ ...aviso, color: "#B84A4A" }}
        >
          {mensaje}
        </div>
      )}

      {pendiente && !guardando && (
        <div role="status" style={aviso}>
          La compra está pendiente de confirmación. Reintente
          con estos mismos datos. Antes de iniciar otra compra,
          compruebe el resultado en Gastos.
        </div>
      )}

      <form onSubmit={guardar}>
        <fieldset
          disabled={
            bloqueado || cargando || Boolean(errorCarga)
          }
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            minWidth: 0
          }}
        >
          <div style={caja}>
            <h3
              style={{
                textAlign: "center",
                marginTop: 0,
                marginBottom: "20px"
              }}
            >
              Registrar Compra
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginBottom: "15px"
              }}
            >
              <div>
                <label
                  htmlFor="compra-fecha"
                  style={etiqueta}
                >
                  Fecha
                </label>

                <input
                  id="compra-fecha"
                  style={campo}
                  type="date"
                  name="fecha"
                  value={datos.fecha}
                  max={obtenerFechaVenezuela()}
                  onChange={cambiarDato}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="compra-recibo"
                  style={etiqueta}
                >
                  N° recibo o factura (opcional)
                </label>

                <input
                  id="compra-recibo"
                  style={campo}
                  name="numeroRecibo"
                  value={datos.numeroRecibo}
                  onChange={cambiarDato}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="compra-descripcion"
                style={etiqueta}
              >
                Descripción
              </label>

              <input
                id="compra-descripcion"
                style={campo}
                name="descripcion"
                value={datos.descripcion}
                onChange={cambiarDato}
                required
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="compra-moneda"
                style={etiqueta}
              >
                Moneda de la compra
              </label>

              <select
                id="compra-moneda"
                style={selector}
                name="moneda"
                value={datos.moneda}
                onChange={cambiarDato}
              >
                <option value="D">Dólares</option>
                <option value="P">Pesos</option>
                <option value="Bs">Bolívares</option>
              </select>
            </div>

            {datos.moneda !== "D" && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor="compra-tasa"
                  style={etiqueta}
                >
                  {datos.moneda === "P" ? "Pesos" : "Bolívares"}
                  {" "}por cada US$ 1
                </label>

                <input
                  id="compra-tasa"
                  style={campo}
                  type="number"
                  name="tasaCambio"
                  min="0.000001"
                  step="any"
                  value={datos.tasaCambio}
                  onChange={cambiarDato}
                  required
                />
              </div>
            )}

            <label
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontWeight: "bold"
              }}
            >
              <input
                type="checkbox"
                name="cajaChica"
                checked={datos.cajaChica}
                onChange={cambiarDato}
              />
              ¿Salió de caja chica?
            </label>
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto 20px"
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: "15px",
                fontWeight: "bold"
              }}
            >
              Productos de la Compra
            </h3>

            <p
              style={{
                textAlign: "center",
                fontSize: "14px"
              }}
            >
              Seleccione la categoría y después el producto.
              Los productos aparecen ordenados de A a Z.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse: "collapse",
                  backgroundColor: "white"
                }}
              >
                <thead
                  style={{ backgroundColor: colorTabla }}
                >
                  <tr>
                    <th
                      style={{ ...celda, width: "180px" }}
                    >
                      Categoría
                    </th>
                    <th style={celda}>Producto</th>
                    <th
                      style={{ ...celda, width: "100px" }}
                    >
                      Cantidad
                    </th>
                    <th
                      style={{ ...celda, width: "150px" }}
                    >
                      Costo por unidad ({datos.moneda})
                    </th>
                    <th
                      style={{ ...celda, width: "120px" }}
                    >
                      Subtotal ({datos.moneda})
                    </th>
                    <th
                      style={{ ...celda, width: "40px" }}
                    >
                      Quitar
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lineas.map((linea, indice) => (
                    <tr key={indice}>
                      <td style={celda}>
                        <select
                          style={selector}
                          value={linea.categoria}
                          aria-label={`Categoría ${indice + 1}`}
                          onChange={(e) =>
                            cambiarCategoria(
                              indice,
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Seleccione categoría
                          </option>

                          {categorias.map((categoria) => (
                            <option
                              key={categoria._id}
                              value={String(categoria.codigo)}
                            >
                              {categoria.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={celda}>
                        <select
                          style={selector}
                          value={linea.productoId}
                          disabled={!linea.categoria}
                          aria-label={`Producto ${indice + 1}`}
                          onChange={(e) =>
                            cambiarLinea(
                              indice,
                              "productoId",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Seleccione un producto
                          </option>

                          {productosDeCategoria(
                            linea.categoria
                          ).map((producto) => (
                            <option
                              key={producto._id}
                              value={producto._id}
                              disabled={lineas.some(
                                (otra, i) =>
                                  i !== indice &&
                                  otra.productoId === producto._id
                              )}
                            >
                              {producto.descripcion}
                              {" — "}
                              {producto.codigo}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={celda}>
                        <input
                          style={campo}
                          type="number"
                          min="0.001"
                          step="0.001"
                          aria-label={`Cantidad ${indice + 1}`}
                          value={linea.cantidad}
                          onChange={(e) =>
                            cambiarLinea(
                              indice,
                              "cantidad",
                              e.target.value
                            )
                          }
                          required
                        />
                      </td>

                      <td style={celda}>
                        <input
                          style={campo}
                          type="number"
                          min="0.000001"
                          step="0.000001"
                          aria-label={`Costo unitario ${indice + 1}`}
                          value={linea.costoUnitarioMoneda}
                          onChange={(e) =>
                            cambiarLinea(
                              indice,
                              "costoUnitarioMoneda",
                              e.target.value
                            )
                          }
                          required
                        />
                      </td>

                      <td
                        style={{
                          ...celda,
                          fontWeight: "bold"
                        }}
                      >
                        {dinero(subtotal(linea))}
                      </td>

                      <td style={celda}>
                        <button
                          type="button"
                          title="Quitar producto"
                          aria-label={`Quitar producto ${indice + 1}`}
                          disabled={lineas.length === 1}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "20px",
                            color: "#B84A4A",
                            cursor: "pointer",
                            opacity:
                              lineas.length === 1 ? 0.4 : 1
                          }}
                          onClick={() =>
                            setLineas((anteriores) =>
                              anteriores.filter(
                                (_, i) => i !== indice
                              )
                            )
                          }
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "15px"
              }}
            >
              <button
                type="button"
                style={boton}
                disabled={lineas.length >= 200}
                onClick={() =>
                  setLineas((anteriores) => [
                    ...anteriores,
                    lineaVacia()
                  ])
                }
              >
                Agregar producto
              </button>
            </div>
          </div>
        </fieldset>

        <div
          style={{
            ...caja,
            backgroundColor: colorSuave,
            textAlign: "center"
          }}
        >
          <h3 style={{ margin: "0 0 10px" }}>
            Total de la compra: {dinero(total)} {datos.moneda}
          </h3>

          {Number.isFinite(tasa) && tasa > 0 && (
            <p>
              Equivalente aproximado: US$ {dinero(total / tasa)}
            </p>
          )}

          <p style={{ fontSize: "13px" }}>
            La compra genera sus entradas automáticamente.
            Regístrela una sola vez.
          </p>

          <button
            type="submit"
            style={{
              ...boton,
              opacity:
                guardando || cargando || Boolean(errorCarga)
                  ? 0.6
                  : 1
            }}
            disabled={
              guardando || cargando || Boolean(errorCarga)
            }
          >
            {guardando
              ? "Guardando..."
              : pendiente
              ? "Reintentar la misma compra"
              : "Guardar compra"}
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "20px"
          }}
        >
          <button
            type="button"
            style={botonVolver}
            disabled={guardando}
            onClick={onVolver}
          >
            {pendiente ? "Consultar gastos" : "Volver a gastos"}
          </button>
        </div>
      </form>
    </div>
  );
}