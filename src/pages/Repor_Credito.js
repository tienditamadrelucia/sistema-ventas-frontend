import Encabezado from "../components/Encabezado";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const Repor_Credito = () => {
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

  // -------------------------
  // FORMATO VENEZOLANO
  // -------------------------
  const formatoVE = (valor) => {
    if (!valor) return "0,00";
    return Number(valor).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // -------------------------
  // CARGAR REPORTE DE CRÉDITOS
  // -------------------------
  const cargarReporte = async () => {
    if (!desde || !hasta) {
      alert("Debe seleccionar un rango de fechas");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/ventas/reporte-creditos/${desde}/${hasta}`);      
      const data = await res.json();

      if (!data.ok) {
        alert(data.msg || "No hay datos para este rango");
        setReporte([]);
        return;
      }

      setReporte(data.reporte || []);
      formularioRef.current?.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
      console.error("Error cargando reporte:", error);
      alert("Error cargando reporte");
    }
  };

  const eliminarFacturaDesdeCredito = async (factura) => {
  const confirmar = window.confirm(
    "¿Está seguro que desea ELIMINAR esta venta a CRÉDITO?\n" +
    "Se eliminarán: venta, productos y abonos.\n" +
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

    // Recargar el reporte de créditos
    cargarReporte();
  } catch (error) {
    console.error("Error eliminando factura:", error);
    alert("Hubo un error al eliminar la factura.");
  }
};


  return (
    <div>
      <Encabezado />

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "bold" }}>
          Reporte de Ventas a Crédito
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
            onClick={() => window.close()}
            style={estiloBoton}
          >
            Volver al MENÚ PRINCIPAL
          </button>
        </div>

        {/* ⭐⭐⭐ TABLA CONTINUA ⭐⭐⭐ */}
        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Código</th>
              <th>Descripción</th>
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

                {/* PRODUCTOS */}
                {item.productos.map((p, i) => (
                  <tr key={`${item.venta.factura}-${i}`}>
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
                        onClick={() => eliminarFacturaDesdeCredito(item.venta.factura)}
                      >
                        🗑️
                      </button>
                    </td>
                    )}

                  </tr>
                ))}

                {/* ⭐ ABONOS ⭐ */}
                <tr>
                  <td colSpan="10" style={{ background: "#f7f7f7", textAlign: "center" }}>
                    <strong>ABONOS RECIBIDOS</strong>

                    <table style={{ width: "100%", marginTop: "10px" }}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Efectivo Pesos</th>
                          <th>Transferencia Pesos</th>
                          <th>Efectivo Bs</th>
                          <th>Transferencia Bs</th>
                          <th>Punto</th>
                          <th>Pago Móvil</th>
                          <th>Efectivo $</th>
                          <th>Zelle</th>
                        </tr>
                      </thead>

                      <tbody>
                        {item.abonos.map((a, idx) => (
                          <tr key={idx}>
                            <td>{new Date(a.fecha).toLocaleDateString("es-VE")}</td>
                            <td>{formatoVE(a.efectivoP)}</td>
                            <td>{formatoVE(a.transferenciaP)}</td>
                            <td>{formatoVE(a.efectivoBs)}</td>
                            <td>{formatoVE(a.transferenciaBs)}</td>
                            <td>{formatoVE(a.puntoBs)}</td>
                            <td>{formatoVE(a.pagomovilBs)}</td>
                            <td>{formatoVE(a.efectivoD)}</td>
                            <td>{formatoVE(a.zelle)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* ⭐ SALDOS ⭐ */}
                    <div style={{ textAlign:"right", marginTop: "10px", fontFamily: "Roboto Mono" }}>
                      <strong>SALDOS PENDIENTES:</strong>
                      <div>{"Saldo en Pesos:".padEnd(20) + formatoVE(item.saldo.pesos)}</div>
                      <div>{"Saldo en Bs:".padEnd(20) + formatoVE(item.saldo.bolivares)}</div>
                      <div>{"Saldo en $:".padEnd(20) + formatoVE(item.saldo.dolares)}</div>
                    </div>
                  </td>
                </tr>

              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Repor_Credito;
