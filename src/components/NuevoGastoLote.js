import React, {
  useEffect,
  useRef,
  useState
} from "react";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";
import {
  crearGastoLoteCrianza
} from "../services/lotesCrianza";

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
  padding: "10px 18px",
  backgroundColor: "#B8862D",
  color: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontFamily: "Arial",
  fontWeight: "bold",
  cursor: "pointer"
};

function formularioInicial() {
  return {
    fecha: obtenerFechaVenezuela().slice(0, 10),
    sede: "TIENDITA",
    concepto: "",
    descripcion: "",
    moneda: "D",
    monto: "",
    montoAsignado: "",
    actividadProductiva: "",
    numeroRecibo: "",
    cajaChica: false,
    compartido: false
  };
}

function validarImporte(valor, nombre) {
  const numero = Number(valor);
  const centavos = Math.round(numero * 100);

  if (
    !Number.isFinite(numero) ||
    numero <= 0 ||
    !Number.isSafeInteger(centavos) ||
    Math.abs(numero * 100 - centavos) >= 0.000001
  ) {
    throw new Error(
      `${nombre} debe ser mayor que cero y tener hasta dos decimales.`
    );
  }

  return centavos / 100;
}

export default function NuevoGastoLote({
  loteId,
  conceptos = [],
  onGuardado
}) {
  const ocupadoRef = useRef(false);

  const clavePendiente =
    `nuevoGastoLote:${
      localStorage.getItem("usuarioNombre") || ""
    }:${loteId}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const datos = JSON.parse(
        sessionStorage.getItem(clavePendiente) || "null"
      );

      return (
        datos &&
        typeof datos.claveOperacion === "string" &&
        typeof datos.fecha === "string" &&
        ["TIENDITA", "MONASTERIO"].includes(datos.sede) &&
        Number.isFinite(datos.monto) &&
        Number.isFinite(datos.montoAsignado)
      )
        ? datos
        : null;
    } catch {
      return null;
    }
  });

  const [formulario, setFormulario] = useState(() =>
    pendiente
      ? {
          ...formularioInicial(),
          ...pendiente,
          compartido:
            pendiente.montoAsignado !== pendiente.monto
        }
      : formularioInicial()
  );

  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarActividades() {
      try {
        const res = await fetch(
          `${API_URL}/api/actividad-productiva`,
          { credentials: "include" }
        );

        const datos = await res.json();

        if (!res.ok || !Array.isArray(datos)) {
          throw new Error(
            datos?.mensaje ||
            "No se pudieron consultar las actividades productivas."
          );
        }

        if (activo) {
          setActividades(
            datos
              .filter((actividad) => actividad.activa !== false)
              .sort((a, b) =>
                String(a.descripcion).localeCompare(
                  String(b.descripcion),
                  "es",
                  { sensitivity: "base" }
                )
              )
          );
        }
      } catch (fallo) {
        if (activo) setError(fallo.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarActividades();

    return () => {
      activo = false;
    };
  }, []);

  function cambiar(e) {
    const { name, value, type, checked } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value
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

    if (ocupadoRef.current) return;

    let solicitud = pendiente;

    if (!solicitud) {
      try {
        const monto = validarImporte(
          formulario.monto,
          "El monto del gasto"
        );

        const montoAsignado = formulario.compartido
          ? validarImporte(
              formulario.montoAsignado,
              "El importe para este lote"
            )
          : monto;

        if (
          Math.round(montoAsignado * 100) >
          Math.round(monto * 100)
        ) {
          throw new Error(
            "El importe para el lote no puede superar el gasto."
          );
        }

        if (
          !conceptos.some(
            (concepto) =>
              concepto.codigo === formulario.concepto
          ) ||
          !actividades.some(
            (actividad) =>
              actividad._id === formulario.actividadProductiva
          ) ||
          !formulario.descripcion.trim()
        ) {
          throw new Error(
            "Complete el concepto, la actividad y la descripción."
          );
        }

        solicitud = {
          fecha: formulario.fecha,
          sede: formulario.sede,
          concepto: formulario.concepto,
          descripcion: formulario.descripcion.trim(),
          moneda: formulario.moneda,
          monto,
          montoAsignado,
          actividadProductiva:
            formulario.actividadProductiva,
          numeroRecibo: formulario.numeroRecibo.trim(),
          cajaChica: formulario.cajaChica,
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
    setMensaje("");

    let guardado = false;

    try {
      const respuesta = await crearGastoLoteCrianza(
        loteId,
        solicitud
      );

      borrarPendiente();
      setFormulario(formularioInicial());
      setMensaje(respuesta.mensaje);
      guardado = true;
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

    if (guardado && onGuardado) {
      try {
        await onGuardado();
      } catch {
        setMensaje(
          "El gasto quedó registrado. Actualice la consulta para ver los totales."
        );
      }
    }
  }

  return (
    <form
      onSubmit={guardar}
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <h3
        style={{
          margin: 0,
          padding: "12px",
          backgroundColor: "#E8D1A5"
        }}
      >
        Nuevo gasto del lote
      </h3>

      <div style={{ padding: "18px" }}>
        {cargando && <p>Cargando actividades...</p>}

        <fieldset
          disabled={
            cargando ||
            guardando ||
            Boolean(pendiente)
          }
          style={{
            padding: 0,
            margin: 0,
            border: "none",
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
              Sede que paga
              <select
                style={campo}
                name="sede"
                value={formulario.sede}
                onChange={cambiar}
              >
                <option value="TIENDITA">TIENDITA</option>
                <option value="MONASTERIO">MONASTERIO</option>
              </select>
            </label>

            <label>
              Sede de producción
              <input
                style={campo}
                value="MONASTERIO"
                readOnly
              />
            </label>

            <label>
              Fecha
              <input
                style={campo}
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={cambiar}
                max={obtenerFechaVenezuela().slice(0, 10)}
                required
              />
            </label>

            <label>
              Concepto del lote
              <select
                style={campo}
                name="concepto"
                value={formulario.concepto}
                onChange={cambiar}
                required
              >
                <option value="">Seleccione</option>
                {conceptos.map((concepto) => (
                  <option
                    key={concepto.codigo}
                    value={concepto.codigo}
                  >
                    {concepto.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Actividad productiva
              <select
                style={campo}
                name="actividadProductiva"
                value={formulario.actividadProductiva}
                onChange={cambiar}
                required
              >
                <option value="">Seleccione la actividad</option>
                {actividades.map((actividad) => (
                  <option
                    key={actividad._id}
                    value={actividad._id}
                  >
                    {actividad.descripcion}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Moneda
              <select
                style={campo}
                name="moneda"
                value={formulario.moneda}
                onChange={cambiar}
              >
                <option value="D">Dólares (USD)</option>
                <option value="P">Pesos (COP)</option>
                <option value="Bs">Bolívares (Bs)</option>
              </select>
            </label>

            <label>
              Monto total del gasto
              <input
                style={campo}
                type="number"
                name="monto"
                min="0.01"
                step="0.01"
                value={formulario.monto}
                onChange={cambiar}
                required
              />
            </label>

            <label>
              Recibo o factura (opcional)
              <input
                style={campo}
                name="numeroRecibo"
                value={formulario.numeroRecibo}
                onChange={cambiar}
                maxLength={100}
              />
            </label>
          </div>

          <label
            style={{
              display: "block",
              marginTop: "16px"
            }}
          >
            Descripción
            <input
              style={campo}
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiar}
              maxLength={500}
              required
            />
          </label>

          <label
            style={{
              display: "block",
              marginTop: "16px"
            }}
          >
            <input
              type="checkbox"
              name="cajaChica"
              checked={formulario.cajaChica}
              onChange={cambiar}
            />{" "}
            Salió de caja chica de {formulario.sede}
          </label>

          <label
            style={{
              display: "block",
              marginTop: "14px"
            }}
          >
            <input
              type="checkbox"
              name="compartido"
              checked={formulario.compartido}
              onChange={cambiar}
            />{" "}
            Sólo una parte del gasto corresponde a este lote
          </label>

          {formulario.compartido && (
            <label
              style={{
                display: "block",
                maxWidth: "300px",
                marginTop: "12px"
              }}
            >
              Importe para este lote ({formulario.moneda})
              <input
                style={campo}
                type="number"
                name="montoAsignado"
                min="0.01"
                step="0.01"
                max={formulario.monto || undefined}
                value={formulario.montoAsignado}
                onChange={cambiar}
                required
              />
            </label>
          )}

          <p>
            Clasificación: <strong>COSTO DE PRODUCCIÓN</strong>.
            El pago se registra en {formulario.sede}.
          </p>
        </fieldset>

        {error && (
          <p role="alert" style={{ color: "#b00020" }}>
            {error}
          </p>
        )}

        {mensaje && (
          <p role="status" style={{ color: "#286140" }}>
            {mensaje}
          </p>
        )}

        {pendiente && !guardando && (
          <p>
            Hay una solicitud pendiente de confirmar.
            El reintento conserva el mismo identificador.
          </p>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            type="submit"
            style={boton}
            disabled={
              guardando ||
              (!pendiente && (
                cargando ||
                actividades.length === 0 ||
                conceptos.length === 0
              ))
            }
          >
            {guardando
              ? "PROCESANDO..."
              : pendiente
                ? "REINTENTAR EL MISMO GASTO"
                : "GUARDAR GASTO"}
          </button>
        </div>
      </div>
    </form>
  );
}