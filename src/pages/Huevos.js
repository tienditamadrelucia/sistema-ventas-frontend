import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import Encabezado from "../components/Encabezado";
import { API_URL } from "../config";

import {
  obtenerFechaVenezuela
} from "../utils/fechaVenezuela";

import {
  consultarHuevos,
  guardarHuevos,
  crearClaveHuevos
} from "../services/huevos";

const campo = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "15px"
};

const celda = {
  padding: "8px",
  border: "1px solid #ccc",
  textAlign: "left"
};

const titulos = {
  grupos: "GRUPOS DE GALLINAS",
  produccion: "REGISTRO DIARIO DE HUEVOS",
  gastos: "GASTOS DE PRODUCCIÓN DE HUEVOS",
  bajas: "BAJAS DE GALLINAS",
  consumo: "CONSUMO INTERNO DE HUEVOS",
  envios: "ENVIAR HUEVOS A TIENDITA",
  recepcion: "RECIBIR HUEVOS DEL MONASTERIO",
  resumen: "RESUMEN DE PRODUCCIÓN DE HUEVOS"
};

const fechaHoy = () =>
  obtenerFechaVenezuela().slice(0, 10);

const fechaTexto = (valor) =>
  String(valor || "")
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("/");

const moneda = (valor) =>
  valor === null || valor === undefined
    ? "Pendiente"
    : Number(valor).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

const equivalencia = (cantidad) =>
  `${Math.floor(cantidad / 30)} cartones, ` +
  `${Math.floor((cantidad % 30) / 15)} medios cartones ` +
  `y ${cantidad % 15} huevos sueltos`;

function Campo({ nombre, children }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "12px"
      }}
    >
      {nombre}

      <div style={{ marginTop: "5px" }}>
        {children}
      </div>
    </label>
  );
}

const vacio = () => ({
  nombre: "",
  fechaInicio: fechaHoy(),
  cantidadInicial: "",
  observaciones: "",
  grupoId: "",
  fecha: fechaHoy(),
  recogidos: "",
  descartados: "0",
  unidades: "",
  motivo: "",
  cartones: "",
  mediosCartones: "",
  sede: "TIENDITA",
  moneda: "D",
  monto: "",
  montoAsignado: "",
  descripcion: "",
  numeroRecibo: "",
  cajaChica: false,
  concepto: "ALIMENTO",
  modoGasto: "NUEVO",
  gastoId: "",
  envioId: "",
  recibidos: "",
  partidos: "0",
  faltantes: "0",
  revisado: false,
  productoMonasterioId: "",
  productoTienditaId: "",
  actividadProductiva: ""
});

