import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import { crearCompraReventa } from "../services/ser_gastos";

const lineaVacia = () => ({
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
      try {
        const res = await fetch(
          `${API_URL}/api/productos?sede=${encodeURIComponent(sede)}`,
          { credentials: "include" }
        );

        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(
            data?.mensaje || "No se pudieron cargar los productos."
          );
        }

        if (activo) {
          setProductos(
            data.filter(
              (p) => (p.origen || "COMPRADO") === "COMPRADO"
            )
          );
        }
      } catch (error) {
        if (activo) setErrorCarga(error.message);
      } finally {
        if (activo) setCargando(false);
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

  const campo = {
    padding: "8px",
    width: "100%",
    boxSizing: "border-box"
  };

  const boton = {
    padding: "10px 18px",
    margin: "8px",
    cursor: "pointer"
  };

  if (guardada) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Compra guardada</h2>

        <p>
          Se registró un gasto con sus entradas y se
          actualizaron los costos promedio.
        </p>

        <p>
          Total: {dinero(guardada.monto)} {guardada.moneda}
        </p>

        <button
          type="button"
          style={boton}
          onClick={onVolver}
        >
          Volver a gastos
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1050px",
        margin: "auto",
        padding: "20px"
      }}
    >
      <h2>Compra de productos para reventa</h2>

      <p>
        Registre aquí la compra completa. No vuelva a ingresar
        sus productos en Entradas ni registre otro gasto por
        la misma compra.
      </p>

      {cargando && <p>Cargando productos...</p>}

      {errorCarga && (
        <p role="alert" style={{ color: "red" }}>
          {errorCarga}
        </p>
      )}

      {mensaje && (
        <p role="alert" style={{ color: "red" }}>
          {mensaje}
        </p>
      )}

      {pendiente && (
        <p>
          La compra está pendiente de confirmación. Reintente
          con estos mismos datos. Antes de iniciar otra compra,
          compruebe el resultado en Gastos.
        </p>
      )}

      <form onSubmit={guardar}>
        <fieldset
          disabled={
            bloqueado || cargando || Boolean(errorCarga)
          }
          style={{
            border: "1px solid #ccc",
            padding: "16px"
          }}
        >
          <label>
            Fecha
            <input
              style={campo}
              type="date"
              name="fecha"
              value={datos.fecha}
              max={obtenerFechaVenezuela()}
              onChange={cambiarDato}
              required
            />
          </label>

          <label>
            Descripción
            <input
              style={campo}
              name="descripcion"
              value={datos.descripcion}
              onChange={cambiarDato}
              required
            />
          </label>

          <label>
            Número de recibo o factura (opcional)
            <input
              style={campo}
              name="numeroRecibo"
              value={datos.numeroRecibo}
              onChange={cambiarDato}
            />
          </label>

          <label>
            Moneda de toda la compra
            <select
              style={campo}
              name="moneda"
              value={datos.moneda}
              onChange={cambiarDato}
            >
              <option value="D">Dólares</option>
              <option value="P">Pesos</option>
              <option value="Bs">Bolívares</option>
            </select>
          </label>

          {datos.moneda !== "D" && (
            <label>
              ¿Cuántos{" "}
              {datos.moneda === "P" ? "pesos" : "bolívares"}{" "}
              equivalen a US$ 1?
              <input
                style={campo}
                type="number"
                name="tasaCambio"
                min="0.000001"
                step="any"
                value={datos.tasaCambio}
                onChange={cambiarDato}
                required
              />
            </label>
          )}

          <p>
            <label>
              <input
                type="checkbox"
                name="cajaChica"
                checked={datos.cajaChica}
                onChange={cambiarDato}
              />
              {" "}Salió de caja chica
            </label>
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              border="1"
              cellPadding="8"
              style={{
                width: "100%",
                borderCollapse: "collapse"
              }}
            >
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Costo por unidad ({datos.moneda})</th>
                  <th>Subtotal ({datos.moneda})</th>
                  <th>Quitar</th>
                </tr>
              </thead>

              <tbody>
                {lineas.map((linea, indice) => (
                  <tr key={indice}>
                    <td>
                      <select
                        style={campo}
                        value={linea.productoId}
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

                        {productos.map((producto) => (
                          <option
                            key={producto._id}
                            value={producto._id}
                            disabled={lineas.some(
                              (otra, i) =>
                                i !== indice &&
                                otra.productoId === producto._id
                            )}
                          >
                            {producto.codigo} -{" "}
                            {producto.descripcion}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        style={campo}
                        type="number"
                        min="0.001"
                        step="0.001"
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

                    <td>
                      <input
                        style={campo}
                        type="number"
                        min="0.000001"
                        step="0.000001"
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

                    <td>{dinero(subtotal(linea))}</td>

                    <td>
                      <button
                        type="button"
                        disabled={lineas.length === 1}
                        onClick={() =>
                          setLineas((prev) =>
                            prev.filter((_, i) => i !== indice)
                          )
                        }
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            style={boton}
            disabled={lineas.length >= 200}
            onClick={() =>
              setLineas((prev) => [...prev, lineaVacia()])
            }
          >
            Agregar producto
          </button>
        </fieldset>

        <p>
          <strong>
            Total: {dinero(total)} {datos.moneda}
          </strong>
        </p>

        {Number.isFinite(tasa) && tasa > 0 && (
          <p>
            Equivalente aproximado: US$ {dinero(total / tasa)}
          </p>
        )}

        <button
          type="submit"
          style={boton}
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

        <button
          type="button"
          style={boton}
          disabled={guardando}
          onClick={onVolver}
        >
          {pendiente ? "Consultar gastos" : "Volver a gastos"}
        </button>
      </form>
    </div>
  );
}