import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect
} from "react";

import { API_URL } from "../../config";

function vacia(fila) {
  return (
    !String(fila.codigo || "").trim() &&
    !fila.productoId &&
    !String(fila.cantidad ?? "").trim() &&
    !String(fila.precio ?? "").trim() &&
    Number(fila.descuento || 0) === 0
  );
}

function problema(fila) {
  if (vacia(fila)) return null;

  if (fila.cargando) {
    return {
      campo: "codigo",
      mensaje:
        "Espere a que termine la búsqueda del producto."
    };
  }

  if (!fila.productoId || fila.error) {
    return {
      campo: "codigo",
      mensaje:
        fila.error ||
        "Busque el producto con su código o selecciónelo."
    };
  }

  if (
    !Number.isFinite(Number(fila.cantidad)) ||
    Number(fila.cantidad) <= 0
  ) {
    return {
      campo: "cantidad",
      mensaje: "Indique una cantidad mayor a cero."
    };
  }

  if (
    !Number.isFinite(Number(fila.precio)) ||
    Number(fila.precio) <= 0
  ) {
    return {
      campo: "precio",
      mensaje: "Indique un precio mayor a cero."
    };
  }

  if (
    !Number.isFinite(Number(fila.descuento)) ||
    Number(fila.descuento) < 0 ||
    Number(fila.descuento) > 100
  ) {
    return {
      campo: "descuento",
      mensaje:
        "El descuento debe estar entre 0 y 100."
    };
  }

  if (!Number.isFinite(fila.total)) {
    return {
      campo: "precio",
      mensaje: "Revise los importes del producto."
    };
  }

  return null;
}

function importe(fila) {
  const cantidad = Number(fila.cantidad);
  const precio = Number(fila.precio);
  const descuento = Number(fila.descuento || 0);

  const resultado =
    cantidad * precio * (1 - descuento / 100);

  return Number.isFinite(resultado)
    ? resultado
    : NaN;
}

function validas(filas) {
  return filas.filter(
    fila => !vacia(fila) && !problema(fila)
  );
}

function aFactura(fila) {
  return {
    ...(fila.original || {}),
    idProducto: fila.productoId,
    codigo: fila.codigo,
    descripcion: fila.descripcion,
    cantidad: Number(fila.cantidad),
    precioVenta: Number(fila.precio),
    descuento: Number(fila.descuento || 0),
    total: fila.total
  };
}

