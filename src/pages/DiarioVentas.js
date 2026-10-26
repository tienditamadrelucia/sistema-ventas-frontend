// src/pages/Diario.jsx
import Encabezado from "../components/Encabezado";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import {obtenerFechaVenezuela} from "../utils/fechaVenezuela";

const DiarioVentas = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const formularioRef = useRef(null);
  const cargaInicialRef = useRef(false);

  const fechaRecibida = location.state?.fechaRevision;

  const fechaRevision =
  typeof fechaRecibida === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(fechaRecibida)
    ? fechaRecibida
    : "";

  const sedeRecibida = location.state?.sedeRevision;

  const sede = ["TIENDITA", "MONASTERIO"].includes(sedeRecibida)
  ? sedeRecibida
  : localStorage.getItem("sede") || "TIENDITA";
  const esMonasterio = sede === "MONASTERIO";

  const colorPrincipal = esMonasterio ? "#5A2D16" : "#FC9E9B"; 
  const colorAccion = esMonasterio ? "#B8862D" : "#84B09C";
  const colorTabla = esMonasterio ? "#E8D1A5" : "#F9CEAE";
  const colorSuave = esMonasterio ? "#F5EBDD" : "#EDC5CD";
 
  // -------------------------
  // ESTILOS (MISMOS QUE SALIDAS)
  // -------------------------
  const estiloBoton = { 
    width: "15%",
    padding: "10px",
    backgroundColor: colorPrincipal,
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black", 
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonBuscar = {
    width: "30%",
    padding: "6px",
    backgroundColor: colorAccion,
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "8px"
  };

  const selectEstilo = {
    width: "100%",
    padding: "5px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: colorSuave,
    fontFamily: "Arial",
    fontSize: "14px"
  };

  // -------------------------
  // ESTADOS
  // -------------------------
  const [desde, setDesde] = useState(
    fechaRevision || obtenerFechaVenezuela()
  );

  const [hasta, setHasta] = useState(
    fechaRevision || obtenerFechaVenezuela()
  );
  const [reporte, setReporte] = useState([]);
  const [totales, setTotales] = useState({
    totalEfectivoP: 0,
    totalTransferenciaP: 0,
    totalEfectivoBs: 0,
    totalTransferenciaBs: 0,
    totalPuntoBs: 0,
    totalPagomovilBs: 0,
    totalEfectivoD: 0,
    totalZelle: 0
  });
  const [procesando, setProcesando] = useState(false);

  const [consulta, setConsulta] = useState(null);
  const [verificacion, setVerificacion] = useState(null);

  const esAdministrador =
    localStorage.getItem("rolUsuario")
      ?.trim()
      .toUpperCase() === "ADMINISTRADOR";

  const invalidarReporte = () => {
    setConsulta(null);
    setVerificacion(null);
    setReporte([]);
    setTotales({});
  };

  const formatoVE = (valor) => {
    if (!valor) return "0,00";
    return Number(valor).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const resumenActividades = () => {
  const resumen = {};

  reporte.forEach((item) => {
    (item.productos || []).forEach((p) => {
      const id = p.actividadProductiva?.id || "SIN_ACTIVIDAD";
      const descripcion = p.actividadProductiva?.descripcion || "SIN ACTIVIDAD ASIGNADA";

      if (!resumen[id]) {
        resumen[id] = {
          id,
          descripcion,
          cantidad: 0,
          total: 0
        };
      }

      resumen[id].cantidad += Number(p.cantidad || 0);
      resumen[id].total += Number(p.total || 0);
    });
  });

  return Object.values(resumen).sort((a, b) =>
    a.descripcion.localeCompare(b.descripcion, "es")
  );
};

const actividadesResumen = resumenActividades();

const totalResumenActividades = actividadesResumen.reduce(
  (total, actividad) => total + Number(actividad.total || 0),
  0
);

  // -------------------------
  // CARGAR REPORTE
  // -------------------------
  const cargarReporte = async () => {
  if (procesando) return;

  if (!desde || !hasta || desde > hasta) {
    alert("Seleccione un rango de fechas válido");
    return;
  }

  setProcesando(true);
  invalidarReporte();

  try {
    const res = await fetch(
      `${API_URL}/api/ventas/reporte/${desde}/${hasta}?sede=${encodeURIComponent(sede)}`,
      {
        credentials: "include"
      }
    );

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(
        data.mensaje ||
        data.msg ||
        "No hay datos para este rango"
      );
    }

    setReporte(data.reporte || []);
    setTotales(data.totales || {});

    setConsulta({
    desde,
    hasta,
    sede,
    revision: data.revisionCaja
  });

    // Solo se verifica un día y una sede a la vez.
    if (desde === hasta) {
      const estadoRes = await fetch(
        `${API_URL}/api/caja/verificacion/${desde}?sede=${encodeURIComponent(sede)}`,
        {
          credentials: "include"
        }
      );

      const estado = await estadoRes.json();

      if (!estadoRes.ok || !estado.ok) {
        throw new Error(
          estado.mensaje ||
          "No se pudo consultar la verificación de caja"
        );
      }

      if (
        !Number.isInteger(data.revisionCaja) ||
        estado.revision !== data.revisionCaja
      ) {
      throw new Error(
        "El día cambió después de generar el reporte. " +
        "Pulse Buscar de nuevo."
      );
      }

      setVerificacion(estado.verificado === true);
      }

    formularioRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  } catch (error) {
    alert(error.message || "Error cargando reporte");
  } finally {
    setProcesando(false);
  }
};

useEffect(() => {
  if (!fechaRevision || cargaInicialRef.current) return;

  cargaInicialRef.current = true;
  cargarReporte();

  // La consulta automática se realiza una vez al abrir desde Revisión.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fechaRevision]);

const cambiarVerificacion = async (accion) => {
  if (
    procesando ||
    !esAdministrador ||
    !consulta ||
    consulta.desde !== consulta.hasta ||
    verificacion === null
  ) {
    return;
  }

  let motivo = "";

  if (accion === "REABRIR") {
    const respuesta = window.prompt(
      "Indique el motivo de reapertura:"
    );

    if (respuesta === null) return;

    motivo = respuesta.trim();

    if (!motivo) {
      alert("Debe indicar el motivo");
      return;
    }
  }

  const mensaje = accion === "VERIFICAR"
    ? (
        `Confirmo que revisé el reporte y recibí el dinero ` +
        `completo del ${consulta.desde} en ${consulta.sede}.\n\n` +
        "Se bloquearán los cambios de ese día. ¿Continuar?"
      )
    : (
        `Se permitirán nuevamente cambios del ` +
        `${consulta.desde} en ${consulta.sede}.\n\n` +
        "¿Continuar?"
      );

  if (!window.confirm(mensaje)) return;

  setProcesando(true);

  try {
    const res = await fetch(
      `${API_URL}/api/caja/verificacion/${consulta.desde}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
        sede: consulta.sede,
        accion,
        motivo,
        revision: consulta.revision
        })
      }
    );

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(
        data.mensaje ||
        "No se pudo cambiar la verificación"
      );
    }

    setVerificacion(data.verificado === true);

    setConsulta(actual => ({
      ...actual,
      revision: data.revision
    }));

    if (data.verificado) {
      alert("Dinero verificado. Día bloqueado.");
    } else {
      invalidarReporte();

      alert(
        "Día reabierto. Pulse Buscar para revisar " +
        "los importes actuales."
      );
    }
  } catch (error) {
    // Una respuesta perdida no demuestra que no se guardó.
    setVerificacion(null);

    alert(
      (error.message || "Error cambiando la verificación") +
      ". Pulse Buscar para consultar el estado actual."
    );
  } finally {
    setProcesando(false);
  }
};

  const eliminarFacturaDesdeDiario = async (factura) => {
  if (procesando || verificacion === true) return;

  const confirmar = window.confirm(
    "¿Está seguro que desea ELIMINAR la factura completa?\n" +
    "Se eliminarán: venta, productos y pagos.\n" +
    "Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  setProcesando(true);

  let eliminada = false;

  try {
    const res = await fetch(
      `${API_URL}/api/facturas/eliminar-completa/${factura}?sede=${encodeURIComponent(sede)}`,
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    const json = await res.json();

    if (!res.ok || !json.ok) {
      throw new Error(
        json.mensaje ||
        json.msg ||
        "No se pudo eliminar la factura"
      );
    }

    eliminada = true;
    alert("Factura eliminada correctamente.");
    invalidarReporte();
  } catch (error) {
    alert(error.message || "Error eliminando factura");
  } finally {
    setProcesando(false);
  }

  // Se consulta nuevamente con el botón Buscar para
  // actualizar los importes y el estado de verificación.
  if (eliminada) {
    formularioRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }
};

  const enviarWhatsApp = () => {
  const mensaje = encodeURIComponent("Aquí tienes el reporte del día en PDF.");
  window.open(`https://wa.me/?text=${mensaje}`, "_blank");
};

  // -------------------------
  // RETURN
  // -------------------------
  return (
  <div>
    {procesando && (
      <div style={{
        background: "#84868a",
        color: "white",
        padding: "8px",
        textAlign: "center",
        fontWeight: "bold",
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 999999
      }}>
        Procesando, por favor espere...
      </div>
      )}
    <Encabezado sede={sede} />

    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
        Reporte Diario de Ventas
      </h2>

      {/* FILTRO */}
      <div
        ref={formularioRef}
        style={{
          width: "550px",
          margin: "0 auto 20px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>
          Seleccione rango de fechas
        </h3>

        <div style={{ display: "flex", gap: "40px", marginBottom: "10px" }}>
          <input
            type="date"
            value={desde}
            disabled={procesando}
            onChange={(e) => {
              setDesde(e.target.value);
              invalidarReporte();
            }}
            style={{ width: "45%", padding: "5px" }}
          />

          <input
            type="date"
            value={hasta}
            disabled={procesando}
            onChange={(e) => {
              setHasta(e.target.value);
              invalidarReporte();
            }}
            style={{ width: "45%", padding: "5px" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            className="botonElegante"
            style={botonBuscar}
            disabled={procesando}
            onClick={cargarReporte}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* BOTÓN VOLVER */}      
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
      <button
        type="button"
        disabled={procesando}
        onClick={() =>
        navigate(
          localStorage.getItem("sede") === "MONASTERIO"
          ? "/menu-monasterio"
          : "/menu"
          )
          }
          style={estiloBoton}
        >
          VOLVER AL MENÚ
        </button>
        <div className="acciones-reporte">
          <img
            src="/icons/pdf.png"
            alt="Exportar PDF"
            className="icono-accion"
            onClick={() => window.print()}
        />
          <img
            src="/icons/whatsapp.png"
            alt="Enviar por WhatsApp"
            className="icono-accion"
            onClick={enviarWhatsApp}
          />
        </div>
      </div>

      {/* ⭐⭐⭐ TABLA CONTINUA — UNA SOLA, SIN REPETICIONES ⭐⭐⭐ */}
      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
        <thead style={{ backgroundColor: colorTabla }}>
          <tr>
            <th>Fecha</th>
            <th>Factura</th>
            <th>Cliente</th>
            <th>Código</th>
            <th>Descripción</th>
            <th>Status</th>
            <th>Cantidad</th>
            <th>P. Sistema</th>
            <th>P. Venta</th>
            <th>Dscto</th>
            <th>Total</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
  {reporte
    .filter(item => item && item.venta && item.productos && item.productos.length > 0)
    .map((item, idx) => (
      <React.Fragment key={item.venta.factura || `fact-${idx}`}>
        {item.productos.map((p, i) => (
          <tr key={p._id || `${item.venta.factura || `fact-${idx}`}-${i}`}>
            {i === 0 ? (
              <>
                <td>{item.venta.fecha?.slice(0, 10).split("-").reverse().join("/")}</td>
                <td>{item.venta.factura}</td>
                <td>{item.clienteNombre}</td>
              </>
            ) : (
              <>
                <td></td>
                <td></td>
                <td></td>
              </>
            )}
            <td>{p.codigo}</td>
            <td>{p.descripcion}</td>
            <td>{item.venta.estado}</td>
            <td>{p.cantidad}</td>
            <td>{formatoVE(p.precioSistema)}</td>
            <td>{formatoVE(p.precioVenta)}</td>
            <td>{formatoVE(p.dscto)}</td>
            <td>{formatoVE(p.total)}</td>
            {i === 0 && (
              <td
                rowSpan={item.productos.length}
                style={{ textAlign: "center", verticalAlign: "middle" }}
              >
                <button
                  className="btn-eliminar"
                  disabled={procesando || verificacion === true}
                  onClick={() => eliminarFacturaDesdeDiario(item.venta.factura)}
                >
                  🗑️
                </button>
              </td>
            )}
          </tr>
        ))}        

      {/* FILA DE PAGO */}
      <tr key={`pago-${item.venta.factura}`}>
        <td colSpan="11" style={{ textAlign: "right", background: "#f0f0f0" }}>          
        <strong>
          {item.pagos && (
          <div style={{ fontFamily: "Roboto Mono", whiteSpace: "pre" }}>

            {item.pagos.efectivoP > 0 && (
            <div>{"E-Pesos:".padEnd(15) + formatoVE(item.pagos.efectivoP)}</div>
            )}

            {item.pagos.transferenciaP > 0 && (
            <div>{"T-Pesos:".padEnd(15) + formatoVE(item.pagos.transferenciaP)}</div>
            )}

            {item.pagos.efectivoBs > 0 && (
            <div>{"E-Bs:".padEnd(15) + formatoVE(item.pagos.efectivoBs)}</div>
            )}

            {item.pagos.transferenciaBs > 0 && (
            <div>{"T-Bs:".padEnd(15) + formatoVE(item.pagos.transferenciaBs)}</div>
            )}

            {item.pagos.puntoBs > 0 && (
            <div>{"Punto:".padEnd(15) + formatoVE(item.pagos.puntoBs)}</div>
            )}

            {item.pagos.pagomovilBs > 0 && (
            <div>{"PagoMóvil:".padEnd(15) + formatoVE(item.pagos.pagomovilBs)}</div>
            )}

            {item.pagos.efectivoD > 0 && (
            <div>{"E-$:".padEnd(15) + formatoVE(item.pagos.efectivoD)}</div>
            )}

            {item.pagos.zelle > 0 && (
            <div>{"Zelle:".padEnd(15) + formatoVE(item.pagos.zelle)}</div>
            )}

            </div>
            )}

          </strong>
          {/* ⭐ VUELTOS (YA VIENEN EN NEGATIVO) ⭐ */}
          {item.pagos && (
          <>
          {(item.pagos.vueltoP !== 0 ||
            item.pagos.vueltoBs !== 0 ||
            item.pagos.vueltoD !== 0) && (
            <div style={{ fontFamily: "Roboto Mono", whiteSpace: "pre" }}>
            <br />
              <strong>

              {item.pagos.vueltoP !== 0 && (
              <div>{"Vuelto-Pesos:".padEnd(15) + formatoVE(item.pagos.vueltoP)}</div>
              )}

              {item.pagos.vueltoBs !== 0 && (
              <div>{"Vuelto-Bs:".padEnd(15) + formatoVE(item.pagos.vueltoBs)}</div>
              )}

              {item.pagos.vueltoD !== 0 && (
              <div>{"Vuelto-$:".padEnd(15) + formatoVE(item.pagos.vueltoD)}</div>
              )}
              </strong>{"\n"}
            </div>
          )}
          </>
          )}

        </td>
      </tr>
      </React.Fragment>
    ))}
    </tbody>

      </table>
        <div
          style={{
            textAlign: "center",
            margin: "20px auto",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "700px"
          }}
        >
          {!consulta ? (
          <p>
            Busque el reporte de una sola fecha para consultar
            la verificación del dinero.
          </p>
          ) : consulta.desde !== consulta.hasta ? (
          <p>
            Para verificar el dinero, seleccione la misma fecha
            en Desde y Hasta y pulse Buscar.
          </p>
          ) : (
        <>
          <p>
            <strong>
              {consulta.sede} — {consulta.desde}
            </strong>
          </p>

          <p>
            {verificacion === null
              ? "Estado de verificación sin confirmar. Pulse Buscar."
              : verificacion
                ? "Dinero verificado. Día bloqueado para cambios."
                : "Día sin verificar."}
            </p>

          {esAdministrador && verificacion !== null && (
            <button
              disabled={procesando}
              style={{
                ...botonBuscar,
                width: "auto",
                padding: "10px 20px"
              }}
              onClick={() =>
              cambiarVerificacion(
              verificacion ? "REABRIR" : "VERIFICAR"
            )
          }
        >
          {verificacion
            ? "Reabrir día"
            : "Verificar dinero recibido y bloquear día"}
        </button>
      )}
    </>
  )}
</div>

        {/* TOTALES FINALES */}
        <h3 style={{ textAlign: "center", marginTop: "30px", marginBottom: "10px", fontWeight: "bold" }}>
          Totales Finales por Método de Pago
        </h3>

        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center", marginBottom: "40px" }}>
          <thead style={{ backgroundColor: colorTabla }}>
          <tr>
            <th>Efectivo P</th>
            <th>Transf P</th>
            <th>Efectivo Bs</th>
            <th>Transf Bs</th>
            <th>Punto Bs</th>
            <th>Pago Móvil Bs</th>
            <th>Efectivo $</th>
            <th>Zelle</th>
          </tr>
          </thead>

          <tbody>
            <tr>
              <td>{formatoVE(totales.totalEfectivoP)}</td>
              <td>{formatoVE(totales.totalTransferenciaP)}</td>
              <td>{formatoVE(totales.totalEfectivoBs)}</td>
              <td>{formatoVE(totales.totalTransferenciaBs)}</td>
              <td>{formatoVE(totales.totalPuntoBs)}</td>
              <td>{formatoVE(totales.totalPagomovilBs)}</td>
              <td>{formatoVE(totales.totalEfectivoD)}</td>
              <td>{formatoVE(totales.totalZelle)}</td>
            </tr>
          </tbody>
        </table>

      </div>
      {reporte.length > 0 && (
  <>
    <h3 style={{
      textAlign: "center",
      marginTop: "30px",
      marginBottom: "10px",
      fontWeight: "bold"
    }}>
      Resumen de Ventas por Actividad Productiva
    </h3>

    <table
      border="1"
      cellPadding="8"
      style={{
        width: "70%",
        margin: "0 auto 40px auto",
        borderCollapse: "collapse",
        textAlign: "center",
        backgroundColor: "white"
      }}
    >
      <thead style={{ backgroundColor: colorTabla }}>
        <tr>
          <th>Actividad Productiva</th>
          <th>Cantidad</th>
          <th>Total Ventas</th>
        </tr>
      </thead>

      <tbody>
        {actividadesResumen.map((actividad) => (
          <tr
            key={actividad.id}
            style={{
              backgroundColor: "white",
              fontWeight: actividad.id === "SIN_ACTIVIDAD" ? "bold" : "normal"
            }}
          >
            <td style={{ textAlign: "left" }}>
              {actividad.descripcion}
            </td>

            <td>
              {formatoVE(actividad.cantidad)}
            </td>

            <td style={{ textAlign: "right" }}>
              $ {formatoVE(actividad.total)}
            </td>
          </tr>
        ))}
      </tbody>

      <tfoot>
        <tr style={{
          backgroundColor: colorTabla,
          fontWeight: "bold"
        }}>
          <td style={{ textAlign: "left" }}>
            TOTAL
          </td>

          <td>
            {formatoVE(
              actividadesResumen.reduce(
                (total, actividad) =>
                  total + Number(actividad.cantidad || 0),
                0
              )
            )}
          </td>

          <td style={{ textAlign: "right" }}>
            $ {formatoVE(totalResumenActividades)}
          </td>
        </tr>
      </tfoot>
    </table>
  </>
)}
    </div>
  );
};

export default DiarioVentas;
