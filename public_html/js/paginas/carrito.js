"use strict";

const usuarioCarrito = obtenerUsuarioSesion();
const compraConCuenta = tieneSesionValida(usuarioCarrito);
let subtotalCarrito = 0;
let itemsPagables = [];
let numeroArticulosCarrito = 0;
const operandoCantidad = new Set();
let cantidadPendientes = 0;
let cantidadVariantesIncompletas = 0;
let abrirCheckoutAutomatico = new URLSearchParams(window.location.search).get("checkout") === "1";

inicializarCarrito();

async function inicializarCarrito() {
    if (compraConCuenta) await migrarCarritoInvitado();
    await cargarCarrito();
    actualizarInterfazInvitado();
}

function actualizarInterfazInvitado() {
    const titulo = document.querySelector(".carrito-titulo p");
    if (titulo && !compraConCuenta) {
        titulo.textContent = "Compra como invitado. No necesitas crear una cuenta para finalizar tu pedido.";
    }
    const aviso = document.getElementById("avisoCompraInvitado");
    if (aviso) aviso.hidden = compraConCuenta;
}

async function migrarCarritoInvitado() {
    const invitados = obtenerCarritoInvitado();
    if (!invitados.length) return;

    const pendientes = [];
    for (const item of invitados) {
        try {
            const respuesta = await fetchConSesion(`${API_URL}/carrito`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    talla: item.talla || "UNIDAD",
                    color: item.color || "SIN_COLOR"
                })
            });
            if (!respuesta.ok) pendientes.push(item);
        } catch {
            pendientes.push(item);
        }
    }
    guardarCarritoInvitado(pendientes);
}

document.getElementById("listaCarrito")?.addEventListener("click", evento => {
    const eliminar = evento.target.closest("[data-eliminar]");
    const aceptar = evento.target.closest("[data-aceptar-cotizacion]");
    if (eliminar) eliminarProducto(eliminar.dataset.eliminar);
    if (aceptar) aceptarCotizacion(aceptar.dataset.aceptarCotizacion);
    const paso = evento.target.closest("[data-paso-cantidad]");
    if (paso) {
        const input = paso.closest(".cantidad-producto")?.querySelector("[data-cantidad]");
        if (!input) return;
        const actual = Number(input.value);
        const incremento = paso.dataset.pasoCantidad === "mas" ? 1 : -1;
        const nuevo = Math.min(20, Math.max(1, actual + incremento));
        if (nuevo !== actual) actualizarCantidad(input.dataset.cantidad, nuevo);
    }
});

document.getElementById("listaCarrito")?.addEventListener("change", evento => {
    const input = evento.target.closest("[data-cantidad]");
    if (input) actualizarCantidad(input.dataset.cantidad, input.value);
});

async function cargarCarrito() {
    const lista = document.getElementById("listaCarrito");
    lista.innerHTML = '<div class="pb-cart-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Preparando tus productos...</div>';
    subtotalCarrito = 0;
    cantidadPendientes = 0;
    cantidadVariantesIncompletas = 0;
    itemsPagables = [];
    numeroArticulosCarrito = 0;

    try {
        const carrito = compraConCuenta
                ? await obtenerColeccionUsuario("carrito", usuarioCarrito)
                : obtenerCarritoInvitado();

        if (!carrito.length) {
            lista.innerHTML = renderizarCarritoVacio();
            actualizarResumen();
            return;
        }

        const necesitaCatalogo = carrito.some(item => !item.personalizado || item.productoId != null);
        let productosPorId = new Map();
        if (necesitaCatalogo) {
            const idsProductos = [...new Set(carrito.map(item => Number(item.productoId)).filter(Number.isInteger))];
            const respuestaProductos = await fetch(`${API_URL}/productos/por-ids?ids=${idsProductos.join(",")}`);
            if (respuestaProductos.ok) {
                const productos = await respuestaProductos.json();
                productosPorId = new Map((Array.isArray(productos) ? productos : []).map(producto => [Number(producto.id), producto]));
            }
        }

        const completos = await Promise.all(carrito.map(item => cargarItemCompleto(item, productosPorId)));
        const disponibles = completos.filter(Boolean);
        numeroArticulosCarrito = disponibles.length;
        lista.innerHTML = disponibles.length ? disponibles.map(renderizarItem).join("") : renderizarCarritoVacio();
        actualizarResumen();
        intentarAbrirCheckoutAutomatico();
    } catch (error) {
        console.error(error);
        lista.innerHTML = '<p class="error-carrito" role="alert">' + escaparCarrito(error.message) + '</p><a class="pb-cart-retry" href="carrito%20de%20compras.html">Intentar nuevamente</a>';
        actualizarResumen();
    }
}