export default function Huevos() {
  const { seccion = "grupos" } = useParams();
  const navigate = useNavigate();

  const rol =
    localStorage.getItem("rol") ||
    localStorage.getItem("usuarioRol") ||
    "";

  const adminLocal = rol === "ADMINISTRADOR";

  const sedeUsuario =
    localStorage.getItem("sede") || "TIENDITA";

  const sede =
    seccion === "recepcion"
      ? "TIENDITA"
      : seccion === "consumo"
        ? sedeUsuario
        : "MONASTERIO";

  const esMonasterio = sede === "MONASTERIO";

  const boton = {
    padding: "9px 15px",
    margin: "5px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: esMonasterio
      ? "#B8862D"
      : "#84B09C",
    color: "white",
    fontFamily: "Arial",
    fontWeight: "bold",
    cursor: "pointer"
  };

  const volver = {
    ...boton,
    backgroundColor: esMonasterio
      ? "#5A2D16"
      : "#FC9E9B"
  };

  const encabezadoTabla = {
    backgroundColor: esMonasterio
      ? "#E8D1A5"
      : "#F9CEAE"
  };

  const clavePendiente =
    `huevos:${localStorage.getItem("usuarioNombre") || ""}`;

  const [pendiente, setPendiente] = useState(() => {
    try {
      const guardado = JSON.parse(
        sessionStorage.getItem(clavePendiente) || "null"
      );

      return guardado?.ruta &&
        guardado?.datos?.claveOperacion
        ? guardado
        : null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState(vacio);
  const [datos, setDatos] = useState(null);

  const esAdmin =
    datos?.esAdministrador ?? adminLocal;

  const [revision, setRevision] = useState(0);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [catalogos, setCatalogos] = useState({
    MONASTERIO: [],
    TIENDITA: [],
    actividades: []
  });

  const [gastos, setGastos] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [paginaGastos, setPaginaGastos] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const [rango, setRango] = useState({
    desde: `${fechaHoy().slice(0, 7)}-01`,
    hasta: fechaHoy(),
    sede: "TODAS",
    grupoId: ""
  });

  const [informe, setInforme] = useState(null);

  const ocupado = useRef(false);

  const grupo = datos?.grupos?.find(
    (item) => String(item._id) === form.grupoId
  );

  const envio = datos?.movimientos?.find(
    (item) => String(item._id) === form.envioId
  );

  const bloqueado =
    guardando || Boolean(pendiente);

  const poner = (nombre, valor) =>
    setForm((actual) => ({
      ...actual,
      [nombre]: valor
    }));

  // VALIDAR CANTIDADES ENTERAS
  const n = (valor, nombre, minimo = 0) => {
    if (!/^\d+$/.test(String(valor).trim())) {
      throw new Error(
        `Complete ${nombre} con un número entero.`
      );
    }

    const numero = Number(valor);

    if (
      !Number.isSafeInteger(numero) ||
      numero < minimo
    ) {
      throw new Error(`Revise ${nombre}.`);
    }

    return numero;
  };

  // VALIDAR IMPORTES
  const importe = (valor, nombre) => {
    const cadena = String(valor)
      .trim()
      .replace(",", ".");

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(cadena) ||
      !(Number(cadena) > 0)
    ) {
      throw new Error(
        `Revise ${nombre}: importe positivo con hasta dos decimales.`
      );
    }

    return Number(cadena);
  };
    // LIMPIAR EL FORMULARIO AL CAMBIAR DE PANTALLA
  useEffect(() => {
    setForm(vacio());
    setEditando(null);
    setInforme(null);
    setError("");
    setMensaje("");
  }, [seccion]);

  // CARGAR GRUPOS, MOVIMIENTOS Y EXISTENCIAS
  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError("");

    consultarHuevos("", {
      sede,
      fecha: form.fecha || fechaHoy()
    })
      .then((respuesta) => {
        if (activo) {
          setDatos(respuesta);
        }
      })
      .catch((errorConsulta) => {
        if (activo) {
          setError(errorConsulta.message);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [sede, revision, form.fecha]);

  // CATÁLOGOS PARA LA CONFIGURACIÓN INICIAL
  useEffect(() => {
    if (
      !datos ||
      datos.configuracion ||
      !esAdmin
    ) {
      return undefined;
    }

    let activo = true;

    async function catalogo(url) {
      const res = await fetch(url, {
        credentials: "include"
      });

      const respuesta = await res.json();

      if (
        !res.ok ||
        !Array.isArray(respuesta)
      ) {
        throw new Error(
          "No se pudo consultar el catálogo para configurar huevos."
        );
      }

      return respuesta;
    }

    Promise.all([
      catalogo(
        `${API_URL}/api/productos?sede=MONASTERIO`
      ),
      catalogo(
        `${API_URL}/api/productos?sede=TIENDITA`
      ),
      catalogo(
        `${API_URL}/api/actividad-productiva`
      )
    ])
      .then(([monasterio, tiendita, actividades]) => {
        const ordenar = (lista) =>
          lista
            .filter(
              (producto) =>
                producto.origen === "PRODUCCION_MONASTERIO"
            )
            .sort(
              (a, b) =>
                String(a.descripcion).localeCompare(
                  String(b.descripcion),
                  "es"
                )
            );

        if (activo) {
          setCatalogos({
            MONASTERIO: ordenar(monasterio),
            TIENDITA: ordenar(tiendita),

            actividades: actividades.filter(
              (actividad) => actividad.activa !== false
            )
          });
        }
      })
      .catch((errorCatalogo) => {
        if (activo) {
          setError(errorCatalogo.message);
        }
      });

    return () => {
      activo = false;
    };
  }, [datos, esAdmin]);

  // GASTOS DEL GRUPO SELECCIONADO
  useEffect(() => {
    if (
      seccion !== "gastos" ||
      !form.grupoId
    ) {
      setGastos([]);
      return undefined;
    }

    let activo = true;

    consultarHuevos("/gastos", {
      grupoId: form.grupoId
    })
      .then((respuesta) => {
        if (activo) {
          setGastos(respuesta.gastos);
        }
      })
      .catch((errorGastos) => {
        if (activo) {
          setError(errorGastos.message);
        }
      });

    return () => {
      activo = false;
    };
  }, [seccion, form.grupoId, revision]);

  // ENVIAR UNA SOLICITUD Y CONSERVAR SU IDENTIFICADOR
  async function enviar(ruta, metodo, cuerpo) {
    if (ocupado.current) return;

    ocupado.current = true;

    setError("");
    setMensaje("");

    let operacion = pendiente;

    try {
      if (!operacion) {
        operacion = {
          ruta,
          metodo,
          datos: {
            ...cuerpo,
            claveOperacion: crearClaveHuevos()
          }
        };

        try {
          sessionStorage.setItem(
            clavePendiente,
            JSON.stringify(operacion)
          );
        } catch {
          throw new Error(
            "No se pudo conservar el respaldo de la solicitud. " +
            "No se envió la operación."
          );
        }

        setPendiente(operacion);
      }

      setGuardando(true);

      const resultado = await guardarHuevos(
        operacion.ruta,
        operacion.metodo,
        operacion.datos
      );

      try {
        sessionStorage.removeItem(clavePendiente);
      } catch {
        // Reenviar la misma solicitud no la duplica.
      }

      setPendiente(null);
      setMensaje(resultado.mensaje);

      setForm((actual) => ({
        ...vacio(),
        grupoId: actual.grupoId
      }));

      setEditando(null);

      setRevision(
        (actual) => actual + 1
      );

      window.alert(resultado.mensaje);
    } catch (errorGuardado) {
      // Estas respuestas confirman que la solicitud fue rechazada.
      // Los errores de conexión conservan el respaldo para reintentar.
      if (
        [400, 403, 404, 409, 423].includes(
          errorGuardado.status
        )
      ) {
        try {
          sessionStorage.removeItem(clavePendiente);
          setPendiente(null);
        } catch {
          // Conservar el mismo identificador.
        }
      }

      setError(errorGuardado.message);
      window.alert(errorGuardado.message);
    } finally {
      setGuardando(false);
      ocupado.current = false;
    }
  }
    // PREPARAR EL REGISTRO SEGÚN LA PANTALLA
  function guardar(evento) {
    evento.preventDefault();

    if (pendiente) {
      enviar();
      return;
    }

    try {
      let ruta;
      let cuerpo;

      if (!datos?.configuracion) {
        if (
          !form.productoMonasterioId ||
          !form.productoTienditaId ||
          !form.actividadProductiva ||
          !form.revisado
        ) {
          throw new Error(
            "Seleccione los dos productos y la actividad. " +
            "Confirme que sus precios y existencias " +
            "están en cartones de 30."
          );
        }

        ruta = "/configuracion";

        cuerpo = {
          productoMonasterioId: form.productoMonasterioId,
          productoTienditaId: form.productoTienditaId,
          actividadProductiva: form.actividadProductiva,
          confirmarCartones: true
        };
      } else if (seccion === "grupos") {
        if (!form.nombre.trim()) {
          throw new Error(
            "Escriba el nombre del grupo."
          );
        }

        ruta = `/grupos${editando ? `/${editando._id}` : ""}`;

        cuerpo = {
          nombre: form.nombre.trim(),
          fechaInicio: form.fechaInicio,
          cantidadInicial: n(
            form.cantidadInicial,
            "gallinas iniciales",
            1
          ),
          observaciones: form.observaciones,
          versionEsperada: editando?.__v
        };
      } else if (seccion === "recepcion") {
        if (!envio || !form.revisado) {
          throw new Error(
            "Seleccione un envío y márquelo como revisado."
          );
        }

        const recibidos = n(
          form.recibidos,
          "huevos recibidos"
        );

        const partidos = n(
          form.partidos,
          "huevos partidos"
        );

        const faltantes = n(
          form.faltantes,
          "huevos faltantes"
        );

        if (
          recibidos + partidos + faltantes !==
          envio.unidades
        ) {
          throw new Error(
            "Recibidos, partidos y faltantes " +
            "deben sumar los enviados."
          );
        }

        if (
          (partidos || faltantes) &&
          !form.motivo.trim()
        ) {
          throw new Error(
            "Indique el motivo de la diferencia."
          );
        }

        ruta = `/envios/${envio._id}/recepcion`;

        cuerpo = {
          fecha: form.fecha,
          recibidos,
          partidos,
          faltantes,
          motivo: form.motivo,
          observaciones: form.observaciones,
          revisado: true,
          versionEsperada:
            editando?.__v ?? envio.__v
        };
      } else if (seccion === "gastos") {
        if (!form.grupoId) {
          throw new Error(
            "Seleccione el grupo."
          );
        }

        ruta = "/gastos";

        cuerpo = {
          grupoId: form.grupoId,
          concepto: form.concepto,
          montoAsignado: importe(
            form.montoAsignado,
            "monto asignado"
          )
        };

        if (form.modoGasto === "EXISTENTE") {
          if (!form.gastoId) {
            throw new Error(
              "Seleccione el gasto existente."
            );
          }

          cuerpo.gastoId = form.gastoId;
        } else {
          if (!form.descripcion.trim()) {
            throw new Error(
              "Describa el gasto."
            );
          }

          cuerpo = {
            ...cuerpo,
            fecha: form.fecha,
            sede: form.sede,
            moneda: form.moneda,
            monto: importe(
              form.monto,
              "monto total"
            ),
            descripcion: form.descripcion,
            numeroRecibo: form.numeroRecibo,
            cajaChica: form.cajaChica
          };
        }
      } else {
        if (!grupo) {
          throw new Error(
            "Seleccione un grupo."
          );
        }

        const tipos = {
          produccion: "PRODUCCION",
          bajas: "BAJA",
          consumo:
            form.tipoConsumo === "MERMA"
              ? "MERMA"
              : "CONSUMO",
          envios: "ENVIO"
        };

        const tipo = tipos[seccion];

        if (!tipo) {
          throw new Error(
            "Seleccione una opción del módulo."
          );
        }

        cuerpo = {
          tipo,
          grupoId: form.grupoId,
          sede,
          fecha: form.fecha,
          motivo: form.motivo,
          observaciones: form.observaciones,
          versionEsperada: editando?.__v
        };

        if (tipo === "PRODUCCION") {
          cuerpo.recogidos = n(
            form.recogidos,
            "huevos recogidos"
          );

          cuerpo.descartados = n(
            form.descartados,
            "huevos descartados"
          );

          if (
            cuerpo.descartados > cuerpo.recogidos
          ) {
            throw new Error(
              "Los descartados superan los recogidos."
            );
          }
        } else if (tipo === "ENVIO") {
          cuerpo.unidades =
            n(form.cartones || "0", "cartones") * 30 +
            n(
              form.mediosCartones || "0",
              "medios cartones"
            ) * 15;

          if (cuerpo.unidades < 1) {
            throw new Error(
              "Indique las cantidades que enviará."
            );
          }
        } else {
          cuerpo.unidades = n(
            form.unidades,
            "cantidad",
            1
          );
        }

        if (
          ["BAJA", "CONSUMO", "MERMA"].includes(tipo) &&
          !form.motivo.trim()
        ) {
          throw new Error(
            "Indique el motivo o destino."
          );
        }

        ruta =
          `/movimientos${editando ? `/${editando._id}` : ""}`;
      }

      if (window.confirm("¿Confirmar este registro?")) {
        enviar(
          ruta,
          editando ? "PUT" : "POST",
          cuerpo
        );
      }
    } catch (errorValidacion) {
      setError(errorValidacion.message);
      window.alert(errorValidacion.message);
    }
  }

  // CARGAR UN REGISTRO PARA CORREGIRLO
  function editar(item, esGrupo = false) {
    setEditando(item);
    setMensaje("");
    setError("");

    setForm({
      ...vacio(),
      ...item,

      grupoId: esGrupo
        ? ""
        : String(item.grupoId),

      fecha: String(
        item.fecha || fechaHoy()
      ).slice(0, 10),

      fechaInicio: String(
        item.fechaInicio || fechaHoy()
      ).slice(0, 10),

      tipoConsumo: item.tipo,

      cartones: item.tipo === "ENVIO"
        ? Math.floor(item.unidades / 30)
        : "",

      mediosCartones: item.tipo === "ENVIO"
        ? (item.unidades % 30) / 15
        : "",

      ...(
        item.recepcion && seccion === "recepcion"
          ? {
              envioId: item._id,
              fecha: String(
                item.recepcion.fecha
              ).slice(0, 10),
              recibidos: item.recepcion.recibidos,
              partidos: item.recepcion.partidos,
              faltantes: item.recepcion.faltantes,
              motivo: item.recepcion.motivo,
              observaciones:
                item.recepcion.observaciones,
              revisado: false
            }
          : {}
      )
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // ELIMINAR UN GRUPO O MOVIMIENTO
  function eliminar(item, esGrupo = false) {
    const confirmar = window.confirm(
      "¿Eliminar este registro? El servidor " +
      "comprobará sus movimientos asociados."
    );

    if (confirmar) {
      enviar(
        `/${esGrupo ? "grupos" : "movimientos"}/${item._id}`,
        "DELETE",
        {
          versionEsperada: item.__v
        }
      );
    }
  }

  // BUSCAR GASTOS YA REGISTRADOS
  async function buscarGastos(pagina = 1) {
    if (buscando) return;

    setBuscando(true);
    setError("");

    try {
      const respuesta = await consultarHuevos(
        "/gastos/disponibles",
        {
          sede: form.sede,
          desde: rango.desde,
          hasta: rango.hasta,
          pagina
        }
      );

      setDisponibles(respuesta.gastos);
      setPaginaGastos(pagina);
      setHayMas(respuesta.hayMas);
      poner("gastoId", "");
    } catch (errorBusqueda) {
      setError(errorBusqueda.message);
    } finally {
      setBuscando(false);
    }
  }

  // CONSULTAR EL INFORME ADMINISTRATIVO
  async function buscarInforme() {
    if (buscando) return;

    setBuscando(true);
    setError("");
    setInforme(null);

    try {
      const respuesta = await consultarHuevos(
        "/informe",
        rango
      );

      setInforme(respuesta);
    } catch (errorInforme) {
      setError(errorInforme.message);
    } finally {
      setBuscando(false);
    }
  }

  // CAMPOS REUTILIZABLES
  function selectorGrupo() {
    return (
      <Campo nombre="Grupo de gallinas">
        <select
          style={campo}
          value={form.grupoId}
          disabled={Boolean(editando)}
          onChange={(e) =>
            poner("grupoId", e.target.value)
          }
        >
          <option value="">-- Seleccione --</option>

          {datos?.grupos.map((item) => (
            <option key={item._id} value={item._id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </Campo>
    );
  }

  function fechaCampo() {
    return (
      <Campo nombre="Fecha">
        <input
          style={campo}
          type="date"
          max={fechaHoy()}
          value={form.fecha}
          onChange={(e) =>
            poner("fecha", e.target.value)
          }
        />
      </Campo>
    );
  }

  function numeroCampo(nombre, propiedad) {
    return (
      <Campo nombre={nombre}>
        <input
          style={campo}
          type="text"
          inputMode="numeric"
          value={form[propiedad] ?? ""}
          onChange={(e) =>
            poner(propiedad, e.target.value)
          }
        />
      </Campo>
    );
  }

  function textoCampo(nombre, propiedad) {
    return (
      <Campo nombre={nombre}>
        <input
          style={campo}
          value={form[propiedad] ?? ""}
          maxLength={2000}
          onChange={(e) =>
            poner(propiedad, e.target.value)
          }
        />
      </Campo>
    );
  }

  // REGISTROS QUE CORRESPONDEN A LA PANTALLA ACTUAL
  const lista = (datos?.movimientos || []).filter(
    (movimiento) => {
      const tipos = {
        produccion: ["PRODUCCION"],
        bajas: ["BAJA"],
        consumo: ["CONSUMO", "MERMA"],
        envios: ["ENVIO"],
        recepcion: ["ENVIO"]
      }[seccion] || [];

      return (
        tipos.includes(movimiento.tipo) &&
        (
          seccion === "recepcion" ||
          movimiento.sede === sede
        ) &&
        (
          !form.grupoId ||
          String(movimiento.grupoId) === form.grupoId
        )
      );
    }
  );

  const nombreGrupo = (grupoId) =>
    datos?.grupos.find(
      (item) =>
        String(item._id) === String(grupoId)
    )?.nombre || "Grupo";

  const formatear = (valor) => fechaTexto(valor);
    return (
    <div
      style={{
        padding: "20px",
        color: esMonasterio ? "#5A2D16" : "black"
      }}
    >
      <Encabezado />

      <style>
        {`
          @media print {
            @page {
              size: landscape;
              margin: 8mm;
            }

            nav, fieldset, button {
              display: none !important;
            }

            table {
              font-size: 9px;
            }
          }
        `}
      </style>

      <h2 style={{ textAlign: "center" }}>
        {titulos[seccion] || "PRODUCCIÓN DE HUEVOS"}
      </h2>

      <nav
        style={{
          textAlign: "center",
          marginBottom: "20px"
        }}
      >
        {Object.entries(titulos)
          .filter(
            ([clave]) =>
              (clave !== "resumen" || esAdmin) &&
              (
                sedeUsuario === "MONASTERIO" ||
                ["recepcion", "consumo", "resumen"].includes(clave)
              )
          )
          .map(([clave, titulo]) => (
            <button
              key={clave}
              type="button"
              style={boton}
              disabled={guardando || Boolean(pendiente)}
              onClick={() =>
                navigate(`/huevos/${clave}`)
              }
            >
              {titulo.replace(" DE HUEVOS", "")}
            </button>
          ))}
      </nav>

      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          style={boton}
          disabled={cargando || bloqueado}
          onClick={() =>
            setRevision((actual) => actual + 1)
          }
        >
          ACTUALIZAR INFORMACIÓN
        </button>
      </div>

      {cargando && (
        <p style={{ textAlign: "center" }}>
          Consultando información...
        </p>
      )}

      {datos?.configuracion && (
        <p style={{ textAlign: "center" }}>
          <strong>
            Existencia general actual en {sede}:{" "}
            {datos.existenciaTotalHuevos} huevos.
          </strong>

          <br />

          {equivalencia(datos.existenciaTotalHuevos)}

          <br />

          Existencia anterior sin grupo:{" "}
          {datos.existenciaSinGrupo} huevos.
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            color: "red",
            textAlign: "center"
          }}
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          style={{
            color: "#226644",
            textAlign: "center"
          }}
        >
          {mensaje}
        </p>
      )}

      {pendiente && (
        <div
          style={{
            padding: "15px",
            border: "1px solid #ccc",
            backgroundColor: "#FFF4D1",
            textAlign: "center"
          }}
        >
          Hay una solicitud pendiente de confirmar.
          Se conserva el mismo identificador para no duplicarla.

          <br />

          <button
            type="button"
            style={boton}
            disabled={guardando}
            onClick={() => enviar()}
          >
            {guardando
              ? "PROCESANDO..."
              : "REINTENTAR LA MISMA SOLICITUD"}
          </button>
        </div>
      )}

      {datos && !datos.configuracion && !esAdmin && (
        <p>
          El administrador debe configurar los productos
          de huevos antes de comenzar.
        </p>
      )}

      {datos &&
        (
          !datos.configuracion
            ? esAdmin
            : seccion !== "resumen"
        ) && (
          <form noValidate onSubmit={guardar}>
            <fieldset
              disabled={bloqueado || cargando}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "20px",
                maxWidth: "850px",
                margin: "20px auto"
              }}
            >
              <legend>
                {!datos.configuracion
                  ? "Configuración inicial — solo administrador"
                  : editando
                    ? "Corregir registro"
                    : "Nuevo registro"}
              </legend>

              {!datos.configuracion ? (
                <>
                  <p>
                    Seleccione el producto de huevos de cada sede.
                    Su precio y stock deben estar expresados en
                    cartones de 30. Esta vinculación no convierte
                    ni cambia datos existentes.
                  </p>

                  {["MONASTERIO", "TIENDITA"].map(
                    (sedeCatalogo) => {
                      const propiedad =
                        sedeCatalogo === "MONASTERIO"
                          ? "productoMonasterioId"
                          : "productoTienditaId";

                      return (
                        <Campo
                          key={sedeCatalogo}
                          nombre={`Producto de ${sedeCatalogo}`}
                        >
                          <select
                            style={campo}
                            value={form[propiedad]}
                            onChange={(e) =>
                              poner(propiedad, e.target.value)
                            }
                          >
                            <option value="">
                              -- Seleccione --
                            </option>

                            {catalogos[sedeCatalogo].map(
                              (producto) => (
                                <option
                                  key={producto._id}
                                  value={producto._id}
                                >
                                  {producto.descripcion}
                                  {" — "}
                                  {producto.codigo}
                                </option>
                              )
                            )}
                          </select>
                        </Campo>
                      );
                    }
                  )}

                  <Campo nombre="Actividad productiva">
                    <select
                      style={campo}
                      value={form.actividadProductiva}
                      onChange={(e) =>
                        poner(
                          "actividadProductiva",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        -- Seleccione --
                      </option>

                      {catalogos.actividades.map(
                        (actividad) => (
                          <option
                            key={actividad._id}
                            value={actividad._id}
                          >
                            {actividad.descripcion}
                          </option>
                        )
                      )}
                    </select>
                  </Campo>

                  <label>
                    <input
                      type="checkbox"
                      checked={form.revisado}
                      onChange={(e) =>
                        poner("revisado", e.target.checked)
                      }
                    />
                    {" "}
                    Confirmo que ambos productos se manejan
                    por cartón de 30.
                  </label>
                </>
              ) : seccion === "grupos" ? (
                <>
                  {textoCampo("Nombre del grupo", "nombre")}

                  <Campo nombre="Fecha de ingreso">
                    <input
                      style={campo}
                      type="date"
                      max={fechaHoy()}
                      value={form.fechaInicio}
                      onChange={(e) =>
                        poner("fechaInicio", e.target.value)
                      }
                    />
                  </Campo>

                  {numeroCampo(
                    "Gallinas iniciales",
                    "cantidadInicial"
                  )}
                </>
              ) : seccion === "recepcion" ? (
                <>
                  <Campo nombre="Envío pendiente">
                    <select
                      style={campo}
                      disabled={Boolean(editando)}
                      value={form.envioId}
                      onChange={(e) =>
                        setForm({
                          ...vacio(),
                          envioId: e.target.value
                        })
                      }
                    >
                      <option value="">
                        -- Seleccione --
                      </option>

                      {(datos.movimientos || [])
                        .filter(
                          (movimiento) =>
                            movimiento.tipo === "ENVIO" &&
                            (
                              !movimiento.recepcion ||
                              movimiento._id === editando?._id
                            )
                        )
                        .map((movimiento) => (
                          <option
                            key={movimiento._id}
                            value={movimiento._id}
                          >
                            {formatear(movimiento.fecha)}
                            {" — "}
                            {nombreGrupo(movimiento.grupoId)}
                            {" — "}
                            {movimiento.unidades} huevos
                            {" — "}
                            {String(movimiento._id).slice(-6)}
                          </option>
                        ))}
                    </select>
                  </Campo>

                  {envio && (
                    <p>
                      <strong>
                        Enviados: {envio.unidades} huevos.
                      </strong>
                      {" "}
                      {equivalencia(envio.unidades)}
                    </p>
                  )}

                  {fechaCampo()}

                  {numeroCampo(
                    "Huevos recibidos aptos",
                    "recibidos"
                  )}

                  {numeroCampo(
                    "Huevos partidos al recibir",
                    "partidos"
                  )}

                  {numeroCampo(
                    "Huevos faltantes",
                    "faltantes"
                  )}

                  {textoCampo(
                    "Motivo de las diferencias",
                    "motivo"
                  )}

                  <label>
                    <input
                      type="checkbox"
                      checked={form.revisado}
                      onChange={(e) =>
                        poner("revisado", e.target.checked)
                      }
                    />
                    {" "}
                    Revisé las cantidades recibidas.
                  </label>
                </>
              ) : (
                <>
                  {selectorGrupo()}

                  {seccion !== "gastos" ||
                  form.modoGasto !== "EXISTENTE"
                    ? fechaCampo()
                    : null}

                  {grupo && seccion !== "gastos" && (
                    <p>
                      <strong>
                        {seccion === "bajas"
                          ? `Gallinas actuales: ${grupo.gallinasActuales}`
                          : `Huevos disponibles para retirar: ${grupo.disponibles}`}
                      </strong>

                      {seccion !== "bajas" && (
                        <>
                          <br />
                          {equivalencia(grupo.disponibles)}
                        </>
                      )}
                    </p>
                  )}

                  {seccion === "produccion" && (
                    <>
                      {numeroCampo(
                        "Huevos recogidos (incluidos los partidos)",
                        "recogidos"
                      )}

                      {numeroCampo(
                        "Huevos partidos o descartados",
                        "descartados"
                      )}

                      <p>
                        Huevos aptos:{" "}
                        {Math.max(
                          0,
                          Number(form.recogidos || 0) -
                          Number(form.descartados || 0)
                        )}
                      </p>
                    </>
                  )}

                  {seccion === "bajas" && (
                    <>
                      {numeroCampo(
                        "Cantidad de gallinas que salen del grupo",
                        "unidades"
                      )}

                      <Campo nombre="Motivo">
                        <select
                          style={campo}
                          value={form.motivo}
                          onChange={(e) =>
                            poner("motivo", e.target.value)
                          }
                        >
                          <option value="">
                            -- Seleccione --
                          </option>

                          {[
                            "Mortalidad",
                            "Consumo",
                            "Venta",
                            "Otro"
                          ].map((motivoBaja) => (
                            <option key={motivoBaja}>
                              {motivoBaja}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      <p>
                        Este registro descuenta gallinas, no huevos.
                        Si hubo una venta de gallinas, registre
                        el ingreso de dinero por separado.
                      </p>
                    </>
                  )}

                  {seccion === "consumo" && (
                    <>
                      <Campo nombre="Tipo de salida">
                        <select
                          style={campo}
                          value={form.tipoConsumo || "CONSUMO"}
                          disabled={Boolean(editando)}
                          onChange={(e) =>
                            poner("tipoConsumo", e.target.value)
                          }
                        >
                          <option value="CONSUMO">
                            Consumo interno
                          </option>

                          <option value="MERMA">
                            Roturas o pérdidas posteriores
                          </option>
                        </select>
                      </Campo>

                      {numeroCampo(
                        "Cantidad de huevos",
                        "unidades"
                      )}

                      {textoCampo(
                        "Destino del consumo o motivo de la pérdida",
                        "motivo"
                      )}

                      <p>
                        No vuelva a descontar aquí los partidos
                        que ya incluyó en la producción.
                      </p>
                    </>
                  )}

                  {seccion === "envios" && (
                    <>
                      <p>
                        Origen: MONASTERIO · Destino: TIENDITA
                      </p>

                      {numeroCampo(
                        "Cartones completos de 30",
                        "cartones"
                      )}

                      {numeroCampo(
                        "Medios cartones de 15",
                        "mediosCartones"
                      )}

                      <p>
                        <strong>
                          Total enviado:{" "}
                          {Number(form.cartones || 0) * 30 +
                            Number(form.mediosCartones || 0) * 15}
                          {" "}huevos.
                        </strong>
                      </p>
                    </>
                  )}
                                    {seccion === "gastos" && (
                    <>
                      <Campo nombre="Registro del gasto">
                        <select
                          style={campo}
                          value={form.modoGasto}
                          onChange={(e) =>
                            poner("modoGasto", e.target.value)
                          }
                        >
                          <option value="NUEVO">
                            Registrar un gasto nuevo
                          </option>
                          <option value="EXISTENTE">
                            Vincular un gasto ya registrado
                          </option>
                        </select>
                      </Campo>

                      <Campo nombre="Sede que pagó">
                        <select
                          style={campo}
                          value={form.sede}
                          onChange={(e) => {
                            poner("sede", e.target.value);
                            setDisponibles([]);
                            poner("gastoId", "");
                          }}
                        >
                          <option>TIENDITA</option>
                          <option>MONASTERIO</option>
                        </select>
                      </Campo>

                      <Campo nombre="Concepto">
                        <select
                          style={campo}
                          value={form.concepto}
                          onChange={(e) =>
                            poner("concepto", e.target.value)
                          }
                        >
                          {datos.conceptos.map((concepto) => (
                            <option key={concepto} value={concepto}>
                              {concepto.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      {form.modoGasto === "EXISTENTE" ? (
                        <>
                          <Campo nombre="Buscar gastos desde">
                            <input
                              style={campo}
                              type="date"
                              value={rango.desde}
                              onChange={(e) =>
                                setRango({
                                  ...rango,
                                  desde: e.target.value
                                })
                              }
                            />
                          </Campo>

                          <Campo nombre="Hasta">
                            <input
                              style={campo}
                              type="date"
                              value={rango.hasta}
                              onChange={(e) =>
                                setRango({
                                  ...rango,
                                  hasta: e.target.value
                                })
                              }
                            />
                          </Campo>

                          <button
                            type="button"
                            style={boton}
                            disabled={buscando}
                            onClick={() => buscarGastos(1)}
                          >
                            {buscando
                              ? "BUSCANDO..."
                              : "BUSCAR GASTOS"}
                          </button>

                          <Campo nombre="Gasto existente">
                            <select
                              style={campo}
                              value={form.gastoId}
                              onChange={(e) => {
                                poner("gastoId", e.target.value);

                                const seleccionado = disponibles.find(
                                  (gasto) =>
                                    gasto._id === e.target.value
                                );

                                poner(
                                  "montoAsignado",
                                  seleccionado?.disponible ?? ""
                                );
                              }}
                            >
                              <option value="">
                                -- Seleccione --
                              </option>

                              {disponibles.map((gasto) => (
                                <option
                                  key={gasto._id}
                                  value={gasto._id}
                                >
                                  {fechaTexto(gasto.fecha)}
                                  {" — "}
                                  {gasto.descripcion}
                                  {" — Disponible: "}
                                  {moneda(gasto.disponible)}
                                  {" "}
                                  {gasto.moneda}
                                </option>
                              ))}
                            </select>
                          </Campo>

                          <button
                            type="button"
                            style={boton}
                            disabled={paginaGastos <= 1 || buscando}
                            onClick={() =>
                              buscarGastos(paginaGastos - 1)
                            }
                          >
                            ANTERIOR
                          </button>

                          <span>Página {paginaGastos}</span>

                          <button
                            type="button"
                            style={boton}
                            disabled={!hayMas || buscando}
                            onClick={() =>
                              buscarGastos(paginaGastos + 1)
                            }
                          >
                            SIGUIENTE
                          </button>
                        </>
                      ) : (
                        <>
                          {textoCampo(
                            "Descripción",
                            "descripcion"
                          )}

                          <Campo nombre="Moneda">
                            <select
                              style={campo}
                              value={form.moneda}
                              onChange={(e) =>
                                poner("moneda", e.target.value)
                              }
                            >
                              <option value="D">Dólares</option>
                              <option value="P">Pesos</option>
                              <option value="Bs">Bolívares</option>
                            </select>
                          </Campo>

                          {textoCampo(
                            "Monto total pagado",
                            "monto"
                          )}

                          {textoCampo(
                            "Número de recibo o factura (opcional)",
                            "numeroRecibo"
                          )}

                          <label>
                            <input
                              type="checkbox"
                              checked={form.cajaChica}
                              onChange={(e) =>
                                poner("cajaChica", e.target.checked)
                              }
                            />
                            {" "}Salió de caja chica
                          </label>
                        </>
                      )}

                      {textoCampo(
                        "Parte del gasto que corresponde a este grupo",
                        "montoAsignado"
                      )}

                      <p>
                        El pago se registra una sola vez.
                        Si el gasto ya existe, use la opción de vincular.
                      </p>
                    </>
                  )}
                </>
              )}

              {datos.configuracion && seccion !== "gastos" && (
                <Campo nombre="Observaciones">
                  <textarea
                    style={campo}
                    rows={3}
                    maxLength={2000}
                    value={form.observaciones}
                    onChange={(e) =>
                      poner("observaciones", e.target.value)
                    }
                  />
                </Campo>
              )}

              <div style={{ textAlign: "center" }}>
                <button style={boton} type="submit">
                  {editando
                    ? "GUARDAR CORRECCIÓN"
                    : !datos.configuracion
                      ? "GUARDAR CONFIGURACIÓN"
                      : seccion === "recepcion"
                        ? "CONFIRMAR RECEPCIÓN"
                        : seccion === "envios"
                          ? "CONFIRMAR ENVÍO"
                          : "GUARDAR REGISTRO"}
                </button>

                {editando && (
                  <button
                    style={volver}
                    type="button"
                    onClick={() => {
                      setEditando(null);
                      setForm(vacio());
                    }}
                  >
                    CANCELAR CORRECCIÓN
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        )}

      {/* TABLA DE GRUPOS */}
      {datos?.configuracion && seccion === "grupos" && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <thead style={encabezadoTabla}>
              <tr>
                {[
                  "Grupo",
                  "Fecha de ingreso",
                  "Gallinas iniciales",
                  "Gallinas actuales",
                  "Acciones"
                ].map((titulo) => (
                  <th style={celda} key={titulo}>
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {[...datos.grupos].reverse().map((item) => (
                <tr key={item._id}>
                  <td style={celda}>{item.nombre}</td>
                  <td style={celda}>
                    {fechaTexto(item.fechaInicio)}
                  </td>
                  <td style={celda}>{item.cantidadInicial}</td>
                  <td style={celda}>{item.gallinasActuales}</td>
                  <td style={celda}>
                    {esAdmin && (
                      <>
                        <button
                          style={boton}
                          disabled={bloqueado}
                          onClick={() => editar(item, true)}
                        >
                          Editar
                        </button>

                        <button
                          style={volver}
                          disabled={bloqueado}
                          onClick={() => eliminar(item, true)}
                          aria-label={`Eliminar grupo ${item.nombre}`}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA DE PRODUCCIÓN, BAJAS, CONSUMO Y ENVÍOS */}
      {datos?.configuracion &&
        [
          "produccion",
          "bajas",
          "consumo",
          "envios",
          "recepcion"
        ].includes(seccion) && (
          <div style={{ overflowX: "auto" }}>
            <h3>Registros</h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse"
              }}
            >
              <thead style={encabezadoTabla}>
                <tr>
                  {[
                    "Fecha",
                    "Grupo",
                    "Registro",
                    "Cantidad",
                    "Detalle / recepción",
                    "Acciones"
                  ].map((titulo) => (
                    <th style={celda} key={titulo}>
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lista.map((movimiento) => (
                  <tr key={movimiento._id}>
                    <td style={celda}>
                      {fechaTexto(movimiento.fecha)}
                    </td>

                    <td style={celda}>
                      {nombreGrupo(movimiento.grupoId)}
                    </td>

                    <td style={celda}>
                      {movimiento.tipo}
                    </td>

                    <td style={celda}>
                      {movimiento.unidades}
                      {movimiento.tipo !== "BAJA"
                        ? " huevos"
                        : " gallinas"}
                    </td>

                    <td style={celda}>
                      {movimiento.tipo === "PRODUCCION"
                        ? `Recogidos: ${movimiento.recogidos}. Descartados: ${movimiento.descartados}.`
                        : movimiento.tipo === "ENVIO"
                          ? movimiento.recepcion
                            ? `Recibidos: ${movimiento.recepcion.recibidos}. Partidos: ${movimiento.recepcion.partidos}. Faltantes: ${movimiento.recepcion.faltantes}. ${movimiento.recepcion.motivo || ""}`
                            : "EN TRÁNSITO · Pendiente de recibir"
                          : movimiento.motivo}

                      <br />
                      {movimiento.observaciones}
                    </td>

                    <td style={celda}>
                      {esAdmin &&
                        seccion === "recepcion" &&
                        movimiento.recepcion && (
                          <button
                            style={boton}
                            disabled={bloqueado}
                            onClick={() => editar(movimiento)}
                          >
                            Corregir recepción
                          </button>
                        )}

                      {esAdmin &&
                        (
                          movimiento.tipo !== "ENVIO" ||
                          (
                            seccion === "envios" &&
                            !movimiento.recepcion
                          )
                        ) && (
                          <>
                            <button
                              style={boton}
                              disabled={bloqueado}
                              onClick={() => editar(movimiento)}
                            >
                              Editar
                            </button>

                            <button
                              style={volver}
                              disabled={bloqueado}
                              onClick={() => eliminar(movimiento)}
                              aria-label="Eliminar registro"
                            >
                              🗑
                            </button>
                          </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!lista.length && (
              <p>No hay registros para esta selección.</p>
            )}
          </div>
        )}

      {/* TABLA DE GASTOS */}
      {datos?.configuracion && seccion === "gastos" && (
        <>
          <h3>Gastos asignados al grupo seleccionado</h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse"
              }}
            >
              <thead style={encabezadoTabla}>
                <tr>
                  {[
                    "Fecha",
                    "Sede que pagó",
                    "Descripción",
                    "Concepto",
                    "Importe asignado",
                    "Acciones"
                  ].map((titulo) => (
                    <th style={celda} key={titulo}>
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto._id}>
                    <td style={celda}>
                      {fechaTexto(gasto.fecha)}
                    </td>
                    <td style={celda}>{gasto.sede}</td>
                    <td style={celda}>{gasto.descripcion}</td>

                    <td style={celda}>
                      {gasto.asignacion.concepto.replace(/_/g, " ")}
                    </td>

                    <td style={celda}>
                      {moneda(gasto.asignacion.montoAsignado)}
                      {" "}
                      {gasto.moneda}
                    </td>

                    <td style={celda}>
                      {esAdmin && (
                        <button
                          style={volver}
                          disabled={bloqueado}
                          onClick={() => {
                            const confirmar = window.confirm(
                              "¿Quitar la asignación a este grupo? " +
                              "El gasto y el pago original se conservarán."
                            );

                            if (confirmar) {
                              enviar(
                                `/gastos/${gasto._id}/asignacion`,
                                "DELETE",
                                {
                                  grupoId: form.grupoId,
                                  versionEsperada: gasto.version
                                }
                              );
                            }
                          }}
                        >
                          Desvincular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
            {/* INFORME ADMINISTRATIVO */}
      {seccion === "resumen" && (
        esAdmin ? (
          <>
            <fieldset
              disabled={buscando || bloqueado}
              style={{
                maxWidth: "850px",
                margin: "20px auto",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px"
              }}
            >
              <legend>Período y grupo</legend>

              <Campo nombre="Desde">
                <input
                  style={campo}
                  type="date"
                  value={rango.desde}
                  onChange={(e) =>
                    setRango({
                      ...rango,
                      desde: e.target.value
                    })
                  }
                />
              </Campo>

              <Campo nombre="Hasta">
                <input
                  style={campo}
                  type="date"
                  max={fechaHoy()}
                  value={rango.hasta}
                  onChange={(e) =>
                    setRango({
                      ...rango,
                      hasta: e.target.value
                    })
                  }
                />
              </Campo>

              <Campo nombre="Grupo">
                <select
                  style={campo}
                  value={rango.grupoId}
                  onChange={(e) =>
                    setRango({
                      ...rango,
                      grupoId: e.target.value
                    })
                  }
                >
                  <option value="">TODOS</option>

                  {datos?.grupos.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo nombre="Sede de las ventas y movimientos">
                <select
                  style={campo}
                  value={rango.sede}
                  onChange={(e) =>
                    setRango({
                      ...rango,
                      sede: e.target.value
                    })
                  }
                >
                  <option>TODAS</option>
                  <option>MONASTERIO</option>
                  <option>TIENDITA</option>
                </select>
              </Campo>

              <button
                style={boton}
                onClick={buscarInforme}
                type="button"
              >
                {buscando ? "BUSCANDO..." : "BUSCAR"}
              </button>
            </fieldset>

            {informe && (
              <>
                <h3>
                  {fechaTexto(informe.desde)}
                  {" al "}
                  {fechaTexto(informe.hasta)}
                  {" · "}
                  {informe.sede}
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse"
                    }}
                  >
                    <thead style={encabezadoTabla}>
                      <tr>
                        {[
                          "Grupo",
                          "Producidos aptos",
                          "Descartados al recoger",
                          "Consumo",
                          "Pérdidas posteriores",
                          "Vendidos",
                          "Existencia Monasterio",
                          "Existencia Tiendita",
                          "En tránsito",
                          "Faltantes por revisar",
                          "Ventas USD",
                          "Cobrado USD",
                          "Cobrado COP",
                          "Cobrado Bs",
                          "Gastos USD",
                          "Gastos COP",
                          "Gastos Bs",
                          "Resultado del período USD"
                        ].map((titulo) => (
                          <th style={celda} key={titulo}>
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {informe.filas.map((fila) => (
                        <tr key={fila.grupoId}>
                          <td style={celda}>
                            {fila.nombre}
                          </td>

                          {[
                            fila.producidos,
                            fila.descartados,
                            fila.consumo,
                            fila.mermas,
                            fila.vendidos,
                            fila.existenciaMonasterio,
                            fila.existenciaTiendita,
                            fila.enTransito,
                            fila.faltantesPorRevisar
                          ].map((valor, indice) => (
                            <td style={celda} key={indice}>
                              {valor}
                            </td>
                          ))}

                          <td style={celda}>
                            {moneda(fila.ventasUSD)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.cobrado.D)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.cobrado.P)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.cobrado.Bs)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.gastos.D)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.gastos.P)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.gastos.Bs)}
                          </td>

                          <td style={celda}>
                            {moneda(fila.resultadoUSD)}

                            {fila.gastosSinTasa > 0 && (
                              <div>
                                Faltan tasas históricas:{" "}
                                {fila.gastosSinTasa}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul>
                  {informe.observaciones.map(
                    (observacion) => (
                      <li key={observacion}>
                        {observacion}
                      </li>
                    )
                  )}
                </ul>

                <button
                  type="button"
                  style={boton}
                  onClick={() => window.print()}
                >
                  IMPRIMIR / PDF
                </button>
              </>
            )}
          </>
        ) : (
          <p>
            Este reporte es solo para el administrador.
          </p>
        )
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "20px"
        }}
      >
        <button
          type="button"
          style={volver}
          disabled={guardando}
          onClick={() =>
            navigate(
              sedeUsuario === "MONASTERIO"
                ? "/menu-monasterio"
                : "/menu"
            )
          }
        >
          VOLVER AL MENÚ
        </button>
      </div>
    </div>
  );
}