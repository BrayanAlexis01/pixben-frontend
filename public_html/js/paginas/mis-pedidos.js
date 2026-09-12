"use strict";

const estadoPedidos = document.getElementById("estadoPedidos");
const listaPedidos = document.getElementById("listaPedidos");
const usuarioPedidos = obtenerUsuarioSesion();
const compraConCuentaPedidos = tieneSesionValida(usuarioPedidos);
const CLAVE_ESTADOS_PEDIDOS = `pixbenEstadosPedidos:${usuarioPedidos?.id || "invitado"}`;
let cargaPedidosEnCurso = false;
let consultasInvitadoActivas = [];

function escaparPedidos(valor) {
    return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
}

function mostrarEstadoPedidos(mensaje, esError = false) {
    estadoPedidos.textContent = mensaje;
    estadoPedidos.classList.toggle("error", esError);
    estadoPedidos.hidden = !mensaje;
}

function estadoBonito(valor) {
    return String(valor || "PENDIENTE")
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, letra => letra.toUpperCase());
}

function fechaBonita(valor) {
    if (!valor) return "Sin fecha";
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString("es-PE");
}

function codigoVisible(pedido) {
    return pedido?.codigoSeguimiento || (pedido?.id ? `#${pedido.id.slice(-8).toUpperCase()}` : "Pedido");
}

function renderizarItemsPedido(pedido) {
    if (!Array.isArray(pedido.items) || !pedido.items.length) {
        return '<p class="pedido-sin-detalle">El detalle de productos no fue registrado en esta compra anterior.</p>';
    }
    return `<ul class="pedido-items">${pedido.items.map(item => {
        const variantes = [
            item.color && !["SIN_COLOR", "PERSONALIZADO"].includes(item.color) ? `Color: ${item.color}` : "",
            item.talla && !["UNIDAD", "SIN_TALLA"].includes(item.talla) ? `Talla: ${item.talla}` : ""
        ].filter(Boolean).join(" · ");
        return `<li><b>${Number(item.cantidad || 1)}×</b> ${escaparPedidos(item.nombre || "Producto")}${variantes ? `<small>${escaparPedidos(variantes)}</small>` : ""}</li>`;
    }).join("")}</ul>`;
}

function renderizarPedidoNormal(pedido) {
    const subtotal = Number(pedido.subtotal ?? pedido.total ?? 0);
    return `<article class="tarjeta-pedido">
        <div class="pedido-superior">
            <div>
                <span class="tipo-pedido normal">${pedido.invitado ? "Compra como invitado" : "Compra normal"}</span>
                <h2>${escaparPedidos(codigoVisible(pedido))}</h2>
                <p class="pedido-fecha">${escaparPedidos(fechaBonita(pedido.fecha))}</p>
            </div>
            <span class="estado-pedido">${escaparPedidos(estadoBonito(pedido.estado))}</span>
        </div>
        ${renderizarItemsPedido(pedido)}
        <div class="pedido-datos-logistica">
            <p><b>Pago:</b> ${escaparPedidos(estadoBonito(pedido.metodoPago || "Sin método"))} · ${escaparPedidos(estadoBonito(pedido.estadoPago || "Por verificar"))}</p>
            <p><b>Envío:</b> ${escaparPedidos(estadoBonito(pedido.metodoEnvio || "Por coordinar"))} · ${escaparPedidos(estadoBonito(pedido.estadoEnvio || "Pendiente coordinación"))}</p>
            <p><b>Destino:</b> ${escaparPedidos(pedido.destinoEnvio || "Pendiente")}</p>
        </div>
        <div class="pedido-desglose"><span>Productos <b>S/ ${subtotal.toFixed(2)}</b></span><span>Envío <b>Pago directo al transportista</b></span></div>
        <div class="pedido-total"><span>Total pagado a PixBen</span><strong>S/ ${subtotal.toFixed(2)}</strong></div>
    </article>`;
}

function renderizarPedidoPersonalizado(pedido) {
    const precio = pedido.precio == null ? "Por procesar" : `S/ ${Number(pedido.precio).toFixed(2)}`;
    const imagen = pedido.imagenFrente || pedido.imagenEspalda;
    return `<article class="tarjeta-pedido pedido-personalizado-usuario">
        <div class="pedido-superior">
            <div><span class="tipo-pedido">Personalizado</span><h2>${escaparPedidos(pedido.productoNombre || "Diseño personalizado")}</h2><p class="pedido-fecha">${escaparPedidos(fechaBonita(pedido.fechaCreacion))}</p></div>
            <span class="estado-pedido">${escaparPedidos(estadoBonito(pedido.estado))}</span>
        </div>
        <div class="pedido-personalizado-contenido">
            ${imagen ? `<img src="${escaparPedidos(imagen)}" alt="Vista previa">` : ""}
            <div><p>${escaparPedidos(pedido.color || "Color por confirmar")} · ${escaparPedidos(pedido.talla || "Unidad")} · ${Number(pedido.cantidad || 1)} unidad(es)</p><p>${escaparPedidos(pedido.mensajeAdmin || "Estamos procesando tu solicitud.")}</p></div>
        </div>
        <div class="pedido-total"><span>Precio</span><strong>${escaparPedidos(precio)}</strong></div>
    </article>`;
}