async function cargarItemCompleto(item, productosPorId = new Map()) {
    if (item.personalizado && item.pedidoPersonalizadoId) {
        try {
            const respuestaSolicitud = await fetchConSesion(`${API_URL}/pedidos-personalizados/${encodeURIComponent(item.pedidoPersonalizadoId)}`);
            const solicitud = respuestaSolicitud.ok ? await respuestaSolicitud.json() : null;
            let producto = item.productoId != null ? productosPorId.get(Number(item.productoId)) || null : null;
            producto ||= {
                id: null,
                nombre: solicitud?.productoNombre || "Diseño libre personalizado",
                categoria: solicitud?.categoria || "PERSONALIZADO_LIBRE",
                imagen: solicitud?.imagenFrente || "",
                precio: 0
            };
            return {item, producto, solicitud};
        } catch {
            return null;
        }
    }

    const producto = productosPorId.get(Number(item.productoId));
    if (!producto) return null;
    const variantes = obtenerVariantesColorProducto(producto);
    producto.imagenVariante = variantes.length
            ? await obtenerImagenVarianteProducto(producto, item.color)
            : obtenerUrlImagen(producto.imagen);
    return {item, producto, solicitud: null};
}

function renderizarItem({item, producto, solicitud}) {
    if (item.personalizado) return renderizarPersonalizado(item, producto, solicitud);

    const precio = Number(producto.precio || 0);
    const cantidad = Number(item.cantidad || 1);
    const subtotal = precio * cantidad;
    const variantes = obtenerVariantesColorProducto(producto);
    const varianteElegida = variantes.find(color => normalizarTexto(color.nombre) === normalizarTexto(item.color || ""));
    const faltaColor = variantes.length > 0 && !varianteElegida;
    const stockDisponible = variantes.length ? Number(varianteElegida?.stock || 0) : Number(producto.stock || 0);
    const sinStock = !faltaColor && cantidad > stockDisponible;
    const varianteInvalida = faltaColor || sinStock;
    if (varianteInvalida) {
        cantidadVariantesIncompletas++;
    } else {
        subtotalCarrito += subtotal;
        itemsPagables.push({item, producto, solicitud: null, personalizado: false, subtotal});
    }
    const avisoVariante = faltaColor
            ? "Debes elegir un color antes de comprar."
            : (sinStock ? `Solo quedan ${stockDisponible} unidad(es) de esta variante.` : "");

    return `<article class="producto-carrito ${varianteInvalida ? "producto-variante-invalida" : ""}">
        <img src="${escaparAtributoCarrito(producto.imagenVariante || obtenerUrlImagen(producto.imagen))}" alt="${escaparAtributoCarrito(producto.nombre)}" onerror="manejarErrorImagen(this)">
        <div class="producto-info">
            <h3>${escaparCarrito(producto.nombre)}</h3>
            ${variantes.length ? `<p>Color: <b>${escaparCarrito(item.color && item.color !== "SIN_COLOR" ? item.color : "No seleccionado")}</b></p>` : ""}
            ${productoUsaTalla(producto.categoria, producto.nombre) ? `<p>Talla: ${escaparCarrito(item.talla || "No seleccionada")}</p>` : "<p>Presentación: Unidad</p>"}
            ${varianteInvalida ? `<p class="aviso-variante-carrito"><i class="fa-solid fa-circle-exclamation"></i> ${escaparCarrito(avisoVariante)}</p><a class="btn-elegir-variante" href="detalles-producto.html?id=${encodeURIComponent(producto.id)}">Elegir variante</a>` : `<p class="precio">S/ ${precio.toFixed(2)}</p><p class="subtotal-linea">Subtotal: <b>S/ ${subtotal.toFixed(2)}</b></p>`}
        </div>
        <div class="cantidad-producto"><input type="number" min="1" max="20" value="${cantidad}" data-cantidad="${escaparAtributoCarrito(item.id)}" aria-label="Cantidad"></div>
        <button class="btn-eliminar" data-eliminar="${escaparAtributoCarrito(item.id)}"><i class="fa-regular fa-trash-can"></i> Eliminar</button>
    </article>`;
}

