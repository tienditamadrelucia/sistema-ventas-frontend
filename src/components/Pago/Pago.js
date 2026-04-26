import React, { useState, useEffect } from "react";
import { registrarMoneda, buscarPagoPorFactura, 
  buscarVueltoPorFactura, actualizarMoneda, eliminarMoneda } from "../../services/ser_moneda";

const Pago = ({
  modoCredito,
  facturaNumero,
  fecha,
  totalDolar,
  totalPeso,
  totalBs,
  tasaP,
  tasaD,
  pagoExistente,
  vueltoExistente,
  onCerrar,
  onPagoCompletado
}) => {  
  const [total, setTotal] = useState(0);

  const [efectivoP, setEfectivoP] = useState(0);
  const [transferenciaP, setTransferenciaP] = useState(0);
  const [referenciaP, setReferenciaP] = useState("");
  const [bancoP, setBancoP] = useState("");

  const [efectivoBs, setEfectivoBs] = useState(0);
  const [transferenciaBs, setTransferenciaBs] = useState(0);
  const [referenciaBs, setReferenciaBs] = useState("");
  const [bancoBs, setBancoBs] = useState("");

  const [puntoBs, setPuntoBs] = useState(0);
  const [pagomovilBs, setPagomovilBs] = useState(0);
  const [referenciaPMBs, setReferenciaPMBs] = useState("");
  const [bancoPMBs, setBancoPMBs] = useState("");
  const [IdVueltoExistente, setIdVueltoExistente] = useState("");
  const [idPagoExistente, setIdPagoExistente] = useState(null);
  // ⭐ Control de flujo después de registrar pago
  const [pagoRegistrado, setPagoRegistrado] = useState(false);
  const [vueltoUsdUsuario, setVueltoUsdUsuario] = useState(0);
  const [vueltoBsUsuario, setVueltoBsUsuario] = useState(0);
  const [vueltoCopUsuario, setVueltoCopUsuario] = useState(0);
  // PAGOS USD
  const [pagoUsdEfectivo, setPagoUsdEfectivo] = useState("");
  const [pagoUsdZelle, setPagoUsdZelle] = useState("");
  const [refUsdZelle, setRefUsdZelle] = useState("");
  const [bancoUsdZelle, setbancoUsdZelle] = useState("");

  // PAGOS BS
  const [pagoBsEfectivo, setPagoBsEfectivo] = useState("");
  const [pagoBsTransferencia, setPagoBsTransferencia] = useState("");
  const [refBsTransferencia, setRefBsTransferencia] = useState("");
  const [bancoBsTransferencia, setBancoBsTransferencia] = useState("");
  const [pagoBsPunto, setPagoBsPunto] = useState("");
  const [refPunto, setRefPunto] = useState("");
  const [lotePunto, setLotePunto] = useState("");
  const [pagoBsMovil, setPagoBsMovil] = useState("");
  const [refMovil, setRefMovil] = useState("");
  const [bancoMovil, setBancoMovil] = useState("");

  // PAGOS COP
  const [pagoCopEfectivo, setPagoCopEfectivo] = useState("");
  const [pagoCopTransferencia, setPagoCopTransferencia] = useState("");
  const [refCopTransferencia, setRefCopTransferencia] = useState("");
  const [bancoCopTransferencia, setBancoCopTransferencia] = useState("");

    // VUELTO DEL SISTEMA
  const [vueltoUsdSistema, setVueltoUsdSistema] = useState(0);
  const [vueltoCopSistema, setVueltoCopSistema] = useState(0);
  const [vueltoBsSistema, setVueltoBsSistema] = useState(0);  
  const [totalAbonado, setTotalAbonado] = useState(0);
  
const formatoVE = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const dataMoneda = {
  fecha,
  factura: facturaNumero,
  operacion: modoCredito ? "ABONO DE CREDITO" : "VENTA",
  total: totalDolar,
  // ⭐ COP
  efectivoP: Number(pagoCopEfectivo || 0),
  transferenciaP: Number(pagoCopTransferencia || 0),
  referenciaP: refCopTransferencia || "",
  bancoP: bancoCopTransferencia || "",
  // ⭐ BS
  efectivoBs: Number(pagoBsEfectivo || 0),
  transferenciaBs: Number(pagoBsTransferencia || 0),
  referenciaTBs: refBsTransferencia || "",
  bancoTBs: bancoBsTransferencia || "",
  puntoBs: Number(pagoBsPunto || 0),
  pagomovilBs: Number(pagoBsMovil || 0),
  referenciaPMBs: refMovil || "",
  bancoPMBs: bancoMovil || "",
  // ⭐ USD
  efectivoD: Number(pagoUsdEfectivo || 0),
  zelle: Number(pagoUsdZelle || 0),
  referenciaZ: refUsdZelle || "",
  bancoZ: bancoUsdZelle || ""
};

  const dataVuelto = {
  fecha,
  factura: facturaNumero,
  operacion: "VUELTOS",
  montoUsd: Number(vueltoUsdUsuario || 0),
  montoBs: Number(vueltoBsUsuario || 0),
  montoCop: Number(vueltoCopUsuario || 0),
  // agrega aquí los campos que tú usas para vuelto
};

  const estiloBoton = {
    width: "20%",
    padding: "5px",
    backgroundColor: "#D98897",
    color: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontWeight: "800",
    fontFamily: "Arial Black",
    cursor: "pointer",
    marginTop: "5px"
  };

  const BANCOS = [
    "100% Activo",
    "Agrícola de Venezuela",
    "Bancamiga",
    "Bancaribe",
    "Bancolombia",
    "Bancrecer",
    "Banesco",
    "BANFANB",
    "Bangente",
    "Banplus",
    "Bicentenario del Pueblo",
    "Caroní",
    "DelSur",
    "Exterior",
    "Fondo Común",
    "Mercantil",
    "Mi Banco",
    "Nacional de Crédito",
    "Provincial",
    "Sofitasa",
    "Tesoro",
    "Venezolano de Crédito",
    "Venezuela",
    "Zelle"
  ];

  // TOTAL PAGADO EN USD
  const totalPagadoUSD =
    Number(pagoUsdEfectivo || 0) +
    Number(pagoUsdZelle || 0) +
    (Number(pagoBsEfectivo || 0) / tasaD) +
    (Number(pagoBsTransferencia || 0) / tasaD) +
    (Number(pagoBsPunto || 0) / tasaD) +
    (Number(pagoBsMovil || 0) / tasaD)+
    (Number(pagoCopEfectivo || 0) / tasaP) +
    (Number(pagoCopTransferencia || 0) / tasaP);

  const totalPagadoBs=
    (Number(pagoBsEfectivo || 0) / tasaD) +
    (Number(pagoBsTransferencia || 0) / tasaD) +
    (Number(pagoBsPunto || 0) / tasaD) +
    (Number(pagoBsMovil || 0) / tasaD) +
    (Number(pagoUsdEfectivo || 0) * tasaD)+
    (Number(pagoUsdZelle || 0) *tasaD)+
    ((Number(pagoCopEfectivo || 0) / tasaP))*tasaD +
    ((Number(pagoCopTransferencia || 0) / tasaP))*tasaD;

  const totalPagadoCOP =
    Number(pagoCopEfectivo || 0) + Number(pagoCopTransferencia || 0)+
    (((Number(pagoBsEfectivo || 0)+ Number(pagoBsTransferencia || 0)+ Number(pagoBsPunto || 0)+ Number(pagoBsMovil || 0)) / tasaD)*tasaP)+
    (Number(pagoUsdEfectivo || 0) + Number(pagoUsdZelle || 0) * tasaP);

  let faltanteUSD = 0;
  let faltanteCOP = 0;
  let faltanteBs = 0;
  if (!modoCredito) {
    // ⭐ SOLO PARA CONTADO
    faltanteUSD = totalDolar - totalPagadoUSD;
    faltanteCOP = faltanteUSD * tasaP;
    faltanteBs = faltanteUSD * tasaD;
  }

  const cargarPagoEnCampos = (moneda) => {
    setIdPagoExistente(moneda._id);
    setPagoUsdEfectivo(moneda.efectivoD || 0);
    setPagoUsdZelle(moneda.zelle || 0);
    setPagoBsEfectivo(moneda.efectivoBs || 0);
    setPagoBsTransferencia(moneda.transferenciaBs || 0);
    setRefBsTransferencia(moneda.referenciaTBs || "");
    setBancoBsTransferencia(moneda.bancoTBs || "");
    setPagoBsPunto(moneda.puntoBs || 0);
    setRefPunto(moneda.refPunto || "");
    setLotePunto(moneda.lotePunto || "");
    setPagoBsMovil(moneda.pagomovilBs || 0);
    setRefMovil(moneda.referenciaPMBs || "");
    setBancoMovil(moneda.bancoPMBs || "");
    setPagoCopEfectivo(moneda.efectivoP || 0);
    setPagoCopTransferencia(moneda.transferenciaP || 0);
    setRefCopTransferencia(moneda.referenciaP || "");
    setBancoCopTransferencia(moneda.bancoP || "");
    setbancoUsdZelle(moneda.bancoZ || "");
    setRefUsdZelle(moneda.referenciaZ || "");      
  };   

    const cargarVueltoEnCampos = (moneda) => {    
    setIdVueltoExistente(moneda._id);
    setVueltoUsdUsuario(Math.abs(moneda.efectivoD || 0));
    setVueltoCopUsuario(Math.abs(moneda.efectivoP || 0));
    setVueltoBsUsuario(Math.abs(moneda.efectivoBs || 0));
  };   

  // CALCULAR VUELTO DEL SISTEMA
  useEffect(() => {
    if (totalPagadoUSD > totalDolar) {
      const vuelto = totalPagadoUSD - totalDolar;
      setVueltoUsdSistema(vuelto);
      setVueltoCopSistema(vuelto * tasaP);
      setVueltoBsSistema(vuelto * tasaD);
    } else {
      setVueltoUsdSistema(0);
      setVueltoCopSistema(0);
      setVueltoBsSistema(0);
    }
  }, [totalPagadoUSD, totalDolar, tasaP, tasaD]);

  useEffect(() => {
    if (pagoExistente) {
      cargarPagoEnCampos(pagoExistente);
    }
    if (vueltoExistente) {
      cargarVueltoEnCampos(vueltoExistente);
    }
  }, [pagoExistente, vueltoExistente]);

  useEffect(() => {
  const abonado =
    Number(pagoUsdEfectivo || 0) +
    Number(pagoUsdZelle || 0) +
    Number(pagoBsEfectivo || 0) +
    Number(pagoBsTransferencia || 0) +
    Number(pagoBsPunto || 0) +
    Number(pagoBsMovil || 0) +
    Number(pagoCopEfectivo || 0) +
    Number(pagoCopTransferencia || 0);

  setTotalAbonado(abonado);
}, [
  pagoUsdEfectivo,
  pagoUsdZelle,
  pagoBsEfectivo,
  pagoBsTransferencia,
  pagoBsPunto,
  pagoBsMovil,
  pagoCopEfectivo,
  pagoCopTransferencia
]);

useEffect(() => {
  if (modoCredito) {
    const abono = totalPagadoUSD - vueltoUsdUsuario;
    setTotalAbonado(abono);
    }
    }, [modoCredito, totalPagadoUSD, vueltoUsdUsuario]);

  const vuelto = totalPagadoUSD - totalDolar;
  // VUELTO ENTREGADO (en USD)
  const vueltoUsuarioUSD =
  Number(vueltoUsdUsuario || 0) +
  (Number(vueltoCopUsuario || 0) / tasaP) +
  (Number(vueltoBsUsuario || 0) / tasaD);
  // FALTA POR ENTREGAR (en USD)
  const faltaXUSD = 
    vuelto -
  (
    Number(vueltoUsdUsuario || 0) +
    (Number(vueltoCopUsuario || 0) / tasaP) +
    (Number(vueltoBsUsuario || 0) / tasaD)
  );

  // FALTA POR ENTREGAR (en COP)
  const faltaXCOP = 
    (vuelto * tasaP) -
    (
    Number(vueltoCopUsuario || 0) +
    (Number(vueltoUsdUsuario || 0) * tasaP) +
    ((Number(vueltoBsUsuario || 0) / tasaD) * tasaP)
  );

  // FALTA POR ENTREGAR (en Bs)
  const faltaXBs = 
    (vuelto * tasaD) -
  (
    Number(vueltoBsUsuario || 0) +
    (Number(vueltoUsdUsuario || 0) * tasaD) +
    ((Number(vueltoCopUsuario || 0) / tasaP) * tasaD)
  );

const vueltoCorrecto =
  Math.abs(vueltoUsuarioUSD - vueltoUsdSistema) < 0.01;

const facturaCancelada = modoCredito
  ? totalAbonado>0
  : totalPagadoUSD >= totalDolar && vueltoCorrecto;  
  const limpiarTodo = () => {
    const limpiarTodo = () => {
    // USD
    setPagoUsdEfectivo("");
    setPagoUsdZelle("");
    setbancoUsdZelle("");    
    setRefUsdZelle("");
    // BS EFECTIVO
    setPagoBsEfectivo("");
    // BS TRANSFERENCIA
    setPagoBsTransferencia("");
    setRefBsTransferencia("");
    setBancoBsTransferencia("");
    // BS PUNTO
    setPagoBsPunto("");
    setRefPunto("");
    setLotePunto("");
    // BS PAGO MÓVIL
    setPagoBsMovil("");
    setRefMovil("");
    setBancoMovil("");
    // COP EFECTIVO
    setPagoCopEfectivo("");
    // COP TRANSFERENCIA
    setPagoCopTransferencia("");
    setRefCopTransferencia("");
    setBancoCopTransferencia("");
    // VUELTOS
    setVueltoUsdUsuario("");
    setVueltoCopUsuario("");
    setVueltoBsUsuario("");
    // ESTADOS INTERNOS    
    setTotalAbonado(0);    
    };
  };

  return (
    <div className="modal">
      <div className="modal-contenido" style={{ width: "900px" }}>

        <h2 style={{ textAlign: "center", marginBottom: "1px" }}>
          REGISTRO DE PAGO
        </h2>
        
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1px"
        }}>
          <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            color: "white",
            fontWeight: "bold"
          }}>
            <label>Total USD</label>
            <div style={{
              backgroundColor: "white",
              padding: "8px",
              borderRadius: "6px",
              marginTop: "5px",
              color: "black"
            }}>
              {formatoVE.format(totalDolar)}
            </div>
          </div>

          <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            color: "white",
            fontWeight: "bold"
          }}>
            <label>Total COP</label>
            <div style={{
              backgroundColor: "white",
              padding: "8px",
              borderRadius: "6px",
              marginTop: "5px",
              color: "black"
            }}>
              {formatoVE.format(totalPeso)}
            </div>
          </div>

          <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            color: "white",
            fontWeight: "bold"
          }}>
            <label>Total Bs</label>
            <div style={{
              backgroundColor: "white",
              padding: "8px",
              borderRadius: "6px",
              marginTop: "5px",
              color: "black"
            }}>
              {formatoVE.format(totalBs)}
            </div>
          </div>
        </div>


      <div style={{
        display:"flex",
        marginLeft:"70px",
        gap:"60px"                
        }}>
        <h3 style={{ marginTop: 0 }}>Efectivo</h3>
        <h3 style={{ marginTop: 0 }}>Transferencia</h3>
        <h3 style={{ marginTop: 0 }}>Referencia</h3>
        <h3 style={{ marginTop: 0 }}>Banco</h3>
        <h3 style={{ marginTop: 0 }}>Pago Móvil</h3>
        <h3 style={{ marginTop: 0 }}>Punto</h3>
      </div>       
      <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
        <label>--Bs.</label>                
        <input type="number" step="1" value={pagoBsEfectivo}              
          onChange={(e) => setPagoBsEfectivo(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />     
        <input type="number" step="0.1" value={pagoBsTransferencia}              
          onChange={(e) => setPagoBsTransferencia(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input type="number" value={refBsTransferencia}              
          onChange={(e) => setRefBsTransferencia(e.target.value)}
          style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input list="listaBancos" value={bancoBsTransferencia}              
          onChange={(e) => setBancoBsTransferencia(e.target.value)}
          style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <datalist id="listaBancos">
          {BANCOS.map((banco) => (
          <option key={banco} value={banco} style={{
            padding:"1px 1px",
            lineHeight:"1",
            fontSize:"14px"
            }}
          />
          ))}
        </datalist>        
        <input type="number" step="0.1" value={pagoBsMovil}              
          onChange={(e) => setPagoBsMovil(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input type="number" step="0.1" value={pagoBsPunto}              
          onChange={(e) => setPagoBsPunto(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />        
      </div>    
        
      <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
        <label>USD</label>
        <input type="number" step="1" value={pagoUsdEfectivo}              
          onChange={(e) => setPagoUsdEfectivo(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input type="number" step="0.1" value={pagoUsdZelle}              
          onChange={(e) => setPagoUsdZelle(e.target.value)}
          style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input type="number" value={refUsdZelle}              
          onChange={(e) => setRefUsdZelle(e.target.value)}
          style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />
        <input list="listaBancos" value={bancoUsdZelle}              
          onChange={(e) => setbancoUsdZelle(e.target.value)}
          style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />            
        <datalist id="listaBancos">
          {BANCOS.map((banco) => (
          <option key={banco} value={banco} style={{
            padding:"1px 1px",
            lineHeight:"1",
            fontSize:"14px"
            }}
          />
          ))}
        </datalist>
        <label>Recibo del Punto-------</label>                
        <input type="number" step="1" value={pagoBsEfectivo}              
          onChange={(e) => setPagoBsEfectivo(e.target.value)}
          style={{ width: "76px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
        <label>COP</label>
          <input type="number" step="1" value={pagoCopEfectivo}              
            onChange={(e) => setPagoCopEfectivo(e.target.value)}
            style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
          />
          <input type="number" step="1" value={pagoCopTransferencia}              
            onChange={(e) => setPagoCopTransferencia(e.target.value)}
            style={{ width: "110px", padding: "8px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
          />
          <input type="number" value={refCopTransferencia}              
            onChange={(e) => setRefCopTransferencia(e.target.value)}
            style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
          />
          <input list="listaBancos" value={bancoCopTransferencia}              
            onChange={(e) => setBancoCopTransferencia(e.target.value)}
            style={{ width: "110px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
          />            
          <datalist id="listaBancos">
          {BANCOS.map((banco) => (
          <option key={banco} value={banco} style={{
            padding:"1px 1px",
            lineHeight:"1",
            fontSize:"14px"
            }}
          />
          ))}
        </datalist>
        <label>Lote del Punto No.-----</label>                
        <input type="number" step="1" value={pagoBsEfectivo}              
          onChange={(e) => setPagoBsEfectivo(e.target.value)}
          style={{ width: "76px", padding: "8px", borderRadius: "6px", border: "1px solid #bbb" }}
        />
      </div>        

      {/* TOTAL PAGADO EN 3 CASILLAS */}
      <h3>Total Pagado</h3>
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "1px"
        }}>
        <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "5px",
            borderRadius: "8px",
            textAlign: "center",            
            fontWeight: "bold",
            color:"white"
          }}>
            <label>USD</label>
            <div style={{
              backgroundColor: "white",
              padding: "5px",
              borderRadius: "6px",
              marginTop: "1px",
              color:"black"
            }}>
              {formatoVE.format(totalPagadoUSD)}
            </div>
        </div>
        <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "5px",
            borderRadius: "8px",
            fontWeight: "bold",
            textAlign: "center",
            color:"white"
          }}>
            <label>COP</label>
            <div style={{
              backgroundColor: "white",
              padding: "5px",
              borderRadius: "6px",
              marginTop: "1px",
              color:"black"
            }}>
              {formatoVE.format(totalPagadoUSD*tasaP)}
            </div>
        </div>
        <div style={{
            flex: 1,
            backgroundColor: "#6699ff",
            padding: "5px",
            borderRadius: "8px",            
            fontWeight: "bold",
            textAlign: "center",
            color:"white"
          }}>
            <label>Bs</label>
            <div style={{
              backgroundColor: "white",
              padding: "5px",
              borderRadius: "6px",
              marginTop: "1px",
              color:"black"
            }}>
              {formatoVE.format(totalPagadoUSD*tasaD)}
            </div>
        </div>
      </div>

      {/* FALTANTE */}
      <div style={{ textAlign: "center", marginBottom: "1px" }}>
        {faltanteUSD > 0 ? (
          <span style={{ color: "red", fontWeight: "bold" }}>
            Faltan: {formatoVE.format(faltanteUSD)} USD{"-------------------------"} {formatoVE.format(faltanteCOP)} COP{"-------------------------"} {formatoVE.format(faltanteBs)} Bs
          </span>
          ) : (
          <span style={{ color: "green", fontWeight: "bold" }}>
            Pago completo
          </span>
        )}
      </div>

      {/* VUELTO DEL SISTEMA */}
      <div style={{  
        padding: "1px",
        borderRadius: "10px",
        marginBottom: "1px"  
        }}>  
        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Vuelto del Sistema</h3>
          <div style={{
            display: "flex",
            gap: "12px"
            }}>
            {/* USD */}
            <div style={{
              flex: 1,
              backgroundColor: "#C27D8B",
              padding: "1px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold"
              }}>
              <label>USD</label>
              <div style={{
                marginTop: "1px",
                backgroundColor: "white",
                padding: "1px",
                borderRadius: "6px"
                }}>
                {formatoVE.format(vueltoUsdSistema)}
              </div>
            </div>
            {/* COP */}
            <div style={{
              flex: 1,
              backgroundColor: "#C27D8B",
              padding: "1px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold"
              }}>
              <label>COP</label>
              <div style={{
                marginTop: "1px",
                backgroundColor: "white",
                padding: "1px",
                borderRadius: "6px"
                }}>
                {formatoVE.format(vueltoCopSistema)}
              </div>
            </div>
            {/* BS */}
            <div style={{
              flex: 1,
              backgroundColor: "#C27D8B",
              padding: "1px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold"
              }}>
              <label>Bs</label>
              <div style={{
                marginTop: "1px",
                backgroundColor: "white",
                padding: "1px",
                borderRadius: "6px"
                }}>
                {formatoVE.format(vueltoBsSistema)}
              </div>
            </div>
          </div>
        </div>        

        {/* VUELTO ENTREGADO */}
        <div style={{
          backgroundColor: "white",
          padding: "1px",
          borderRadius: "8px",
          marginBottom: "1px",
          marginLeft:"10px"
          }}>
          <h3>Vuelto Entregado</h3>
          <div style={{ display: "flex", gap: "12px", marginBottom:"10px" }}>            
              <label>USD--</label>
              <input type="number"
                value={vueltoUsdUsuario}
                disabled={modoCredito}
                onChange={(e) => setVueltoUsdUsuario(e.target.value)}
                style={{ width: "110px", padding: "5px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
              />                      
              <label>COP--</label>
              <input type="number"
                value={vueltoCopUsuario}
                disabled={modoCredito}
                onChange={(e) => setVueltoCopUsuario(e.target.value)}
                style={{ width: "110px", padding: "5px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
              />          
              <label>Bs--</label>
              <input type="number"
                value={vueltoBsUsuario}
                disabled={modoCredito}
                onChange={(e) => setVueltoBsUsuario(e.target.value)}
                style={{ width: "110px", padding: "5px", backgroundColor:"#EDC5CD", borderRadius: "6px", border: "1px solid #bbb" }}
              />  
            </div>        
            {/* RESTANTE DEL VUELTO */}
            <div 
              style={{ textAlign: "left", marginTop: "1px" }}>
              {vueltoUsuarioUSD < vueltoUsdSistema ? (
              <span style={{ color: "red", fontWeight: "bold" }}>
                Falta entregar: {formatoVE.format(faltaXUSD || 0)} USD{"---------------"} {formatoVE.format(faltaXCOP || 0)} COP{"---------------"} {formatoVE.format(faltaXBs || 0)} Bs
                </span>
                ) : (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      Vuelto completo
                  </span>
                )}
            </div>            
        </div>              

        {/* BOTONES */}
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px"
            }}>          
            <button style={estiloBoton} onClick={onCerrar}>
              Volver a la Factura
            </button>

            <button style={estiloBoton} onClick={limpiarTodo}>
               Borrar
            </button>

            <button
              style={{
              ...estiloBoton,
              opacity: facturaCancelada ? 1 : 0.4,
              cursor: facturaCancelada ? "pointer" : "not-allowed"
              }}
              disabled={!facturaCancelada}
              onClick={async () => {
              // ============================
              // VALIDACIONES DE REFERENCIAS
              // ============================
              // PUNTO
              if (Number(pagoBsPunto) > 0) {
                if (!refPunto || !lotePunto) {
                  alert("Debe ingresar referencia y lote para el pago por punto");
                  return;
                }
              }
              // COP – TRANSFERENCIA
              if (Number(pagoCopTransferencia) > 0) {
                if (!refCopTransferencia || !bancoCopTransferencia) {
                  alert("Debe ingresar referencia y banco para la transferencia en COP");
                  return;
                }
              } 
              // ============================
              // CONSTRUIR OBJETO dataMoneda
              // ============================
              const [y, m, d] = fecha.split("-");
              const fechaDate = new Date(y, m - 1, d);
              const dataMoneda = {
              fecha: fechaDate,
              operacion: modoCredito ? "ABONO DE CREDITO" : "VENTA",
              factura: facturaNumero,
              total: modoCredito ? totalAbonado : totalDolar,
              // COP
              efectivoP: Number(pagoCopEfectivo || 0),
              transferenciaP: Number(pagoCopTransferencia || 0),
              referenciaP: refCopTransferencia || "",
              bancoP: bancoCopTransferencia || "",
              // BS
              efectivoBs: Number(pagoBsEfectivo || 0),
              transferenciaBs: Number(pagoBsTransferencia || 0),
              referenciaTBs: refBsTransferencia || "",
              bancoTBs: bancoBsTransferencia || "",
              puntoBs: Number(pagoBsPunto || 0),
              refPunto: refPunto || "",
              lotePunto: lotePunto || "",
              pagomovilBs: Number(pagoBsMovil || 0),
              referenciaPMBs: refMovil || "",
              bancoPMBs: bancoMovil || "",
              // USD
              efectivoD: Number(pagoUsdEfectivo || 0),
              zelle: Number(pagoUsdZelle || 0),
              referenciaZ: refUsdZelle || "",
              bancoZ: bancoUsdZelle || ""
            };
            // ============================
            // GUARDAR / ACTUALIZAR PAGO
            // ============================
            let respuestaPago;
            if (idPagoExistente) {
              respuestaPago = await actualizarMoneda(idPagoExistente, dataMoneda);
            } else {
              respuestaPago = await registrarMoneda(dataMoneda);
            }
            if (!respuestaPago.ok) {
              alert("Error al guardar el pago:\n" + JSON.stringify(respuestaPago, null, 2));
              return;
            }
            // ============================
            // MANEJO DEL VUELTO
            // ============================
            let respuestaVuelto = null;
            const hayVueltoNuevo =
            Number(vueltoUsdUsuario || 0) > 0 ||
            Number(vueltoCopUsuario || 0) > 0 ||
            Number(vueltoBsUsuario || 0) > 0;
            if (hayVueltoNuevo) {
              const dataVuelto = {
              fecha: fecha,
              operacion: "VUELTOS",
              factura: facturaNumero,
              total: 0,
              efectivoP: -(Number(vueltoCopUsuario || 0)),
              transferenciaP: 0,
              referenciaP: "",
              bancoP: "",
              efectivoBs: -(Number(vueltoBsUsuario || 0)),
              transferenciaBs: 0,
              referenciaTBs: "",
              bancoTBs: "",
              puntoBs: 0,
              refPunto: 0,
              lotePunto: 0,
              pagomovilBs: 0,
              referenciaPMBs: "",
              bancoPMBs: "",
              efectivoD: -(Number(vueltoUsdUsuario || 0)),
              zelle: 0,
              referenciaZ: "",
              bancoZ: ""
            };
            respuestaVuelto = await registrarMoneda(dataVuelto);
          }
          if (vueltoExistente) {
            const usuarioBorroVuelto =
            Number(vueltoUsdUsuario || 0) === 0 &&
            Number(vueltoCopUsuario || 0) === 0 &&
            Number(vueltoBsUsuario || 0) === 0;
            if (usuarioBorroVuelto) {
              await eliminarMoneda(IdVueltoExistente);
              console.log("🗑️ Vuelto eliminado de la DB");
            }
          }
          alert("💾 Pago grabado con éxito");
          setPagoRegistrado(true);
          // ============================
          // ENVIAR DATOS A VENTAS
          // ============================          
          onPagoCompletado({
            idPago: respuestaPago.data.moneda._id,
            idVuelto: respuestaVuelto?.data?.moneda?._id || null,
            factura: facturaNumero,
            totalAbonado,
            modoCredito
            });
          onCerrar();
          }}
        >
          Grabar
        </button>
        </div>
      </div>    
    </div>
  );
};
export default Pago;