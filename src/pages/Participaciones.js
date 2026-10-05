import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";
import { registrarAccion } from "../utils/registrarAccion";
import { obtenerFechaVenezuela } from "../utils/fechaVenezuela";

const Participaciones = () => {
  const navigate = useNavigate();

  const sede = localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  const rolUsuario =
    localStorage.getItem("rolUsuario") || "";

  const usuarioActual =
    localStorage.getItem("usuarioNombre") || "";

  const esAdministrador =
    rolUsuario === "ADMINISTRADOR";

  const hoy = obtenerFechaVenezuela();

  const [procesando, setProcesando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [estadoCuenta, setEstadoCuenta] =
    useState(null);

  const [pagos, setPagos] =
    useState([]);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState([]);

  const [formData, setFormData] =
    useState({
      fecha: hoy,
      sedePaga: sede,
      sedeRecibe:
        sede === "MONASTERIO"
          ? "TIENDITA"
          : "MONASTERIO",
      monto: "",
      numeroReciboGasto: "",
      numeroReciboIngreso: "",
      observacion: ""
    });


  // ====================================================
  // ESTILOS
  // ====================================================

  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor:
      esMonasterio
        ? "#5A2D16"
        : "#FC9E9B",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonGuardar = {
    width: "40%",
    padding: "8px",
    backgroundColor:
      esMonasterio
        ? "#B8862D"
        : "#84B09C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    marginTop: "15px",
    opacity: procesando ? 0.6 : 1,
    cursor:
      procesando
        ? "not-allowed"
        : "pointer"
  };

  const estiloTarjeta = {
    flex: "1",
    minWidth: "240px",
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center"
  };


  // ====================================================
  // SEGURIDAD DE LA PANTALLA
  // ====================================================

  useEffect(() => {
    if (!esAdministrador) {
      alert(
        "Este módulo es exclusivo del administrador."
      );

      navigate(
        esMonasterio
          ? "/menu-monasterio"
          : "/menu",
        { replace: true }
      );
    }
  }, [
    esAdministrador,
    esMonasterio,
    navigate
  ]);


  // ====================================================
  // CARGAR DATOS
  // ====================================================

  const cargarEstadoCuenta = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/participaciones/estado-cuenta`
      );

      if (!res.ok) {
        throw new Error(
          `Error ${res.status} al consultar el estado de cuenta`
        );
      }

      const data = await res.json();

      if (!data.ok) {
        throw new Error(
          data.mensaje ||
            "No fue posible consultar el estado de cuenta."
        );
      }

      setEstadoCuenta(data);

    } catch (error) {
      console.error(
        "Error cargando estado de cuenta:",
        error
      );

      throw error;
    }
  };


  const cargarPagos = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/participaciones/pagos`
      );

      if (!res.ok) {
        throw new Error(
          `Error ${res.status} al consultar los pagos`
        );
      }

      const data = await res.json();

      if (!data.ok) {
        throw new Error(
          data.mensaje ||
            "No fue posible consultar los pagos."
        );
      }

      setPagos(
        Array.isArray(data.pagos)
          ? data.pagos
          : []
      );

    } catch (error) {
      console.error(
        "Error cargando pagos:",
        error
      );

      throw error;
    }
  };

  const cargarVentasPendientes = async (paga = formData.sedePaga, recibe = formData.sedeRecibe) => {
  try {
    const res = await fetch(`${API_URL}/api/participaciones/ventas-pendientes?sedePaga=${paga}&sedeRecibe=${recibe}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.mensaje || "No fue posible consultar las ventas pendientes.");
    setVentasPendientes(Array.isArray(data.ventas) ? data.ventas : []);
    setVentasSeleccionadas([]);
  } catch (error) {
    console.error("Error cargando ventas pendientes:", error);
    setVentasPendientes([]);
    setVentasSeleccionadas([]);
    throw error;
  }
};

  const cargarTodo = async () => {
    if (!esAdministrador) return;

    setProcesando(true);
    setError("");

    try {
      await Promise.all([
        cargarEstadoCuenta(),
        cargarPagos(),
        cargarVentasPendientes()
      ]);

    } catch (error) {
      setError(
        error.message ||
          "No fue posible conectar con el módulo de participaciones."
      );

    } finally {
      setProcesando(false);
    }
  };


  useEffect(() => {
    if (esAdministrador) {
      cargarTodo();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdministrador]);


  // ====================================================
  // FORMULARIO
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  const cambiarSedePaga = (e) => {
  const nuevaSede = e.target.value;
  const nuevaRecibe = nuevaSede === "MONASTERIO" ? "TIENDITA" : "MONASTERIO";

  setFormData(prev => ({
    ...prev,
    sedePaga: nuevaSede,
    sedeRecibe: nuevaRecibe,
    monto: "",
    numeroReciboIngreso: ""
  }));

  setVentasSeleccionadas([]);
  cargarVentasPendientes(nuevaSede, nuevaRecibe).catch(() => {});
};

  const seleccionarVenta = (id) => {
  setVentasSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const seleccionarTodas = () => {
  if (ventasSeleccionadas.length === ventasPendientes.length) setVentasSeleccionadas([]);
  else setVentasSeleccionadas(ventasPendientes.map(v => v._id));
};

const totalSeleccionado = ventasPendientes
  .filter(v => ventasSeleccionadas.includes(v._id))
  .reduce((suma, v) => suma + Number(v.montoParticipacion || 0), 0);

  // ====================================================
  // GUARDAR PAGO
  // ====================================================

  const guardarPago = async () => {
  if (procesando) return;

  if (!esAdministrador) {
    alert("Solo el administrador puede registrar participaciones.");
    return;
  }

  if (!formData.fecha || !formData.sedePaga || !formData.sedeRecibe || !formData.numeroReciboGasto?.trim()) {
    alert("Debe completar fecha, sedes y número de recibo de gastos.");
    return;
  }

  if (ventasSeleccionadas.length === 0) {
    alert("Debe seleccionar al menos una venta para liquidar.");
    return;
  }

  if (formData.sedeRecibe === "MONASTERIO" && !formData.numeroReciboIngreso?.trim()) {
    alert("Debe indicar el número del recibo de ingreso del Monasterio.");
    return;
  }

  const documentoRecibe = formData.sedeRecibe === "TIENDITA"
    ? "Factura automática en TIENDITA"
    : `Recibo de ingreso: ${formData.numeroReciboIngreso}`;

  const confirmar = window.confirm(
    `¿Registrar esta liquidación?\n\nPaga: ${formData.sedePaga}\nRecibe: ${formData.sedeRecibe}\nVentas: ${ventasSeleccionadas.length}\nMonto: $${formatearMonto(totalSeleccionado)}\nRecibo de gastos: ${formData.numeroReciboGasto}\n${documentoRecibe}`
  );

  if (!confirmar) return;

  setProcesando(true);
  setError("");

  try {
    const res = await fetch(`${API_URL}/api/participaciones/pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: formData.fecha,
        sedePaga: formData.sedePaga,
        sedeRecibe: formData.sedeRecibe,
        numeroReciboGasto: formData.numeroReciboGasto,
        numeroReciboIngreso: formData.numeroReciboIngreso,
        observacion: formData.observacion,
        usuario: usuarioActual,
        vendidosSeleccionados: ventasSeleccionadas
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.mensaje || "No fue posible registrar la liquidación.");

    await registrarAccion(`Registró liquidación de participación: ${formData.sedePaga} → ${formData.sedeRecibe} por $${formatearMonto(data.monto)}`);

    let mensaje = `Liquidación registrada correctamente.\nVentas liquidadas: ${data.cantidadVentas}\nMonto: $${formatearMonto(data.monto)}`;
    if (data.facturaTiendita) mensaje += `\nFactura TIENDITA N.º ${data.facturaTiendita}`;
    alert(mensaje);

    setFormData({
      fecha: obtenerFechaVenezuela(),
      sedePaga: sede,
      sedeRecibe: sede === "MONASTERIO" ? "TIENDITA" : "MONASTERIO",
      monto: "",
      numeroReciboGasto: "",
      numeroReciboIngreso: "",
      observacion: ""
    });

    setVentasSeleccionadas([]);

    await Promise.all([
      cargarEstadoCuenta(),
      cargarPagos(),
      cargarVentasPendientes(sede, sede === "MONASTERIO" ? "TIENDITA" : "MONASTERIO")
    ]);

  } catch (error) {
    console.error("Error guardando participación:", error);
    setError(error.message || "Error registrando la liquidación.");
    alert(error.message || "Error registrando la liquidación.");
  } finally {
    setProcesando(false);
  }
};

  // ====================================================
  // FORMATO
  // ====================================================

  function formatearMonto(valor) {
    const numero = Number(valor);

    if (isNaN(numero)) return "0,00";

    return numero.toLocaleString(
      "es-VE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
  }


  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    return fecha.substring(0, 10);
  };


  // ====================================================
  // SI NO ES ADMINISTRADOR, NO RENDERIZAR EL MÓDULO
  // ====================================================

  if (!esAdministrador) {
    return null;
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div>

      <Encabezado sede={sede} />


      {/* PROCESANDO */}

      {procesando && (
        <div
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
          Procesando, por favor espere...
        </div>
      )}


      <div style={{ padding: "20px" }}>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontWeight: "bold"
          }}
        >
          Control de Participaciones
        </h2>


        {/* ERROR DE CONEXIÓN */}

        {error && (
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto 20px auto",
              padding: "12px",
              border: "1px solid #B84A4A",
              borderRadius: "8px",
              backgroundColor: "#FFF4F4",
              color: "#8B0000",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            {error}

            <div>
              <button
                onClick={cargarTodo}
                style={{
                  marginTop: "10px",
                  padding: "6px 15px",
                  cursor: "pointer"
                }}
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        )}


        {/* ========================================= */}
        {/* ESTADO DE CUENTA */}
        {/* ========================================= */}

        {estadoCuenta && (
          <>
            <h3
              style={{
                textAlign: "center"
              }}
            >
              Estado de Cuenta entre las Sedes
            </h3>


            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "15px",
                maxWidth: "1000px",
                margin: "0 auto 20px auto"
              }}
            >

              {/* MONASTERIO → TIENDITA */}

              <div style={estiloTarjeta}>

                <h4>
                  MONASTERIO → TIENDITA
                </h4>

                <p>
                  Generado:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.generado
                        ?.monasterioATiendita
                    )}
                  </strong>
                </p>

                <p>
                  Pagado:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.pagado
                        ?.monasterioATiendita
                    )}
                  </strong>
                </p>

                <p>
                  Pendiente:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.pendiente
                        ?.monasterioATiendita
                    )}
                  </strong>
                </p>

              </div>


              {/* TIENDITA → MONASTERIO */}

              <div style={estiloTarjeta}>

                <h4>
                  TIENDITA → MONASTERIO
                </h4>

                <p>
                  Generado:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.generado
                        ?.tienditaAMonasterio
                    )}
                  </strong>
                </p>

                <p>
                  Pagado:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.pagado
                        ?.tienditaAMonasterio
                    )}
                  </strong>
                </p>

                <p>
                  Pendiente:{" "}
                  <strong>
                    $
                    {formatearMonto(
                      estadoCuenta.pendiente
                        ?.tienditaAMonasterio
                    )}
                  </strong>
                </p>

              </div>


              {/* SALDO NETO */}

              <div style={estiloTarjeta}>

                <h4>
                  SALDO NETO
                </h4>

                {estadoCuenta.saldoNeto
                  ?.monto > 0 ? (
                  <>
                    <p>
                      <strong>
                        {
                          estadoCuenta
                            .saldoNeto
                            .deudor
                        }
                      </strong>
                    </p>

                    <p>
                      debe a
                    </p>

                    <p>
                      <strong>
                        {
                          estadoCuenta
                            .saldoNeto
                            .acreedor
                        }
                      </strong>
                    </p>

                    <p
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold"
                      }}
                    >
                      $
                      {formatearMonto(
                        estadoCuenta
                          .saldoNeto
                          .monto
                      )}
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      fontWeight: "bold"
                    }}
                  >
                    Las cuentas están saldadas.
                  </p>
                )}

              </div>

            </div>
          </>
        )}


        {/* ========================================= */}
        {/* FORMULARIO DE PAGO */}
        {/* ========================================= */}

        <div
          style={{
            width: "550px",
            maxWidth: "90%",
            margin: "25px auto 20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "white"
          }}
        >

          <h3
            style={{
              textAlign: "center",
              marginBottom: "25px"
            }}
          >
            Registrar Pago de Participación
          </h3>


          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "15px"
            }}
          >

            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontWeight: "bold"
                }}
              >
                Fecha
              </label>

              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "6px",
                  boxSizing: "border-box"
                }}
              />
            </div>


            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: "bold" }}>Monto a liquidar $</label>
              <input type="text" value={formatearMonto(totalSeleccionado)} readOnly style={{ width: "100%", padding: "6px", boxSizing: "border-box", backgroundColor: "#eee", fontWeight: "bold" }} />
            </div>
             
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "15px"
            }}
          >

            <div style={{ flex: 1 }}>

              <label
                style={{
                  fontWeight: "bold"
                }}
              >
                Sede que paga
              </label>

              <select
                name="sedePaga"
                value={formData.sedePaga}
                onChange={cambiarSedePaga}
                style={{
                  width: "100%",
                  padding: "6px"
                }}
              >
                <option value="TIENDITA">
                  TIENDITA
                </option>

                <option value="MONASTERIO">
                  MONASTERIO
                </option>
              </select>

            </div>


            <div style={{ flex: 1 }}>

              <label
                style={{
                  fontWeight: "bold"
                }}
              >
                Sede que recibe
              </label>

              <input
                value={formData.sedeRecibe}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px",
                  boxSizing: "border-box",
                  backgroundColor: "#eee"
                }}
              />

            </div>

          </div>

          {/* VENTAS PENDIENTES */}