function renderizarPersonalizado(item, producto, solicitud) {
    const estado = solicitud?.estado || "PENDIENTE_COTIZACION";
    const precio = solicitud?.precio == null ? null : Number(solicitud.precio);
    const aprobado = ["APROBADO", "EN_PRODUCCION", "LISTO", "ENVIADO"].includes(estado) && Number.isFinite(precio);
    const cotizado = estado === "COTIZADO" && Number.isFinite(precio);

    if (aprobado) {
        subtotalCarrito += precio;
        itemsPagables.push({item, producto, solicitud, personalizado: true, subtotal: precio});
    } else {
        cantidadPendientes++;
    }

    const imagen = solicitud?.imagenFrente || producto.imagen;
    return `<article class="producto-carrito producto-personalizado">
        <img src="${escaparAtributoCarrito(obtenerUrlImagen(imagen))}" alt="Diseño personalizado" onerror="manejarErrorImagen(this)">
        <div class="producto-info">
            <span class="etiqueta-personalizado">Personalizado</span>
            <h3>${escaparCarrito(solicitud?.productoNombre || producto.nombre)}</h3>
            <p>${escaparCarrito(solicitud?.color || "Color por confirmar")} · ${escaparCarrito(solicitud?.talla || item.talla || "Unidad")}</p>
            <p>Estado: <b>${escaparCarrito(formatearEstadoCarrito(estado))}</b></p>
            <p class="precio ${precio == null ? "precio-pendiente" : ""}">${precio == null ? "Precio por procesar" : `S/ ${precio.toFixed(2)}`}</p>
            ${solicitud?.mensajeAdmin ? `<p class="mensaje-admin-carrito">${escaparCarrito(solicitud.mensajeAdmin)}</p>` : ""}
            ${cotizado ? `<button class="btn-aceptar-cotizacion" data-aceptar-cotizacion="${escaparAtributoCarrito(solicitud.id)}">Aceptar cotización</button>` : ""}
        </div>
        <div class="cantidad-producto"><span>${Number(solicitud?.cantidad || item.cantidad || 1)} unidad(es)</span></div>
        <button class="btn-eliminar" data-eliminar="${escaparAtributoCarrito(item.id)}"><i class="fa-regular fa-trash-can"></i> Eliminar</button>
    </article>`;
}

function actualizarResumen() {
    document.getElementById("subtotal").textContent = `S/ ${subtotalCarrito.toFixed(2)}`;
    document.getElementById("envioResumen").textContent = "Pago directo al transportista";
    document.getElementById("total").textContent = `S/ ${subtotalCarrito.toFixed(2)}`;
    const totalCheckout = document.getElementById("totalCheckout");
    if (totalCheckout) totalCheckout.textContent = `S/ ${subtotalCarrito.toFixed(2)}`;
    const pendientes = document.getElementById("resumenPendientes");
    const mensajesPendientes = [];
    if (cantidadPendientes) mensajesPendientes.push(`${cantidadPendientes} producto(s) personalizado(s) aún no se incluyen en el total porque están en cotización.`);
    if (cantidadVariantesIncompletas) mensajesPendientes.push(`${cantidadVariantesIncompletas} producto(s) requieren elegir nuevamente color o ajustar la cantidad.`);
    pendientes.textContent = mensajesPendientes.join(" ");
    const count = document.getElementById("contadorCarrito");
    if (count) count.textContent = String(numeroArticulosCarrito);
    const checkoutBtn = document.getElementById("btnAbrirCheckout");
    if (checkoutBtn) checkoutBtn.disabled = !itemsPagables.length;
    const vaciar = document.getElementById("btnVaciarCarrito");
    if (vaciar) vaciar.hidden = numeroArticulosCarrito === 0;
    const mobileBar = document.getElementById("pbCartMobileBar");
    const mobileTotal = document.getElementById("pbCartMobileTotal");
    const mobileButton = document.getElementById("pbCartMobileCheckout");
    if (mobileTotal) mobileTotal.textContent = "S/ " + subtotalCarrito.toFixed(2);
    if (mobileBar) mobileBar.hidden = !itemsPagables.length;
    if (mobileButton) mobileButton.disabled = !itemsPagables.length;
}