function resumenEstadoPedido(pedido, personalizado = false) {
    if (personalizado) return [pedido.estado, pedido.precio, pedido.mensajeAdmin].join("|");
    return [pedido.estado, pedido.estadoPago, pedido.estadoEnvio].join("|");
}

function detectarCambiosPedidos(normales, personalizados) {
    const actuales = {};
    normales.forEach(pedido => { if (pedido?.id) actuales[`normal:${pedido.id}`] = resumenEstadoPedido(pedido); });
    personalizados.forEach(pedido => { if (pedido?.id) actuales[`personalizado:${pedido.id}`] = resumenEstadoPedido(pedido, true); });

    let anteriores = null;
    try { anteriores = JSON.parse(localStorage.getItem(CLAVE_ESTADOS_PEDIDOS) || "null"); } catch {}
    localStorage.setItem(CLAVE_ESTADOS_PEDIDOS, JSON.stringify(actuales));
    if (!anteriores || typeof anteriores !== "object") return;

    const cambio = normales.find(pedido => anteriores[`normal:${pedido.id}`] && anteriores[`normal:${pedido.id}`] !== actuales[`normal:${pedido.id}`]);
    if (cambio) {
        window.PixBenPWA?.mostrarNotificacion(
                "Actualización de tu pedido",
                `${codigoVisible(cambio)}: ${estadoBonito(cambio.estado)} · Envío ${estadoBonito(cambio.estadoEnvio)}`,
                "/htmls/mis-pedidos.html"
        );
    }
}

async function cargarPedidosCuenta() {
    if (cargaPedidosEnCurso) return;
    cargaPedidosEnCurso = true;
    mostrarEstadoPedidos("Cargando tus pedidos...");
    try {
        const [normales, personalizados] = await Promise.all([
            obtenerColeccionUsuario("pedidos", usuarioPedidos),
            obtenerColeccionUsuario("pedidos-personalizados", usuarioPedidos)
        ]);
        detectarCambiosPedidos(normales, personalizados);
        mostrarEstadoPedidos("");
        if (!normales.length && !personalizados.length) {
            listaPedidos.innerHTML = '<div class="sin-pedidos"><i class="fa-solid fa-box-open"></i><h2>Todavía no tienes pedidos</h2><p>Tus compras y solicitudes personalizadas aparecerán aquí.</p></div>';
            return;
        }
        listaPedidos.innerHTML = personalizados.map(renderizarPedidoPersonalizado).join("")
                + normales.slice().reverse().map(renderizarPedidoNormal).join("");
    } catch (error) {
        console.error(error);
        mostrarEstadoPedidos(error.message || "No se pudieron cargar tus pedidos", true);
    } finally {
        cargaPedidosEnCurso = false;
    }
}

async function consultarPedidoInvitado(codigo, correo, mostrarCarga = true) {
    const codigoLimpio = String(codigo || "").trim().toUpperCase();
    const correoLimpio = String(correo || "").trim().toLowerCase();
    if (!codigoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correoLimpio)) {
        throw new Error("Escribe un código y correo válidos");
    }
    if (mostrarCarga) mostrarEstadoPedidos("Consultando pedido...");
    const respuesta = await fetch(`${API_URL}/pedidos/invitado/consultar`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({codigo: codigoLimpio, correo: correoLimpio})
    });
    if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No encontramos ese pedido"));
    const pedido = await respuesta.json();
    guardarReferenciaPedidoInvitado(pedido, correoLimpio);
    return pedido;
}

function renderizarReferenciasInvitado() {
    const contenedor = document.getElementById("pedidosGuardadosInvitado");
    const referencias = obtenerPedidosInvitadoGuardados();
    if (!referencias.length) {
        contenedor.innerHTML = '<p class="sin-referencias">Los pedidos realizados desde este navegador aparecerán aquí automáticamente.</p>';
        return;
    }
    contenedor.innerHTML = `<h3>Guardados en este navegador</h3><div>${referencias.map(ref => `
        <button type="button" class="referencia-invitado" data-codigo-guardado="${escaparPedidos(ref.codigo)}" data-correo-guardado="${escaparPedidos(ref.correo)}">
            <i class="fa-solid fa-box"></i><span><b>${escaparPedidos(ref.codigo)}</b><small>${escaparPedidos(ref.correo)}</small></span>
        </button>`).join("")}</div>`;
}

