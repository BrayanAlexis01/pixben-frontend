"use strict";

const usuarioCarrito = obtenerUsuarioSesion();
const compraConCuenta = tieneSesionValida(usuarioCarrito);
let subtotalCarrito = 0;
let itemsPagables = [];
let cantidadPendientes = 0;
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
                    talla: item.talla || "UNIDAD"
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
});

document.getElementById("listaCarrito")?.addEventListener("change", evento => {
    const input = evento.target.closest("[data-cantidad]");
    if (input) actualizarCantidad(input.dataset.cantidad, input.value);
});

async function cargarCarrito() {
    const lista = document.getElementById("listaCarrito");
    lista.innerHTML = '<p class="estado-carrito">Cargando carrito...</p>';
    subtotalCarrito = 0;
    cantidadPendientes = 0;
    itemsPagables = [];

    try {
        const carrito = compraConCuenta
                ? await obtenerColeccionUsuario("carrito", usuarioCarrito)
                : obtenerCarritoInvitado();

        if (!carrito.length) {
            lista.innerHTML = '<div class="carrito-vacio"><i class="fa-solid fa-cart-shopping"></i><h3>Tu carrito está vacío</h3><p>Explora los productos disponibles y agrega los que más te gusten.</p></div>';
            actualizarResumen();
            return;
        }

        const completos = await Promise.all(carrito.map(cargarItemCompleto));
        lista.innerHTML = completos.filter(Boolean).map(renderizarItem).join("");
        actualizarResumen();
        intentarAbrirCheckoutAutomatico();
    } catch (error) {
        console.error(error);
        lista.innerHTML = `<p class="error-carrito">${escaparCarrito(error.message)}</p>`;
    }
}

async function cargarItemCompleto(item) {
    if (item.personalizado && item.pedidoPersonalizadoId) {
        try {
            const respuestaSolicitud = await fetchConSesion(`${API_URL}/pedidos-personalizados/${encodeURIComponent(item.pedidoPersonalizadoId)}`);
            const solicitud = respuestaSolicitud.ok ? await respuestaSolicitud.json() : null;
            let producto = null;
            if (item.productoId != null) {
                const respuestaProducto = await fetch(`${API_URL}/productos/${item.productoId}`);
                if (respuestaProducto.ok) producto = await respuestaProducto.json();
            }
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

    const respuestaProducto = await fetch(`${API_URL}/productos/${item.productoId}`);
    if (!respuestaProducto.ok) return null;
    const producto = await respuestaProducto.json();
    return {item, producto, solicitud: null};
}

function renderizarItem({item, producto, solicitud}) {
    if (item.personalizado) return renderizarPersonalizado(item, producto, solicitud);

    const precio = Number(producto.precio || 0);
    const cantidad = Number(item.cantidad || 1);
    const subtotal = precio * cantidad;
    subtotalCarrito += subtotal;
    itemsPagables.push({item, producto, solicitud: null, personalizado: false, subtotal});

    return `<article class="producto-carrito">
        <img src="${escaparAtributoCarrito(obtenerUrlImagen(producto.imagen))}" alt="${escaparAtributoCarrito(producto.nombre)}" onerror="manejarErrorImagen(this)">
        <div class="producto-info">
            <h3>${escaparCarrito(producto.nombre)}</h3>
            ${productoUsaTalla(producto.categoria, producto.nombre) ? `<p>Talla: ${escaparCarrito(item.talla || "No seleccionada")}</p>` : "<p>Presentación: Unidad</p>"}
            <p class="precio">S/ ${precio.toFixed(2)}</p>
            <p class="subtotal-linea">Subtotal: <b>S/ ${subtotal.toFixed(2)}</b></p>
        </div>
        <div class="cantidad-producto"><input type="number" min="1" max="50" value="${cantidad}" data-cantidad="${escaparAtributoCarrito(item.id)}" aria-label="Cantidad"></div>
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
    pendientes.textContent = cantidadPendientes
            ? `${cantidadPendientes} producto(s) personalizado(s) aún no se incluyen en el total porque están en cotización.`
            : "";
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

function actualizarCantidad(id, cantidad) {
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1 || numero > 50) return alert("La cantidad debe estar entre 1 y 50");
    if (!compraConCuenta) {
        actualizarCarritoInvitado(id, numero);
        cargarCarrito();
        return;
    }
    fetchConSesion(`${API_URL}/carrito/${encodeURIComponent(id)}/${numero}`, {method: "PUT"})
            .then(r => { if (!r.ok) throw new Error("No se pudo actualizar"); return cargarCarrito(); })
            .catch(e => alert(e.message));
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
        alert(cantidadPendientes ? "Tus productos personalizados todavía están en cotización." : "Tu carrito está vacío");
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

    const items = itemsPagables.map(({item, producto, solicitud, personalizado, subtotal}) => ({
        productoId: producto.id,
        nombre: personalizado ? (solicitud?.productoNombre || producto.nombre) : producto.nombre,
        cantidad: Number(solicitud?.cantidad || item.cantidad || 1),
        talla: personalizado ? (solicitud?.talla || item.talla || "UNIDAD") : (item.talla || "UNIDAD"),
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

        if (compraConCuenta) {
            await Promise.all(itemsPagables.map(({item}) => fetchConSesion(`${API_URL}/carrito/${encodeURIComponent(item.id)}`, {method: "DELETE"})));
        } else {
            vaciarCarritoInvitado();
        }

        cerrarCheckout();
        if (compraConCuenta) {
            alert("Pedido registrado. Verificaremos el pago de tus productos y coordinaremos el despacho. El envío se paga directamente al transportista.");
            window.location.href = "mis-pedidos.html";
        } else {
            alert(`Pedido registrado correctamente. Tu código de pedido es ${pedidoGuardado.id}. Guarda este código. PixBen se comunicará al correo o teléfono indicado para confirmar el pago y el envío.`);
            window.location.href = "productos.html";
        }
    } catch (error) {
        alert(error.message);
    } finally {
        boton.disabled = false;
        boton.innerHTML = '<i class="fa-solid fa-lock"></i> Registrar pago de productos';
    }
}

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