async function aceptarCotizacion(id) {
    if (!compraConCuenta) return alert("Inicia sesión para consultar y aceptar una cotización personalizada");
    if (!confirm("¿Aceptar el precio de esta personalización?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados/${encodeURIComponent(id)}/aceptar`, {method: "POST"});
    if (!respuesta.ok) {
        alert(await obtenerMensajeRespuesta(respuesta, "No se pudo aceptar la cotización"));
        return;
    }
    alert("Cotización aceptada. El producto ya puede incluirse en el pago.");
    cargarCarrito();
}

function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto del carrito?")) return;
    if (!compraConCuenta) {
        eliminarDelCarritoInvitado(id);
        cargarCarrito();
        return;
    }
    fetchConSesion(`${API_URL}/carrito/${encodeURIComponent(id)}`, {method: "DELETE"})
            .then(r => { if (!r.ok) throw new Error("No se pudo eliminar"); return cargarCarrito(); })
            .catch(e => alert(e.message));
}

async function actualizarCantidad(id,cantidad) {
    const numero=Number(cantidad);
    if(!Number.isInteger(numero)||numero<1||numero>20){
        alert("La cantidad debe estar entre 1 y 20");
        return cargarCarrito();
    }
    if(operandoCantidad.has(String(id)))return;
    operandoCantidad.add(String(id));
    const input=[...document.querySelectorAll("[data-cantidad]")].find(el=>el.dataset.cantidad===String(id));
    const botones=input?.closest(".cantidad-producto")?.querySelectorAll("button");
    if(input)input.disabled=true;
    botones?.forEach(btn=>btn.disabled=true);
    try{
        if(!compraConCuenta)actualizarCarritoInvitado(id,numero);
        else{
            const response=await fetchConSesion(`${API_URL}/carrito/${encodeURIComponent(id)}/${numero}`,{method:"PUT"});
            if(!response.ok)throw new Error("No se pudo actualizar la cantidad");
        }
        await cargarCarrito();
    }catch(error){
        alert(error.message);
        await cargarCarrito();
    }finally{operandoCantidad.delete(String(id))}
}

function vaciarCarrito() {
    if (!confirm("¿Vaciar todo el carrito?")) return;
    if (!compraConCuenta) {
        vaciarCarritoInvitado();
        cargarCarrito();
        return;
    }
    fetchConSesion(`${API_URL}/carrito/mios`, {method: "DELETE"})
            .then(respuesta => { if (!respuesta.ok) throw new Error("No se pudo vaciar"); return cargarCarrito(); })
            .catch(e => alert(e.message));
}

function abrirCheckout() {
    if (subtotalCarrito <= 0) {
        alert(cantidadVariantesIncompletas
                ? "Elige el color o ajusta la cantidad de los productos marcados antes de pagar."
                : (cantidadPendientes ? "Tus productos personalizados todavía están en cotización." : "Tu carrito está vacío"));
        return;
    }
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correoCheckout");
    if (nombre && !nombre.value && compraConCuenta) nombre.value = obtenerNombreVisible(usuarioCarrito);
    if (correo && !correo.value && compraConCuenta) correo.value = usuarioCarrito.correo || "";
    document.getElementById("totalCheckout").textContent = `S/ ${subtotalCarrito.toFixed(2)}`;
    document.getElementById("modalCheckout").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function cerrarCheckout() {
    document.getElementById("modalCheckout").style.display = "none";
    document.body.style.overflow = "";
}

function intentarAbrirCheckoutAutomatico() {
    if (!abrirCheckoutAutomatico || subtotalCarrito <= 0) return;
    abrirCheckoutAutomatico = false;
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url);
    setTimeout(abrirCheckout, 180);
}

async function confirmarCompra() {
    if (!itemsPagables.length) return alert("No hay productos con precio disponible para confirmar");

    const nombreCliente = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correoCheckout").value.trim().toLowerCase();
    const telefono = document.getElementById("telefono").value.trim();
    const metodoEnvio = document.getElementById("metodoEnvio").value;
    const destinoEnvio = document.getElementById("direccion").value.trim();
    const referenciaEnvio = document.getElementById("referenciaEnvio").value.trim();
    const metodoPago = document.getElementById("metodoPago").value;
    const referenciaPago = document.getElementById("referenciaPago").value.trim();

    if (!nombreCliente || !telefono) return alert("Completa tu nombre y teléfono");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return alert("Escribe un correo válido para recibir la confirmación");
    if (!metodoEnvio || !destinoEnvio) return alert("Selecciona el envío y escribe el destino");
    if (!metodoPago) return alert("Selecciona un método de pago");
    if (!referenciaPago) return alert("Escribe el código o número de operación del pago");
    if (!document.getElementById("aceptarLegalesCheckout")?.checked) {
        return alert("Debes aceptar los Términos y la Política de privacidad para registrar el pedido");
    }

    const items = itemsPagables.map(({item, producto, solicitud, personalizado, subtotal}) => ({
        productoId: producto.id,
        nombre: personalizado ? (solicitud?.productoNombre || producto.nombre) : producto.nombre,
        cantidad: Number(solicitud?.cantidad || item.cantidad || 1),
        talla: personalizado ? (solicitud?.talla || item.talla || "UNIDAD") : (item.talla || "UNIDAD"),
        color: personalizado ? (solicitud?.color || item.color || "PERSONALIZADO") : (item.color || "SIN_COLOR"),
        precioUnitario: personalizado ? Number(subtotal) : Number(producto.precio || 0),
        subtotal: Number(subtotal),
        personalizado: Boolean(personalizado),
        pedidoPersonalizadoId: solicitud?.id || null,
        imagen: solicitud?.imagenFrente || producto.imagen || ""
    }));

    const boton = document.getElementById("btnConfirmarCompra");
    boton.disabled = true;
    boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

    const cuerpo = {
        nombreCliente,
        correo,
        telefono,
        items,
        subtotal: subtotalCarrito,
        costoEnvio: null,
        total: subtotalCarrito,
        metodoPago,
        referenciaPago,
        estadoPago: "POR_VERIFICAR",
        metodoEnvio,
        destinoEnvio,
        referenciaEnvio,
        estadoEnvio: "PENDIENTE_COORDINACION",
        estado: "PENDIENTE",
        fecha: new Date().toISOString()
    };

    try {
        const respuesta = compraConCuenta
                ? await fetchConSesion(`${API_URL}/pedidos`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(cuerpo)
                })
                : await fetch(`${API_URL}/pedidos/invitado`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(cuerpo)
                });

        if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo registrar el pedido"));
        const pedidoGuardado = await respuesta.json();

        // El pedido ya fue registrado. Si falla la limpieza del carrito,
        // no bloquear la confirmación ni confundir al comprador con un error.
        if (compraConCuenta) {
            const limpieza = await Promise.allSettled(
                itemsPagables.map(({item}) =>
                    fetchConSesion(`${API_URL}/carrito/${encodeURIComponent(item.id)}`, {method: "DELETE"})
                        .then(respuesta => {
                            if (!respuesta.ok) throw new Error("No se pudo retirar un artículo del carrito");
                        })
                )
            );
            if (limpieza.some(resultado => resultado.status === "rejected")) {
                console.warn("Pedido confirmado; algunos artículos no pudieron retirarse del carrito.");
            }
        } else {
            vaciarCarritoInvitado();
        }

        cerrarCheckout();
        if (compraConCuenta) {
            alert("Pedido registrado. Verificaremos el pago de tus productos y coordinaremos el despacho. El envío se paga directamente al transportista.");
            window.location.href = "mis-pedidos.html";
        } else {
            const codigo = pedidoGuardado.codigoSeguimiento || pedidoGuardado.id;
            guardarReferenciaPedidoInvitado(pedidoGuardado, correo);
            alert(`Pedido registrado correctamente. Tu código de seguimiento es ${codigo}. También quedó guardado en este navegador.`);
            window.location.href = `mis-pedidos.html?codigo=${encodeURIComponent(codigo)}&correo=${encodeURIComponent(correo)}`;
        }
    } catch (error) {
        alert(error.message);
    } finally {
        boton.disabled = false;
        boton.innerHTML = '<i class="fa-solid fa-lock"></i> Registrar pago de productos';
    }
}

document.getElementById("pbCartMobileCheckout")?.addEventListener("click", () => {
    document.getElementById("btnAbrirCheckout")?.click();
});
function formatearEstadoCarrito(valor) { return String(valor || "PENDIENTE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()); }
function escaparCarrito(valor) { return String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escaparAtributoCarrito(valor) { return escaparCarrito(valor); }

window.cargarCarrito = cargarCarrito;
window.eliminarProducto = eliminarProducto;
window.actualizarCantidad = actualizarCantidad;
window.vaciarCarrito = vaciarCarrito;
window.abrirCheckout = abrirCheckout;
window.cerrarCheckout = cerrarCheckout;
window.confirmarCompra = confirmarCompra;