async function cargarPedidosInvitadoGuardados() {
    const referencias = obtenerPedidosInvitadoGuardados();
    consultasInvitadoActivas = referencias;
    renderizarReferenciasInvitado();
    if (!referencias.length) {
        mostrarEstadoPedidos("Escribe los datos de tu pedido para consultarlo.");
        listaPedidos.innerHTML = "";
        return;
    }

    mostrarEstadoPedidos("Actualizando pedidos guardados...");
    const resultados = await Promise.allSettled(referencias.map(ref => consultarPedidoInvitado(ref.codigo, ref.correo, false)));
    const pedidos = resultados.filter(resultado => resultado.status === "fulfilled").map(resultado => resultado.value);
    if (!pedidos.length) {
        mostrarEstadoPedidos("No pudimos actualizar los pedidos guardados. Comprueba tu conexión o consulta uno manualmente.", true);
        return;
    }
    mostrarEstadoPedidos("");
    listaPedidos.innerHTML = pedidos
            .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
            .map(renderizarPedidoNormal).join("");
}

function configurarVistaInvitado() {
    document.getElementById("consultaPedidoInvitado").hidden = false;
    document.getElementById("enlacePerfilPedidos").hidden = true;
    document.getElementById("enlaceLoginPedidos").hidden = false;
    document.getElementById("etiquetaPedidos").textContent = "SEGUIMIENTO";
    document.getElementById("tituloPedidos").textContent = "Consulta tus pedidos";
    document.getElementById("descripcionPedidos").textContent = "Puedes comprar y revisar el avance sin crear una cuenta.";

    const form = document.getElementById("formConsultaInvitado");
    form.addEventListener("submit", async evento => {
        evento.preventDefault();
        const codigo = document.getElementById("codigoPedidoInvitado").value;
        const correo = document.getElementById("correoPedidoInvitado").value;
        const boton = form.querySelector("button[type='submit']");
        boton.disabled = true;
        try {
            const pedido = await consultarPedidoInvitado(codigo, correo);
            mostrarEstadoPedidos("");
            listaPedidos.innerHTML = renderizarPedidoNormal(pedido);
            renderizarReferenciasInvitado();
            const url = new URL(window.location.href);
            url.searchParams.set("codigo", pedido.codigoSeguimiento || pedido.id);
            url.searchParams.delete("correo");
            history.replaceState({}, "", url);
        } catch (error) {
            mostrarEstadoPedidos(error.message, true);
        } finally {
            boton.disabled = false;
        }
    });

    document.getElementById("pedidosGuardadosInvitado").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-codigo-guardado]");
        if (!boton) return;
        document.getElementById("codigoPedidoInvitado").value = boton.dataset.codigoGuardado;
        document.getElementById("correoPedidoInvitado").value = boton.dataset.correoGuardado;
        form.requestSubmit();
    });

    const parametros = new URLSearchParams(window.location.search);
    const codigoUrl = parametros.get("codigo");
    const correoUrl = parametros.get("correo");
    if (codigoUrl) document.getElementById("codigoPedidoInvitado").value = codigoUrl;
    if (correoUrl) document.getElementById("correoPedidoInvitado").value = correoUrl;

    if (codigoUrl && correoUrl) form.requestSubmit();
    else cargarPedidosInvitadoGuardados();
}

if (compraConCuentaPedidos) {
    document.getElementById("consultaPedidoInvitado").hidden = true;
    document.getElementById("enlacePerfilPedidos").hidden = false;
    document.getElementById("enlaceLoginPedidos").hidden = true;
    cargarPedidosCuenta();
} else {
    configurarVistaInvitado();
}

window.setInterval(() => {
    if (document.hidden || !navigator.onLine) return;
    if (compraConCuentaPedidos) cargarPedidosCuenta();
    else if (obtenerPedidosInvitadoGuardados().length) cargarPedidosInvitadoGuardados();
}, 90 * 1000);

document.addEventListener("visibilitychange", () => {
    if (document.hidden || !navigator.onLine) return;
    if (compraConCuentaPedidos) cargarPedidosCuenta();
    else if (obtenerPedidosInvitadoGuardados().length) cargarPedidosInvitadoGuardados();
});
