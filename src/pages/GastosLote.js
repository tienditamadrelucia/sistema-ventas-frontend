import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";
import Encabezado from "../components/Encabezado";
import NuevoGastoLote from "../components/NuevoGastoLote";
import VincularGastoLote from "../components/VincularGastoLote";
import {
  obtenerGastosLoteCrianza
} from "../services/lotesCrianza";

const boton = {
  padding: "10px 17px",
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
  padding: "9px",
  textAlign: "left"
};

const monedas = {
  D: "USD",
  P: "COP",
  Bs: "Bs"
};

function dinero(valor) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fechaTexto(fecha) {
  return String(fecha || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");
}

export default function GastosLote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const consultaRef = useRef(0);

  const [datos, setDatos] = useState(null);
  const [vista, setVista] = useState("NUEVO");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    const consulta = ++consultaRef.current;

    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerGastosLoteCrianza(id);

      if (
        !Array.isArray(respuesta.gastos) ||
        !Array.isArray(respuesta.conceptos) ||
        !respuesta.lote ||
        !respuesta.totales
      ) {
        throw new Error(
          "La respuesta de gastos no tiene el formato esperado."
        );
      }

      if (consulta === consultaRef.current) {
        setDatos(respuesta);
      }
    } catch (fallo) {
      if (consulta === consultaRef.current) {
        setDatos(null);
        setError(fallo.message);
      }

      throw fallo;
    } finally {
      if (consulta === consultaRef.current) {
        setCargando(false);
      }
    }
  }, [id]);

  useEffect(() => {
    cargar().catch(() => {});

    return () => {
      consultaRef.current += 1;
    };
  }, [cargar]);

  async function despuesDeGuardar() {
    setMensaje(
      "La operación quedó confirmada. Actualizando la consulta..."
    );

    await cargar();

    setMensaje(
      "La operación quedó confirmada y los totales están actualizados."
    );
  }

  const nombreConcepto = (codigo) =>
    datos?.conceptos.find(
      (concepto) => concepto.codigo === codigo
    )?.nombre || codigo;

  function volverAlMenu() {
    const sede = localStorage.getItem("sede");

    navigate(
      sede === "TIENDITA"
        ? "/menu"
        : "/menu-monasterio"
    );
  }

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
          GASTOS DEL LOTE DE POLLOS
        </h2>

        {datos && (
          <h3 style={{ textAlign: "center" }}>
            Destino: MONASTERIO · Lote: {datos.lote.nombre}
          </h3>
        )}

        <p style={{ textAlign: "center" }}>
          El gasto se registra una sola vez en la sede que paga.
        </p>

        {mensaje && (
          <p
            role="status"
            style={{ color: "#286140", textAlign: "center" }}
          >
            {mensaje}
          </p>
        )}

        {error && (
          <div
            role="alert"
            style={{ color: "#b00020", textAlign: "center" }}
          >
            <p>{error}</p>

            <button
              type="button"
              style={boton}
              disabled={cargando}
              onClick={() => cargar().catch(() => {})}
            >
              REINTENTAR CONSULTA
            </button>
          </div>
        )}

        {cargando && (
          <p style={{ textAlign: "center" }}>
            Consultando gastos del lote...
          </p>
        )}

        {datos && !cargando && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "12px",
                margin: "20px 0"
              }}
            >
              <button
                type="button"
                onClick={() => setVista("NUEVO")}
                style={{
                  ...boton,
                  backgroundColor:
                    vista === "NUEVO" ? "#5A2D16" : "#B8862D"
                }}
              >
                REGISTRAR GASTO NUEVO
              </button>

              <button
                type="button"
                onClick={() => setVista("VINCULAR")}
                style={{
                  ...boton,
                  backgroundColor:
                    vista === "VINCULAR" ? "#5A2D16" : "#B8862D"
                }}
              >
                VINCULAR GASTO EXISTENTE
              </button>
            </div>

            {vista === "NUEVO" ? (
              <NuevoGastoLote
                key={`nuevo-${id}`}
                loteId={id}
                conceptos={datos.conceptos}
                onGuardado={despuesDeGuardar}
              />
            ) : (
              <VincularGastoLote
                key={`vincular-${id}`}
                loteId={id}
                fechaInicio={datos.lote.fechaInicio}
                conceptos={datos.conceptos}
                onGuardado={despuesDeGuardar}
              />
            )}

            <section style={{ marginTop: "25px" }}>
              <h3
                style={{
                  backgroundColor: "#E8D1A5",
                  padding: "12px",
                  marginBottom: 0
                }}
              >
                Gastos vinculados al lote
              </h3>

              {datos.gastos.length === 0 ? (
                <p>
                  Este lote todavía no tiene gastos asignados.
                </p>
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
                        <th style={celda}>Pagado por</th>
                        <th style={celda}>Concepto</th>
                        <th style={celda}>Descripción</th>
                        <th style={celda}>Moneda</th>
                        <th style={celda}>Asignado al lote</th>
                      </tr>
                    </thead>

                    <tbody>
                      {datos.gastos.map((gasto) => (
                        <tr key={gasto.gastoId}>
                          <td style={celda}>
                            {fechaTexto(gasto.fecha)}
                          </td>
                          <td style={celda}>
                            {gasto.sedePagadora}
                          </td>
                          <td style={celda}>
                            {nombreConcepto(gasto.concepto)}
                          </td>
                          <td style={celda}>
                            {gasto.descripcion}
                          </td>
                          <td style={celda}>
                            {monedas[gasto.moneda] || gasto.moneda}
                          </td>
                          <td
                            style={{
                              ...celda,
                              textAlign: "right"
                            }}
                          >
                            {dinero(gasto.montoAsignado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p
                style={{
                  backgroundColor: "#E8D1A5",
                  padding: "14px",
                  fontWeight: "bold"
                }}
              >
                Total del lote:{" "}
                USD {dinero(datos.totales.D)}
                {" · "}
                COP {dinero(datos.totales.P)}
                {" · "}
                Bs {dinero(datos.totales.Bs)}
              </p>

              <p>
                El total incluye lo pagado por ambas sedes.
                En gastos compartidos se suma únicamente
                el importe asignado a este lote.
              </p>
            </section>
          </>
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
            style={{ ...boton, backgroundColor: "#888" }}
            onClick={() =>
              navigate(`/lotes-crianza/${id}`)
            }
          >
            VOLVER AL LOTE
          </button>

          <button
            type="button"
            style={{ ...boton, backgroundColor: "#5A2D16" }}
            onClick={volverAlMenu}
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </main>
    </div>
  );
}