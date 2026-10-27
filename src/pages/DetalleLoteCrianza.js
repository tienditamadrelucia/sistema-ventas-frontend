import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";
import Encabezado from "../components/Encabezado";
import {
  obtenerDetalleLoteCrianza
} from "../services/lotesCrianza";

const boton = {
  padding: "9px 16px",
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
  textAlign: "center"
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse"
};

function fechaTexto(fecha) {
  const partes = String(fecha || "")
    .slice(0, 10)
    .split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : "";
}

function kilos(valor) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function pesoJornada(jornada) {
  const gramos = jornada.detalles.reduce(
    (suma, detalle) =>
      suma + Math.round(detalle.pesoKg * 1000),
    0
  );

  return gramos / 1000;
}

export default function DetalleLoteCrianza() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [jornadaAbierta, setJornadaAbierta] = useState("");

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError("");
    setDatos(null);

    obtenerDetalleLoteCrianza(id)
      .then((respuesta) => {
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
  }, [id]);

  const jornada = datos?.producciones?.find(
    (item) => item._id === jornadaAbierta
  );

  return (
    <div>
      <Encabezado />

      <main
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          color: "#5A2D16"
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          SEGUIMIENTO DEL LOTE DE POLLOS
        </h2>

        {cargando && <p>Cargando información...</p>}

        {error && (
          <p role="alert" style={{ color: "#b00020" }}>
            {error}
          </p>
        )}

        {datos && (
          <>
            <h3 style={{ textAlign: "center" }}>
              {datos.lote.nombre} · MONASTERIO
            </h3>

            <p style={{ textAlign: "center" }}>
              Inicio: {fechaTexto(datos.lote.fechaInicio)}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                margin: "20px 0"
              }}
            >
              {[
                ["Iniciales", datos.resumen.iniciales],
                ["Bajas", datos.resumen.bajas],
                ["Procesados", datos.resumen.procesados],
                ["En crianza", datos.resumen.enCrianza]
              ].map(([titulo, cantidad]) => (
                <div
                  key={titulo}
                  style={{
                    border: "1px solid #B8862D",
                    borderRadius: "6px",
                    overflow: "hidden",
                    textAlign: "center"
                  }}
                >
                  <div
                    style={{
                      padding: "9px",
                      backgroundColor: "#E8D1A5",
                      fontWeight: "bold"
                    }}
                  >
                    {titulo}
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      fontSize: "27px",
                      fontWeight: "bold"
                    }}
                  >
                    {cantidad}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <button
                type="button"
                style={boton}
                onClick={() =>
                  navigate(`/lotes-crianza/${id}/baja`)
                }
              >
                REGISTRAR BAJA
              </button>

              <button
                type="button"
                style={boton}
                onClick={() =>
                  navigate(`/lotes-crianza/${id}/produccion`)
                }
              >
                REGISTRAR PRODUCCIÓN
              </button>
              <button
                type="button"
                style={boton}
                onClick={() =>
                  navigate(`/lotes-crianza/${id}/gastos`)
                }
              >
                GASTOS DEL LOTE
              </button>
            </div>

            <h3 style={{ marginTop: "30px" }}>
              Jornadas de producción
            </h3>

            {!datos.producciones?.length ? (
              <p>Este lote todavía no tiene producción registrada.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tabla}>
                  <thead style={{ backgroundColor: "#E8D1A5" }}>
                    <tr>
                      <th style={celda}>Fecha</th>
                      <th style={celda}>Pollos procesados</th>
                      <th style={celda}>Peso obtenido</th>
                      <th style={celda}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {datos.producciones.map((item) => (
                      <tr key={item._id}>
                        <td style={celda}>
                          {fechaTexto(item.fecha)}
                        </td>
                        <td style={celda}>
                          {item.pollosProcesados}
                        </td>
                        <td style={celda}>
                          {kilos(pesoJornada(item))} kg
                        </td>
                        <td style={celda}>
                          <button
                            type="button"
                            style={boton}
                            onClick={() =>
                              setJornadaAbierta((anterior) =>
                                anterior === item._id
                                  ? ""
                                  : item._id
                              )
                            }
                          >
                            {jornadaAbierta === item._id
                              ? "OCULTAR DETALLE"
                              : "VER DETALLE"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {jornada && (
              <section
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border: "1px solid #B8862D",
                  borderRadius: "6px"
                }}
              >
                <h3>
                  Producción del {fechaTexto(jornada.fecha)}
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table style={tabla}>
                    <thead style={{ backgroundColor: "#E8D1A5" }}>
                      <tr>
                        <th style={celda}>Código</th>
                        <th style={celda}>Producto</th>
                        <th style={celda}>Piezas / paquetes</th>
                        <th style={celda}>Peso total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jornada.detalles.map((detalle) => (
                        <tr key={detalle.productoId}>
                          <td style={celda}>
                            {detalle.codigo}
                          </td>
                          <td style={celda}>
                            {detalle.descripcion}
                          </td>
                          <td style={celda}>
                            {detalle.presentacion === "SOLO_PESO"
                              ? "—"
                              : `${detalle.cantidadPresentaciones} ${
                                  detalle.presentacion === "PAQUETE_DOS"
                                    ? "paquetes de 2"
                                    : "piezas"
                                }`}
                          </td>
                          <td style={celda}>
                            {kilos(detalle.pesoKg)} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {jornada.observaciones && (
                  <p>
                    <strong>Observaciones:</strong>{" "}
                    {jornada.observaciones}
                  </p>
                )}
              </section>
            )}

            <h3 style={{ marginTop: "30px" }}>
              Bajas registradas
            </h3>

            {!datos.bajas.length ? (
              <p>No hay bajas registradas.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={tabla}>
                  <thead style={{ backgroundColor: "#E8D1A5" }}>
                    <tr>
                      <th style={celda}>Fecha</th>
                      <th style={celda}>Cantidad</th>
                      <th style={celda}>Motivo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {datos.bajas.map((baja) => (
                      <tr key={baja._id}>
                        <td style={celda}>
                          {fechaTexto(baja.fecha)}
                        </td>
                        <td style={celda}>
                          {baja.cantidad}
                        </td>
                        <td style={celda}>
                          {baja.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "30px"
          }}
        >
          <button
            type="button"
            style={{ ...boton, backgroundColor: "#888" }}
            onClick={() => navigate("/lotes-crianza")}
          >
            VOLVER A LOTES
          </button>

          <button
            type="button"
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