<div style={{ marginBottom: "20px" }}>
  <h4 style={{ textAlign: "center", marginBottom: "10px" }}>Ventas pendientes de liquidar</h4>

  <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
    <thead>
      <tr style={{ backgroundColor: esMonasterio ? "#E8D1A5" : "#F9CEAE" }}>
        <th>
          <input type="checkbox" checked={ventasPendientes.length > 0 && ventasSeleccionadas.length === ventasPendientes.length} onChange={seleccionarTodas} />
        </th>
        <th>Fecha</th>
        <th>Factura</th>
        <th>Producto</th>
        <th>Cant.</th>
        <th>Venta</th>
        <th>Participación</th>
      </tr>
    </thead>

          <tbody>
            {ventasPendientes.length === 0 ? (
              <tr style={{ backgroundColor: "white" }}>
                <td colSpan="7">No hay ventas pendientes de liquidar.</td>
              </tr>
            ) : ventasPendientes.map(v => (
              <tr key={v._id} style={{ backgroundColor: "white" }}>
                <td><input type="checkbox" checked={ventasSeleccionadas.includes(v._id)} onChange={() => seleccionarVenta(v._id)} /></td>
                <td>{formatearFecha(v.fecha)}</td>
                <td>{v.factura}</td>
                <td>{v.producto || "—"}</td>
                <td>{v.cantidad}</td>
                <td>${formatearMonto(v.totalVenta)}</td>
                <td><strong>${formatearMonto(v.montoParticipacion)}</strong></td>
              </tr>
              ))}
            </tbody>

              <tfoot>
                <tr style={{ fontWeight: "bold", backgroundColor: "white" }}>
                <td colSpan="6" style={{ textAlign: "right" }}>TOTAL A LIQUIDAR:</td>
                <td>${formatearMonto(totalSeleccionado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

          {/* DOCUMENTOS DE LA LIQUIDACIÓN */}
    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
      <div style={{ flex: 1 }}>
        <label style={{ fontWeight: "bold" }}>
          N.º Recibo de Gastos<br />
          <span style={{ fontSize: "12px", fontWeight: "normal" }}>{formData.sedePaga}</span>
        </label>
        <input type="text" name="numeroReciboGasto" value={formData.numeroReciboGasto} onChange={handleChange} placeholder="Número del recibo" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
      </div>

      {formData.sedeRecibe === "MONASTERIO" ? (
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>
            N.º Recibo de Ingreso<br />
            <span style={{ fontSize: "12px", fontWeight: "normal" }}>MONASTERIO</span>
          </label>
          <input type="text" name="numeroReciboIngreso" value={formData.numeroReciboIngreso} onChange={handleChange} placeholder="Número del recibo" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>
            Documento de Ingreso<br />
            <span style={{ fontSize: "12px", fontWeight: "normal" }}>TIENDITA</span>
          </label>
          <div style={{ width: "100%", padding: "7px", boxSizing: "border-box", backgroundColor: "#eee", border: "1px solid #ccc" }}>
            Factura automática — OTROS INGRESOS
          </div>
        </div>
      )}
    </div>

    <label style={{ fontWeight: "bold" }}>Observación</label>
    <input type="text" name="observacion" value={formData.observacion} onChange={handleChange} placeholder="Opcional" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />

    <div style={{ display: "flex", justifyContent: "center" }}>
      <button style={botonGuardar} onClick={guardarPago} disabled={procesando}>Registrar Pago</button>
    </div>

    </div>


        {/* ========================================= */}
        {/* VOLVER */}
        {/* ========================================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "15px"
          }}
        >
          <button
            onClick={() =>
              navigate(
                esMonasterio
                  ? "/menu-monasterio"
                  : "/menu"
              )
            }
            style={estiloBoton}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>


        {/* ========================================= */}
        {/* HISTORIAL */}
        {/* ========================================= */}

        <h3
          style={{
            textAlign: "center",
            marginBottom: "5px"
          }}
        >
          Historial de Pagos de Participaciones
        </h3>


        <table
          border="1"
          cellPadding="5"
          style={{
            width: "100%",
            textAlign: "center",
            borderCollapse: "collapse"
          }}
        >

          <thead>
            <tr
              style={{
                backgroundColor:
                  esMonasterio
                    ? "#E8D1A5"
                    : "#F9CEAE",
                color:
                  esMonasterio
                    ? "#33231A"
                    : "#000"
              }}
            >
              <th>Fecha</th>
              <th>Paga</th>
              <th>Recibe</th>
              <th>Recibo de Gastos</th>
              <th>Documento de Ingreso</th>
              <th>Monto</th>
              <th>Observación</th>
              <th>Usuario</th>
            </tr>
          </thead>


          <tbody>

            {pagos.length === 0 ? (

              <tr
                style={{
                  backgroundColor: "white"
                }}
              >
                <td colSpan="8">
                  No hay pagos registrados.
                </td>
              </tr>

            ) : (

              pagos.map((pago) => (

                <tr
                  key={pago._id}
                  style={{
                    backgroundColor: "white"
                  }}
                >
                  <td>
                    {formatearFecha(
                      pago.fecha
                    )}
                  </td>

                  <td>
                    {pago.sedePaga}
                  </td>

                  <td>
                    {pago.sedeRecibe}
                  </td>
                  <td>{pago.numeroReciboGasto || "—"}</td>
                  <td>{pago.sedeRecibe === "TIENDITA" ? (pago.facturaIngresoTiendita ? `Factura ${pago.facturaIngresoTiendita}` : "—") : (pago.numeroReciboIngreso ? `Recibo ${pago.numeroReciboIngreso}` : "—")}</td>
                  <td>
                    $
                    {formatearMonto(
                      pago.monto
                    )}
                  </td>

                  <td>
                    {pago.observacion ||
                      "—"}
                  </td>

                  <td>
                    {pago.usuario ||
                      "—"}
                  </td>
                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
    </div>
  );
};

export default Participaciones;