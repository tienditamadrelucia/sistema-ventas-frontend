import React from "react";

const dinero = (valor) =>
  Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function CargosCompra({
  cargos,
  setCargos,
  moneda,
  esMonasterio,
  calculo
}) {
  const cambiar = (indice, campo, valor) => {
    setCargos((anteriores) =>
      anteriores.map((cargo, i) => {
        if (i !== indice) return cargo;

        if (campo === "tipo") {
          return {
            ...cargo,
            tipo: valor,
            valor: "",
            baseCalculo: "SUBTOTAL"
          };
        }

        return {
          ...cargo,
          [campo]: valor
        };
      })
    );
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

  const celda = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center"
  };

  const boton = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    backgroundColor: esMonasterio ? "#B8862D" : "#84B09C",
    fontFamily: "Arial Black, Arial, sans-serif",
    cursor: "pointer"
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "25px auto"
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginBottom: "15px"
        }}
      >
        Impuestos y recargos
      </h3>

      <p style={{ textAlign: "center", fontSize: "14px" }}>
        Ingrese cada cargo una sola vez. El sistema distribuye
        su importe entre los productos.
      </p>

      {cargos.length > 0 && (
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
              style={{
                backgroundColor: esMonasterio
                  ? "#E8D1A5"
                  : "#F9CEAE"
              }}
            >
              <tr>
                <th style={{ ...celda, width: "220px" }}>
                  Concepto
                </th>
                <th style={celda}>Forma</th>
                <th style={{ ...celda, width: "110px" }}>
                  Valor
                </th>
                <th style={celda}>Calcular sobre</th>
                <th style={celda}>Incorporar al costo</th>
                <th style={celda}>Importe ({moneda})</th>
                <th style={{ ...celda, width: "40px" }}>
                  Quitar
                </th>
              </tr>
            </thead>

            <tbody>
              {cargos.map((cargo, indice) => (
                <tr key={indice}>
                  <td style={celda}>
                    <input
                      style={campo}
                      aria-label={`Concepto del cargo ${indice + 1}`}
                      maxLength={120}
                      value={cargo.concepto}
                      onChange={(e) =>
                        cambiar(
                          indice,
                          "concepto",
                          e.target.value
                        )
                      }
                      required
                    />
                  </td>

                  <td style={celda}>
                    <select
                      style={selector}
                      aria-label={`Forma del cargo ${indice + 1}`}
                      value={cargo.tipo}
                      onChange={(e) =>
                        cambiar(indice, "tipo", e.target.value)
                      }
                    >
                      <option value="PORCENTAJE">
                        Porcentaje (%)
                      </option>
                      <option value="MONTO">Monto fijo</option>
                    </select>
                  </td>

                  <td style={celda}>
                    <input
                      style={campo}
                      type="number"
                      min={
                        cargo.tipo === "MONTO"
                          ? "0.01"
                          : "0.000001"
                      }
                      step={
                        cargo.tipo === "MONTO"
                          ? "0.01"
                          : "0.000001"
                      }
                      aria-label={`Valor del cargo ${indice + 1}`}
                      value={cargo.valor}
                      onChange={(e) =>
                        cambiar(indice, "valor", e.target.value)
                      }
                      required
                    />
                  </td>

                  <td style={celda}>
                    <select
                      style={selector}
                      aria-label={`Base del cargo ${indice + 1}`}
                      disabled={cargo.tipo === "MONTO"}
                      value={cargo.baseCalculo}
                      onChange={(e) =>
                        cambiar(
                          indice,
                          "baseCalculo",
                          e.target.value
                        )
                      }
                    >
                      <option value="SUBTOTAL">
                        Subtotal de productos
                      </option>
                      <option value="TOTAL_ACUMULADO">
                        Total acumulado
                      </option>
                    </select>
                  </td>

                  <td style={celda}>
                    <input
                      type="checkbox"
                      aria-label={`Incorporar cargo ${indice + 1} al costo`}
                      checked={cargo.incorporaCosto}
                      onChange={(e) =>
                        cambiar(
                          indice,
                          "incorporaCosto",
                          e.target.checked
                        )
                      }
                    />
                  </td>

                  <td
                    style={{
                      ...celda,
                      fontWeight: "bold"
                    }}
                  >
                    {calculo?.cargos?.[indice]
                      ? dinero(
                          calculo.cargos[indice].montoMoneda
                        )
                      : "—"}
                  </td>

                  <td style={celda}>
                    <button
                      type="button"
                      title="Quitar cargo"
                      aria-label={`Quitar cargo ${indice + 1}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "20px",
                        cursor: "pointer"
                      }}
                      onClick={() =>
                        setCargos((anteriores) =>
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
      )}

      {cargos.length === 0 && (
        <p style={{ textAlign: "center" }}>
          Esta compra todavía no tiene cargos adicionales.
        </p>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "15px"
        }}
      >
        <button
          type="button"
          style={boton}
          disabled={cargos.length >= 20}
          onClick={() =>
            setCargos((anteriores) => [
              ...anteriores,
              {
                concepto: "",
                tipo: "PORCENTAJE",
                valor: "",
                baseCalculo: "SUBTOTAL",
                incorporaCosto: true
              }
            ])
          }
        >
          Agregar impuesto o recargo
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: "13px" }}>
        Los cargos se calculan en el orden de la tabla.
        “Total acumulado” incluye los cargos anteriores.
        Los montos fijos se distribuyen según el subtotal
        de los productos.
      </p>
    </div>
  );
}