export default function useFilasVenta({
  productos,
  sede
}) {
  const contador = useRef(0);
  const referencias = useRef(new Map());
  const focoPendiente = useRef(null);
  const activa = useRef(true);

  const nuevaFila = useCallback(() => ({
    id: "fila-" + (++contador.current),
    codigo: "",
    categoria: "",
    productoId: "",
    descripcion: "",
    cantidad: "",
    precio: "",
    descuento: "0",
    total: 0,
    stock: null,
    cargando: false,
    error: "",
    aviso: "",
    solicitud: 0,
    original: null
  }), []);

  const [filas, setFilas] = useState(
    () => [nuevaFila()]
  );

  const filasRef = useRef(filas);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    activa.current = true;

    return () => {
      activa.current = false;
    };
  }, []);

  const actualizar = useCallback(cambio => {
    if (!activa.current) return;

    let siguientes = cambio(filasRef.current);

    if (!siguientes.some(vacia)) {
      siguientes = [
        ...siguientes,
        nuevaFila()
      ];
    }

    filasRef.current = siguientes;
    setFilas(siguientes);
  }, [nuevaFila]);

  const aplicarFoco = useCallback(() => {
    const pendiente = focoPendiente.current;

    if (!pendiente) return;

    const elemento = referencias.current.get(
      pendiente.id + ":" + pendiente.campo
    );

    if (elemento && !elemento.disabled) {
      elemento.focus();
      elemento.select?.();
      focoPendiente.current = null;
    }
  }, []);

  useEffect(() => {
    aplicarFoco();
  }, [filas, aplicarFoco]);

  function enfocar(id, campo) {
    focoPendiente.current = {
      id,
      campo
    };

    window.requestAnimationFrame(aplicarFoco);
  }

  function registrarRef(id, campo, elemento) {
    const clave = id + ":" + campo;

    if (elemento) {
      referencias.current.set(clave, elemento);
    } else {
      referencias.current.delete(clave);
    }
  }

  useEffect(() => {
    let cambio = false;

    const siguientes = filasRef.current.map(fila => {
      if (!fila.productoId || fila.categoria) {
        return fila;
      }

      const producto = productos.find(
        p =>
          String(p._id) ===
          String(fila.productoId)
      );

      if (!producto?.categoria) return fila;

      cambio = true;

      return {
        ...fila,
        categoria: producto.categoria
      };
    });

    if (cambio) {
      actualizar(() => siguientes);
    }
  }, [productos, actualizar]);

  const listaFactura = useMemo(
    () => validas(filas).map(aFactura),
    [filas]
  );

  function setListaFactura(valor) {
    const actuales = validas(
      filasRef.current
    ).map(aFactura);

    const items = typeof valor === "function"
      ? valor(actuales)
      : valor;

    actualizar(() =>
      (Array.isArray(items) ? items : []).map(item => {
        const productoId =
          item.idProducto?._id ||
          item.idProducto;

        const producto = productos.find(
          p =>
            String(p._id) === String(productoId)
        );

        const fila = {
          ...nuevaFila(),
          original: item,
          productoId,

          codigo: String(
            item.codigo ??
            producto?.codigo ??
            ""
          ),

          categoria:
            producto?.categoria ||
            item.categoria ||
            "",

          descripcion:
            item.descripcion ||
            producto?.descripcion ||
            "",

          cantidad: String(
            item.cantidad ?? ""
          ),

          precio: String(
            item.precioVenta ?? ""
          ),

          descuento: String(
            item.descuento ?? 0
          )
        };

        fila.total =
          typeof item.total === "number" &&
          Number.isFinite(item.total)
            ? item.total
            : importe(fila);

        return fila;
      })
    );

    setMensaje("");
  }

  function cambiarCampo(id, campo, valor) {
    if (
      ![
        "codigo",
        "categoria",
        "cantidad",
        "precio",
        "descuento"
      ].includes(campo)
    ) {
      return;
    }

    actualizar(actuales =>
      actuales.map(fila => {
        if (fila.id !== id) return fila;

        if (
          campo === "codigo" ||
          campo === "categoria"
        ) {
          return {
            ...fila,
            [campo]: valor,

            codigo:
              campo === "codigo" ? valor : "",

            productoId: "",
            descripcion: "",
            cantidad: "",
            precio: "",
            descuento: "0",
            total: 0,
            stock: null,
            cargando: false,
            error: "",
            aviso: "",
            original: null,
            solicitud: fila.solicitud + 1
          };
        }

        const siguiente = {
          ...fila,
          [campo]: valor
        };

        siguiente.total = importe(siguiente);

        return siguiente;
      })
    );

    setMensaje("");
  }

  async function cargarProducto(id, producto) {
    const anterior = filasRef.current.find(
      fila => fila.id === id
    );

    if (!anterior) return;

    const solicitud = anterior.solicitud + 1;

    actualizar(actuales =>
      actuales.map(fila =>
        fila.id === id
          ? {
              ...fila,
              codigo: String(producto.codigo),
              categoria: producto.categoria || "",
              productoId: producto._id,
              descripcion:
                producto.descripcion || "",
              cantidad: "",

              precio:
                Number.isFinite(
                  Number(producto.venta)
                )
                  ? String(producto.venta)
                  : "",

              descuento: "0",
              total: 0,
              stock: null,
              cargando: true,
              error: "",
              aviso: "",
              solicitud,
              original: null
            }
          : fila
      )
    );

    let stock = null;
    let aviso = "";

    try {
      const respuesta = await fetch(
        API_URL +
        "/api/inventario/stock-real/" +
        encodeURIComponent(producto.codigo) +
        "?sede=" +
        encodeURIComponent(sede),
        {
          credentials: "include"
        }
      );

      const data = await respuesta.json();

      if (
        respuesta.ok &&
        data.ok &&
        typeof data.stockReal === "number" &&
        Number.isFinite(data.stockReal)
      ) {
        stock = data.stockReal;
      } else {
        aviso =
          "Existencia por confirmar. " +
          "Se verificará al guardar la venta.";
      }
    } catch {
      aviso =
        "No se pudo consultar la existencia. " +
        "Se verificará al guardar la venta.";
    }

    if (!activa.current) return;

    const vigente = filasRef.current.find(
      fila => fila.id === id
    );

    if (
      !vigente ||
      vigente.solicitud !== solicitud ||
      String(vigente.productoId) !==
        String(producto._id)
    ) {
      return;
    }

    actualizar(actuales =>
      actuales.map(fila =>
        fila.id === id
          ? {
              ...fila,
              stock,
              aviso,
              cargando: false
            }
          : fila
      )
    );

    enfocar(id, "cantidad");
  }

  async function buscarCodigo(id) {
    const fila = filasRef.current.find(
      item => item.id === id
    );

    if (!fila || fila.cargando) return;

    const codigo = String(fila.codigo)
      .trim()
      .toUpperCase();

    const producto = productos.find(
      p =>
        String(p.codigo).trim().toUpperCase() ===
        codigo
    );

    if (!producto) {
      actualizar(actuales =>
        actuales.map(item =>
          item.id === id
            ? {
                ...item,
                productoId: "",
                descripcion: "",
                precio: "",
                stock: null,
                total: 0,
                error:
                  "Producto no encontrado en esta sede.",
                solicitud: item.solicitud + 1
              }
            : item
        )
      );

      setMensaje(
        "Producto no encontrado en esta sede. " +
        "Revise el código."
      );

      enfocar(id, "codigo");
      return;
    }

    if (
      String(fila.productoId) ===
        String(producto._id) &&
      !fila.error
    ) {
      enfocar(id, "cantidad");
      return;
    }

    setMensaje("");
    await cargarProducto(id, producto);
  }

  async function seleccionarProducto(
    id,
    productoId
  ) {
    const producto = productos.find(
      p =>
        String(p._id) === String(productoId)
    );

    if (producto) {
      await cargarProducto(id, producto);
    } else {
      cambiarCampo(id, "codigo", "");
    }
  }

  function agregarFila() {
    const fila = nuevaFila();

    actualizar(actuales => [
      ...actuales,
      fila
    ]);

    enfocar(fila.id, "codigo");
  }

  function quitarFila(id) {
    const indice = filasRef.current.findIndex(
      fila => fila.id === id
    );

    actualizar(actuales =>
      actuales.filter(fila => fila.id !== id)
    );

    const siguiente = filasRef.current[
      Math.min(
        Math.max(indice, 0),
        filasRef.current.length - 1
      )
    ];

    if (siguiente) {
      enfocar(siguiente.id, "codigo");
    }

    setMensaje("");
  }

  function siguienteFila(id) {
    const indice = filasRef.current.findIndex(
      fila => fila.id === id
    );

    const fila = filasRef.current[indice];

    if (!fila) return;

    const error = problema(fila);

    if (error || vacia(fila)) {
      setMensaje(
        error?.mensaje ||
        "Seleccione un producto antes de continuar."
      );

      enfocar(
        id,
        error?.campo || "codigo"
      );

      return;
    }

    const siguiente =
      filasRef.current[indice + 1];

    if (siguiente) {
      enfocar(siguiente.id, "codigo");
    } else {
      agregarFila();
    }
  }

  function validar() {
    const conDatos = filasRef.current.filter(
      fila => !vacia(fila)
    );

    if (!conDatos.length) {
      setMensaje(
        "Incluya al menos un producto en la venta."
      );

      enfocar(
        filasRef.current[0].id,
        "codigo"
      );

      return false;
    }

    for (const fila of conDatos) {
      const error = problema(fila);

      if (error) {
        setMensaje(error.mensaje);
        enfocar(fila.id, error.campo);
        return false;
      }
    }

    setMensaje("");
    return true;
  }

  return [
    listaFactura,
    setListaFactura,
    {
      filas,
      mensaje,
      cambiarCampo,
      buscarCodigo,
      seleccionarProducto,
      agregarFila,
      quitarFila,
      siguienteFila,
      enfocar,
      registrarRef,
      validar,

      pendientes: filas.some(
        fila =>
          !vacia(fila) &&
          Boolean(problema(fila))
      ),

      hayContenido: filas.some(
        fila => !vacia(fila)
      ),

      primeraVaciaId:
        filas.find(vacia)?.id,

      cargando: filas.some(
        fila => fila.cargando
      )
    }
  ];
}