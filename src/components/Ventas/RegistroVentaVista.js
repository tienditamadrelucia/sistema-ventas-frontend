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
  const editor = d.editorFilas;
  const ocupado = d.procesando || d.buscandoCliente;
  const pendiente = editor.pendientes;

  const noGuardar =
    ocupado ||
    pendiente ||
    !d.listaFactura.length;

  const productosOrdenados = d.listaProductos
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
        "registro-venta rv-en-filas" +
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
              <h2>Productos de la venta</h2>

              <div className="rv-contenido">
                <div className="rv-tabla">
                  <table className="rv-tabla-editable">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Categoría</th>
                        <th>Producto</th>
                        <th>Disponible</th>
                        <th>Cantidad</th>
                        <th>Precio USD</th>
                        <th>Desc. %</th>
                        <th>Total USD</th>
                        <th>Quitar</th>
                      </tr>
                    </thead>

                    <tbody>
                      {editor.filas.map((fila, index) => {
                        const productos =
                          productosOrdenados.filter(
                            p =>
                              !fila.categoria ||
                              String(p.categoria) ===
                                String(fila.categoria)
                          );

                        const conocido =
                          typeof fila.stock === "number" &&
                          Number.isFinite(fila.stock);

                        const negativo =
                          conocido &&
                          (
                            fila.stock < 0 ||
                            Number(fila.cantidad) >
                              fila.stock
                          );

                        const ref = campo => elemento => {
                          editor.registrarRef(
                            fila.id,
                            campo,
                            elemento
                          );

                          if (
                            campo === "codigo" &&
                            fila.id ===
                              editor.primeraVaciaId
                          ) {
                            r.codigo.current = elemento;
                          }
                        };

                        return (
                          <tr key={fila.id}>
                            <td>
                              <input
                                ref={ref("codigo")}
                                aria-label={
                                  "Código, fila " +
                                  (index + 1)
                                }
                                value={fila.codigo}
                                autoComplete="off"
                                aria-invalid={
                                  Boolean(fila.error)
                                }
                                onChange={e =>
                                  editor.cambiarCampo(
                                    fila.id,
                                    "codigo",
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.buscarCodigo(
                                      fila.id
                                    )
                                  )
                                }
                              />
                            </td>

                            <td>
                              <select
                                ref={ref("categoria")}
                                aria-label={
                                  "Categoría, fila " +
                                  (index + 1)
                                }
                                value={fila.categoria}
                                onChange={e =>
                                  editor.cambiarCampo(
                                    fila.id,
                                    "categoria",
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.enfocar(
                                      fila.id,
                                      "producto"
                                    )
                                  )
                                }
                              >
                                <option value="">
                                  Seleccione
                                </option>

                                {d.categoriasDisponibles.map(
                                  c => (
                                    <option
                                      key={c._id}
                                      value={c.codigo}
                                    >
                                      {c.descripcion}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td>
                              <select
                                ref={ref("producto")}
                                aria-label={
                                  "Producto, fila " +
                                  (index + 1)
                                }
                                value={fila.productoId}
                                title={fila.descripcion}
                                onChange={e =>
                                  editor.seleccionarProducto(
                                    fila.id,
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.enfocar(
                                      fila.id,
                                      "cantidad"
                                    )
                                  )
                                }
                              >
                                <option value="">
                                  Seleccione producto
                                </option>

                                {fila.productoId &&
                                  !productos.some(
                                    p =>
                                      String(p._id) ===
                                      String(fila.productoId)
                                  ) && (
                                    <option
                                      value={fila.productoId}
                                    >
                                      {fila.descripcion}
                                    </option>
                                  )}

                                {productos.map(p => (
                                  <option
                                    key={p._id}
                                    value={p._id}
                                  >
                                    {p.descripcion}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td
                              className={
                                "rv-numero" +
                                (
                                  negativo
                                    ? " rv-saldo-alerta"
                                    : ""
                                )
                              }
                              title={
                                fila.aviso ||
                                (
                                  negativo
                                    ? "Puede guardar con alerta para la administradora."
                                    : "Existencia actual"
                                )
                              }
                            >
                              {fila.cargando
                                ? "..."
                                : conocido
                                ? cantidadVisible(fila.stock)
                                : "—"}
                            </td>

                            <td>
                              <input
                                ref={ref("cantidad")}
                                aria-label={
                                  "Cantidad, fila " +
                                  (index + 1)
                                }
                                type="number"
                                step="0.001"
                                min="0"
                                disabled={
                                  !fila.productoId ||
                                  fila.cargando
                                }
                                value={fila.cantidad}
                                onFocus={e =>
                                  e.target.select()
                                }
                                onChange={e =>
                                  editor.cambiarCampo(
                                    fila.id,
                                    "cantidad",
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.enfocar(
                                      fila.id,
                                      "precio"
                                    )
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                ref={ref("precio")}
                                aria-label={
                                  "Precio, fila " +
                                  (index + 1)
                                }
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={
                                  !fila.productoId ||
                                  fila.cargando
                                }
                                value={fila.precio}
                                onFocus={e =>
                                  e.target.select()
                                }
                                onChange={e =>
                                  editor.cambiarCampo(
                                    fila.id,
                                    "precio",
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.enfocar(
                                      fila.id,
                                      "descuento"
                                    )
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                ref={ref("descuento")}
                                aria-label={
                                  "Descuento, fila " +
                                  (index + 1)
                                }
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                disabled={
                                  !fila.productoId ||
                                  fila.cargando
                                }
                                value={fila.descuento}
                                onFocus={e =>
                                  e.target.select()
                                }
                                onChange={e =>
                                  editor.cambiarCampo(
                                    fila.id,
                                    "descuento",
                                    e.target.value
                                  )
                                }
                                onKeyDown={e =>
                                  conEnter(e, () =>
                                    editor.siguienteFila(
                                      fila.id
                                    )
                                  )
                                }
                              />
                            </td>

                            <td className="rv-numero">
                              {dinero(fila.total)}
                            </td>

                            <td className="rv-acciones">
                              <button
                                type="button"
                                className="rv-eliminar"
                                title="Quitar fila"
                                aria-label={
                                  "Quitar fila " +
                                  (index + 1)
                                }
                                onClick={() =>
                                  editor.quitarFila(fila.id)
                                }
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {editor.mensaje && (
                  <p className="rv-error" role="alert">
                    {editor.mensaje}
                  </p>
                )}

                {editor.cargando && (
                  <p className="rv-nota" role="status">
                    Consultando existencia del producto...
                  </p>
                )}

                <div className="rv-fila-botones">
                  <button
                    type="button"
                    className="rv-boton-principal"
                    onClick={editor.agregarFila}
                    onKeyDown={e =>
                      conEnter(e, editor.agregarFila)
                    }
                  >
                    + AGREGAR FILA
                  </button>

                  <span className="rv-nota">
                    Código + Enter: cargar producto ·
                    Enter: cantidad → precio → descuento →
                    siguiente fila.
                  </span>
                </div>
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
                  <strong>
                    {dinero(d.subtotalDolar)}
                  </strong>
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
                    ? "Complete los productos pendientes antes de guardar. Las filas vacías se omiten."
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