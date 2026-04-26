// src/pages/ReporteVentas.jsx
import Encabezado from "../components/Encabezado";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const ReporteVentas = () => {
  const navigate = useNavigate();
  const formularioRef = useRef(null);

  // -------------------------
  // ESTILOS (MISMOS QUE SALIDAS)
  // -------------------------
  const estiloBoton = {
    width: "15%",
    padding: "10px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "900",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "10px"
  };

  const botonBuscar = {
    width: "50%",
    padding: "6px",
    backgroundColor: "#D98897",
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
    backgroundColor: "#EDC5CD",
    fontFamily: "Arial",
    fontSize: "14px"
  };

  // -------------------------
  // ESTADOS
  // -------------------------
  const [desde, setDesde] = useState(new Date().toISOString().substring(0, 10));
  const [hasta, setHasta] = useState(new Date().toISOString().substring(0, 10));
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

  const formatoVE = (valor) => {
    if (!valor) return "0,00";
    return Number(valor).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // -------------------------
  // CARGAR REPORTE
  // -------------------------
  const cargarReporte = async () => {
    if (!desde || !hasta) {
      alert("Debe seleccionar un rango de fechas");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/ventas/reporte/${desde}/${hasta}`);
      const data = await res.json();

      if (!data.ok) {
        alert(data.msg || "No hay datos para este rango");
        setReporte([]);
        setTotales({
          totalEfectivoP: 0,
          totalTransferenciaP: 0,
          totalEfectivoBs: 0,
          totalTransferenciaBs: 0,
          totalPuntoBs: 0,
          totalPagomovilBs: 0,
          totalEfectivoD: 0,
          totalZelle: 0
        });
        return;
      }

      setReporte(data.reporte || []);
      setTotales(data.totales || {});
      formularioRef.current?.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
      console.error("Error cargando reporte:", error);
      alert("Error cargando reporte");
    }
  };

  const eliminarFacturaDesdeDiario = async (factura) => {
  const confirmar = window.confirm(
    "¿Está seguro que desea ELIMINAR la factura completa?\n" +
    "Se eliminarán: venta, productos y pagos.\n" +
    "Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  try {
    const res = await fetch(
      `${API_URL}/api/facturas/eliminar-completa/${factura}`,
      { method: "DELETE" }
    );

    const json = await res.json();

    if (!json.ok) {
      alert("No se pudo eliminar la factura.");
      return;
    }

    alert("Factura eliminada correctamente.");

    // Recargar el reporte
    cargarReporte();
  } catch (error) {
    console.error("Error eliminando factura:", error);
    alert("Hubo un error al eliminar la factura.");
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
    <Encabezado />

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
            onChange={(e) => setDesde(e.target.value)}
            style={{ width: "45%", padding: "5px" }}
          />

          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            style={{ width: "45%", padding: "5px" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            className="botonElegante"
            style={botonBuscar}
            onClick={cargarReporte}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* BOTÓN VOLVER */}      
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button
          onClick={() => {
          window.close();
          }}
          style={estiloBoton}
        >
          Volver al MENÚ PRINCIPAL
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
        <thead>
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
  {reporte.map((item) => (
    <React.Fragment key={item.venta.factura}>

      {item.productos.map((p, i) => (
        <tr key={p._id || `${item.venta.factura}-${i}`}>

          {i === 0 ? (
            <>
              <td>{new Date(item.venta.fecha).toLocaleDateString("es-VE")}</td>
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

        {/* TOTALES FINALES */}
        <h3 style={{ textAlign: "center", marginTop: "30px", marginBottom: "10px", fontWeight: "bold" }}>
          Totales Finales por Método de Pago
        </h3>

        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center", marginBottom: "40px" }}>
          <thead>
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
    </div>
  );
};

export default ReporteVentas;
