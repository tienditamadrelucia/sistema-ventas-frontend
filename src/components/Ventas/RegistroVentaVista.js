import React from "react";
import "./RegistroVentaVista.css";

const dinero = valor =>
  Number(valor || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const cantidadVisible = valor =>
  Number(valor || 0).toLocaleString("es-VE", {
    maximumFractionDigits: 3
  });

function enfocar(ref) {
  ref.current?.focus();
  ref.current?.select?.();
}

function conEnter(evento, accion) {
  if (
    evento.key !== "Enter" ||
    evento.nativeEvent?.isComposing
  ) {
    return;
  }

  evento.preventDefault();

  if (!evento.repeat) {
    accion();
  }
}

export default function RegistroVentaVista({
  datos: d,
  acciones: a,
  referencias: r
}) {
  const ocupado =
    d.procesando ||
    d.buscandoCliente ||
    d.buscandoProducto;

  const pendiente =
    d.editando ||
    (
      d.productoSeleccionado &&
      Number(d.cantidad) > 0
    );

  const noGuardar =
    ocupado ||
    pendiente ||
    !d.listaFactura.length;

  const stockConocido =
    typeof d.stockActual === "number" &&
    Number.isFinite(d.stockActual);

  const faltaStock =
    stockConocido &&
    (
      d.stockActual < 0 ||
      Number(d.cantidad) > d.stockActual
    );

  const productos = d.listaProductos
    .filter(
      p =>
        String(p.categoria) ===
        String(d.categoriaSeleccionada)
    )
    .slice()
    .sort((x, y) =>
      String(x.descripcion || "").localeCompare(
        String(y.descripcion || ""),
        "es",
        {
          sensitivity: "base",
          numeric: true
        }
      )
    );

  return (
    <div
      className={
        "registro-venta" +
        (d.esMonasterio ? " rv-monasterio" : "")
      }
    >
      <header className="rv-titulo">
        <h1>REGISTRO DE VENTAS</h1>
        <span className="rv-sede">
          {d.sedeActual}
        </span>
      </header>

      {(d.buscandoCliente || d.buscandoProducto) && (
        <p className="rv-ayuda" role="status">
          {d.buscandoCliente
            ? "Buscando cliente, por favor espere..."
            : "Consultando producto y existencia, por favor espere..."}
        </p>
      )}

      <fieldset
        className="rv-formulario"
        disabled={ocupado}
        aria-busy={ocupado}
      >
        <div className="rv-distribucion">
          <div className="rv-principal">
            <div className="rv-datos">
              <section className="rv-panel">
                <h2>Datos de la factura</h2>

                <div className="rv-contenido">
                  <div className="rv-factura">
                    <label className="rv-campo">
                      Fecha
                      <input
                        ref={r.fecha}
                        type="date"
                        value={d.fecha}
                        onChange={e =>
                          a.cambiarFecha(e.target.value)
                        }
                        onKeyDown={e =>
                          conEnter(e, () =>
                            enfocar(r.identificacion)
                          )
                        }
                      />
                    </label>

                    <label className="rv-campo">
                      N° factura
                      <input
                        value={d.numeroFactura || ""}
                        placeholder="Automático"
                        readOnly
                      />
                    </label>

                    <label className="rv-campo">
                      Hora
                      <input value={d.hora} readOnly />
                    </label>
                  </div>

                  <div className="rv-fila-botones">
                    <button
                      type="button"
                      onClick={a.buscarFactura}
                    >
                      Buscar factura
                    </button>
                  </div>
                </div>
              </section>

              <section className="rv-panel">
                <h2>Datos del cliente</h2>

                <div className="rv-contenido">
                  <div className="rv-cliente">
                    <label className="rv-campo">
                      Cédula / RIF
                      <input
                        ref={r.identificacion}
                        value={d.identificacion}
                        autoComplete="off"
                        placeholder="V12345678"
                        onChange={e =>
                          a.cambiarIdentificacion(
                            e.target.value
                          )
                        }
                        onKeyDown={e =>
                          conEnter(e, a.buscarCliente)
                        }
                      />
                      <small>
                        Enter para buscar cliente
                      </small>
                    </label>

                    <label className="rv-campo">
                      Nombre
                      <select
                        ref={r.cliente}
                        value={
                          d.clienteSeleccionado?._id || ""
                        }
                        onChange={e =>
                          a.seleccionarCliente(
                            e.target.value
                          )
                        }
                        onKeyDown={e =>
                          conEnter(e, () =>
                            enfocar(r.codigo)
                          )
                        }
                      >
                        <option value="">
                          Seleccione un cliente
                        </option>

                        {d.listaClientes.map(c => (
                          <option
                            key={c._id}
                            value={c._id}
                          >
                            {c.nombreCompleto}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rv-fila-botones">
                    <button
                      type="button"
                      className="rv-boton-cliente"
                      onClick={a.nuevoCliente}
                    >
                      Agregar cliente
                    </button>

                    <button
                      type="button"
                      onClick={a.limpiarCliente}
                    >
                      Limpiar cliente
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section className="rv-panel">
              <h2>
                {d.editando
                  ? "Modificar producto"
                  : "Agregar producto"}
              </h2>

              <div className="rv-contenido">
                <div className="rv-selector-producto">
                  <label className="rv-campo">
                    Código
                    <input
                      ref={r.codigo}
                      value={d.codigoProducto}
                      disabled={d.editando}
                      autoComplete="off"
                      onChange={e =>
                        a.cambiarCodigo(e.target.value)
                      }
                      onKeyDown={e =>
                        conEnter(e, a.buscarProducto)
                      }
                    />
                    <small>
                      Enter para buscar producto
                    </small>
                  </label>

                  <label className="rv-campo">
                    Categoría
                    <select
                      ref={r.categoria}
                      value={d.categoriaSeleccionada}
                      disabled={d.editando}
                      onChange={e =>
                        a.cambiarCategoria(e.target.value)
                      }
                      onKeyDown={e =>
                        conEnter(e, () =>
                          enfocar(r.producto)
                        )
                      }
                    >
                      <option value="">Seleccione</option>

                      {d.categoriasDisponibles.map(c => (
                        <option
                          key={c._id}
                          value={c.codigo}
                        >
                          {c.descripcion}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="rv-campo">
                    Producto
                    <select
                      ref={r.producto}
                      value={d.productoSeleccionado}
                      disabled={d.editando}
                      onChange={e =>
                        a.seleccionarProducto(
                          e.target.value
                        )
                      }
                      onKeyDown={e =>
                        conEnter(e, () =>
                          enfocar(r.cantidad)
                        )
                      }
                    >
                      <option value="">
                        Seleccione producto
                      </option>

                      {productos.map(p => (
                        <option
                          key={p._id}
                          value={p._id}
                        >
                          {p.descripcion}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rv-importes">
                  <div
                    className="rv-stock"
                    role="status"
                  >
                    Disponible:{" "}
                    {stockConocido
                      ? cantidadVisible(d.stockActual)
                      : "por confirmar"}
                  </div>

                  <label className="rv-campo">
                    Cantidad
                    <input
                      ref={r.cantidad}
                      type="number"
                      step="0.001"
                      min="0"
                      value={d.cantidad}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        a.cambiarCantidad(e.target.value)
                      }
                      onKeyDown={e =>
                        conEnter(e, () =>
                          enfocar(r.precio)
                        )
                      }
                    />
                  </label>

                  <label className="rv-campo">
                    Precio USD
                    <input
                      ref={r.precio}
                      type="number"
                      step="0.01"
                      min="0"
                      value={d.precioVenta}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        a.cambiarPrecio(e.target.value)
                      }
                      onKeyDown={e =>
                        conEnter(e, () =>
                          enfocar(r.descuento)
                        )
                      }
                    />
                  </label>

                  <label className="rv-campo">
                    Desc. %
                    <input
                      ref={r.descuento}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={d.descuento}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        a.cambiarDescuento(e.target.value)
                      }
                      onKeyDown={e =>
                        conEnter(e, () =>
                          enfocar(r.agregar)
                        )
                      }
                    />
                  </label>

                  <label className="rv-campo">
                    Total USD
                    <input
                      value={dinero(d.totalProducto)}
                      readOnly
                    />
                  </label>
                </div>

                {d.errorPrecio && (
                  <p className="rv-error" role="alert">
                    {d.errorPrecio}
                  </p>
                )}

                {faltaStock && (
                  <p className="rv-aviso" role="status">
                    La cantidad supera la existencia
                    disponible. Puede continuar; comunique
                    la diferencia a la administradora.
                  </p>
                )}

                <p className="rv-ayuda">
                  Enter: cantidad → precio → descuento →
                  botón de agregar. Enter en ese botón
                  agrega el producto.
                </p>

                <div className="rv-fila-botones">
                  <button
                    ref={r.agregar}
                    type="button"
                    className="rv-boton-principal rv-agregar"
                    onClick={a.agregar}
                    onKeyDown={e =>
                      conEnter(e, a.agregar)
                    }
                  >
                    {d.editando
                      ? "ACTUALIZAR PRODUCTO"
                      : "+ AGREGAR A LA VENTA"}
                  </button>

                  <button
                    type="button"
                    onClick={a.limpiarProducto}
                  >
                    {d.editando
                      ? "Cancelar edición"
                      : "Limpiar producto"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rv-panel">
              <h2>Productos de la venta</h2>

              <div className="rv-contenido">
                <div className="rv-tabla">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio USD</th>
                        <th>Desc. %</th>
                        <th>Total USD</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!d.listaFactura.length && (
                        <tr>
                          <td
                            colSpan="7"
                            className="rv-vacio"
                          >
                            Agregue los productos de esta venta.
                          </td>
                        </tr>
                      )}

                      {d.listaFactura.map((item, index) => (
                        <tr key={index}>
                          <td>{item.codigo}</td>
                          <td>{item.descripcion}</td>

                          <td className="rv-numero">
                            {cantidadVisible(item.cantidad)}
                          </td>

                          <td className="rv-numero">
                            {dinero(item.precioVenta)}
                          </td>

                          <td className="rv-numero">
                            {cantidadVisible(item.descuento)}
                          </td>

                          <td className="rv-numero">
                            {dinero(item.total)}
                          </td>

                          <td className="rv-acciones">
                            <button
                              type="button"
                              title="Editar producto"
                              aria-label={
                                "Editar " + item.descripcion
                              }
                              disabled={d.editando}
                              onClick={() =>
                                a.editar(item, index)
                              }
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="rv-eliminar"
                              title="Quitar producto"
                              aria-label={
                                "Quitar " + item.descripcion
                              }
                              disabled={d.editando}
                              onClick={() =>
                                a.eliminar(index)
                              }
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="rv-aviso">
                  Si el stock queda negativo, podrá guardar
                  la venta con una alerta para la administradora.
                </p>
              </div>
            </section>

            <div className="rv-pie">
              <button
                type="button"
                className="rv-volver"
                onClick={a.salir}
              >
                VOLVER AL MENÚ
              </button>

              <button
                type="button"
                onClick={a.limpiarVenta}
              >
                Limpiar venta
              </button>
            </div>
          </div>

          <aside className="rv-lateral">
            <section className="rv-panel">
              <h2>Resumen de la venta</h2>

              <div className="rv-contenido">
                <div className="rv-total-fila">
                  <span>Subtotal USD:</span>
                  <strong>{dinero(d.subtotalDolar)}</strong>
                </div>

                <label className="rv-total-fila">
                  IVA %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={d.iva}
                    onChange={e =>
                      a.cambiarIva(e.target.value)
                    }
                    onKeyDown={e =>
                      conEnter(e, () =>
                        enfocar(r.contado)
                      )
                    }
                  />
                </label>

                <div className="rv-total-fila rv-total-final">
                  <span>TOTAL USD:</span>
                  <span>{dinero(d.totalDolar)}</span>
                </div>

                <div className="rv-total-fila">
                  <span>Total COP:</span>
                  <strong>{dinero(d.totalPeso)}</strong>
                </div>

                <div className="rv-total-fila">
                  <span>Total Bs:</span>
                  <strong>{dinero(d.totalBs)}</strong>
                </div>

                <div className="rv-tasas">
                  Tasas de la fecha seleccionada:
                  <br />
                  COP {dinero(d.tasaPeso)} ·
                  Bs {dinero(d.tasaDolar)} por USD
                </div>
              </div>
            </section>

            <section className="rv-panel">
              <h2>Pago y guardado</h2>

              <div className="rv-contenido">
                <div className="rv-modalidades">
                  <button
                    ref={r.contado}
                    type="button"
                    className="rv-boton-principal"
                    disabled={noGuardar}
                    onClick={a.contado}
                  >
                    CONTADO
                  </button>

                  <button
                    type="button"
                    className="rv-credito"
                    disabled={noGuardar}
                    onClick={a.credito}
                  >
                    CRÉDITO
                  </button>
                </div>

                <button
                  type="button"
                  className="rv-boton-principal rv-guardar"
                  disabled={noGuardar}
                  onClick={a.guardar}
                >
                  {d.procesando
                    ? "PROCESANDO..."
                    : "GUARDAR VENTA"}
                </button>

                <p className="rv-nota" role="status">
                  {pendiente
                    ? "Agregue el producto pendiente o cancele su edición antes de guardar."
                    : d.pagoData?.preparado
                    ? "Pago preparado. Pulse GUARDAR VENTA."
                    : "Prepare el pago con CONTADO o CRÉDITO y luego pulse GUARDAR VENTA."}
                </p>

                <button
                  type="button"
                  className="rv-sin-pago"
                  disabled={noGuardar}
                  onClick={a.sinPago}
                >
                  GUARDAR SIN PAGO
                </button>

                <p className="rv-nota">
                  Crédito: encargo en elaboración,
                  sin salida de inventario.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </fieldset>

      {d.procesando && (
        <div className="rv-procesando" role="status">
          Procesando, por favor espere...
        </div>
      )}
    </div>
  );
}