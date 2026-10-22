import React, { useState } from "react";
import { API_URL } from "../config";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";

const monto = (valor) =>
  Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const unidades = (valor) =>
  Number(valor || 0).toLocaleString("es-VE", {
    maximumFractionDigits: 3
  });

export default function GananciaReventa({ onVolver }) {
  const hoy = obtenerFechaVenezuela();

  const [filtros, setFiltros] = useState({
    desde: hoy,
    hasta: hoy,
    sede: localStorage.getItem("sede") || "TIENDITA"
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const esAdministrador =
    localStorage
      .getItem("rolUsuario")
      ?.trim()
      .toUpperCase() === "ADMINISTRADOR";

  const cambiar = (e) => {
    setFiltros((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    setResultado(null);
    setMensaje("");
  };

  const consultar = async (e) => {
    e.preventDefault();

    if (cargando) return;

    if (
      !filtros.desde ||
      !filtros.hasta ||
      filtros.desde > filtros.hasta
    ) {
      setMensaje("Seleccione un rango de fechas válido.");
      return;
    }

    setCargando(true);
    setResultado(null);
    setMensaje("");

    try {
      const params = new URLSearchParams(filtros);

      const res = await fetch(
        `${API_URL}/api/ventas/ganancia-reventa?${params}`,
        {
          credentials: "include"
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje ||
          data?.error ||
          "No se pudo consultar el reporte."
        );
      }

      if (
        !Array.isArray(data.reporte) ||
        !data.totales ||
        !data.sinOrigen
      ) {
        throw new Error(
          "El reporte recibido está incompleto."
        );
      }

      setResultado(data);
    } catch (error) {
      setMensaje(
        error.message ||
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  const boton = {
    padding: "10px 16px",
    margin: "6px",
    cursor: "pointer"
  };

  const celda = {
    padding: "9px",
    border: "1px solid #ccc",
    textAlign: "right"
  };

  const texto = {
    ...celda,
    textAlign: "left"
  };

  const filas = resultado?.reporte || [];
  const totales = resultado?.totales;

  const incompleto =
    resultado &&
    (
      resultado.totales.unidadesSinCosto > 0 ||
      resultado.sinOrigen.renglones > 0
    );

  if (!esAdministrador) {
    return (
      <p>Acceso permitido solo al administrador.</p>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>
        Ganancia de productos comprados para reventa
      </h2>

      <p>
        Importes en dólares, después de descuentos y sin IVA.
        Incluye ventas de contado y crédito por fecha de venta,
        aunque estén pendientes de cobro.
      </p>

      <p>
        La ganancia bruta resta el costo de los productos
        vendidos. No descuenta gastos generales ni representa
        el dinero cobrado.
      </p>

      <form onSubmit={consultar}>
        <fieldset
          disabled={cargando}
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            alignItems: "end"
          }}
        >
          <label>
            Desde
            <br />
            <input
              type="date"
              name="desde"
              value={filtros.desde}
              onChange={cambiar}
              required
            />
          </label>

          <label>
            Hasta
            <br />
            <input
              type="date"
              name="hasta"
              value={filtros.hasta}
              onChange={cambiar}
              required
            />
          </label>

          <label>
            Sede
            <br />
            <select
              name="sede"
              value={filtros.sede}
              onChange={cambiar}
            >
              <option value="TIENDITA">Tiendita</option>
              <option value="MONASTERIO">Monasterio</option>
              <option value="AMBAS">Ambas sedes</option>
            </select>
          </label>

          <button type="submit" style={boton}>
            {cargando ? "Consultando..." : "Consultar"}
          </button>
        </fieldset>
      </form>

      <button
        type="button"
        style={boton}
        disabled={cargando}
        onClick={onVolver}
      >
        Volver al reporte anterior
      </button>

      {resultado && (
        <button
          type="button"
          style={boton}
          onClick={() => window.print()}
        >
          Imprimir / guardar PDF
        </button>
      )}

      {mensaje && (
        <p role="alert" style={{ color: "red" }}>
          {mensaje}
        </p>
      )}

      {resultado && (
        <>
          <h3>
            {resultado.desde} al {resultado.hasta}
            {" — "}
            {resultado.sede}
          </h3>

          {incompleto && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff3cd",
                marginBottom: "15px"
              }}
            >
              <strong>
                La ganancia calculada es parcial.
              </strong>
              {" "}
              Hay ventas sin costo u origen histórico guardado.
              No se les asigna el costo actual.
            </div>
          )}

          {resultado.sinOrigen.renglones > 0 && (
            <p>
              <strong>
                Origen histórico no disponible:
              </strong>
              {" "}
              {resultado.sinOrigen.renglones} renglones,
              {" "}
              {unidades(resultado.sinOrigen.unidades)} unidades
              y US$ {monto(resultado.sinOrigen.ventasUSD)}
              {" "}en ventas.
              {" "}
              No se incluyen en la tabla porque no se puede
              confirmar si eran productos comprados para reventa.
            </p>
          )}

          {filas.length === 0 ? (
            <p>
              No hay productos vendidos con origen de reventa
              confirmado en este período.
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead
                    style={{ backgroundColor: "#F9CEAE" }}
                  >
                    <tr>
                      <th style={texto}>Sede / código</th>
                      <th style={texto}>Producto</th>
                      <th style={celda}>Unidades</th>
                      <th style={celda}>Ventas USD</th>
                      <th style={celda}>
                        Ventas con costo conocido USD
                      </th>
                      <th style={celda}>
                        Costo vendido conocido USD
                      </th>
                      <th style={celda}>
                        Ganancia bruta conocida USD
                      </th>
                      <th style={celda}>
                        Ventas sin costo USD
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filas.map((fila) => (
                      <tr
                        key={`${fila.sede}:${fila.productoId}`}
                      >
                        <td style={texto}>
                          {fila.sede}
                          <br />
                          {fila.codigo}
                        </td>

                        <td style={texto}>
                          {fila.descripcion}
                        </td>

                        <td style={celda}>
                          {unidades(fila.unidades)}
                        </td>

                        <td style={celda}>
                          {monto(fila.ventasUSD)}
                        </td>

                        <td style={celda}>
                          {fila.unidadesConCosto > 0
                            ? monto(fila.ventasConCostoUSD)
                            : "—"}
                        </td>

                        <td style={celda}>
                          {fila.unidadesConCosto > 0
                            ? monto(fila.costoVentasUSD)
                            : "—"}
                        </td>

                        <td
                          style={{
                            ...celda,
                            color:
                              fila.gananciaBrutaUSD < 0
                                ? "red"
                                : "inherit"
                          }}
                        >
                          {fila.unidadesConCosto > 0
                            ? monto(fila.gananciaBrutaUSD)
                            : "—"}
                        </td>

                        <td style={celda}>
                          {monto(fila.ventasSinCostoUSD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#eee"
                    }}
                  >
                    <tr>
                      <td style={texto} colSpan="2">
                        TOTAL
                      </td>

                      <td style={celda}>
                        {unidades(totales.unidades)}
                      </td>

                      <td style={celda}>
                        {monto(totales.ventasUSD)}
                      </td>

                      <td style={celda}>
                        {totales.unidadesConCosto > 0
                          ? monto(totales.ventasConCostoUSD)
                          : "—"}
                      </td>

                      <td style={celda}>
                        {totales.unidadesConCosto > 0
                          ? monto(totales.costoVentasUSD)
                          : "—"}
                      </td>

                      <td style={celda}>
                        {totales.unidadesConCosto > 0
                          ? monto(totales.gananciaBrutaUSD)
                          : "—"}
                      </td>

                      <td style={celda}>
                        {monto(totales.ventasSinCostoUSD)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p>
                Ganancia conocida = ventas con costo conocido
                − costo vendido conocido. Las ventas sin costo
                se muestran aparte y no se consideran ganancia.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}