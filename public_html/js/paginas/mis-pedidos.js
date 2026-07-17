"use strict";

const estadoPedidos = document.getElementById("estadoPedidos");
const listaPedidos = document.getElementById("listaPedidos");
const usuarioPedidos = obtenerUsuarioSesion();
const CLAVE_ESTADOS_PEDIDOS = `pixbenEstadosPedidos:${usuarioPedidos?.id || "sin-usuario"}`;
let cargaPedidosEnCurso = false;

function escaparPedidos(valor) { return String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function mostrarEstadoPedidos(mensaje, esError = false) { estadoPedidos.textContent = mensaje; estadoPedidos.classList.toggle("error", esError); estadoPedidos.hidden = !mensaje; }
function estadoBonito(valor) { return String(valor || "PENDIENTE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()); }
function fechaBonita(valor) { if (!valor) return "Sin fecha"; const f = new Date(valor); return Number.isNaN(f.getTime()) ? String(valor) : f.toLocaleString("es-PE"); }


function resumenEstadoPedido(pedido, personalizado = false) {
    if (personalizado) {
        return [pedido.estado, pedido.precio, pedido.mensajeAdmin]
                .map(valor => String(valor ?? ""))
                .join("|");
    }
    return [pedido.estado, pedido.estadoPago, pedido.estadoEnvio]
            .map(valor => String(valor ?? ""))
            .join("|");
}

function etiquetaPedido(pedido, personalizado = false) {
    if (personalizado) return pedido.productoNombre || "Diseño personalizado";
    return `Pedido #${pedido.id ? pedido.id.slice(-8).toUpperCase() : "actualizado"}`;
}

function detectarCambiosPedidos(normales, personalizados) {
    const actuales = {};
    normales.forEach(pedido => {
        if (pedido?.id) actuales[`normal:${pedido.id}`] = resumenEstadoPedido(pedido, false);
    });
    personalizados.forEach(pedido => {
        if (pedido?.id) actuales[`personalizado:${pedido.id}`] = resumenEstadoPedido(pedido, true);
    });

    let anteriores = null;
    try {
        anteriores = JSON.parse(localStorage.getItem(CLAVE_ESTADOS_PEDIDOS) || "null");
    } catch {
        anteriores = null;
    }

    localStorage.setItem(CLAVE_ESTADOS_PEDIDOS, JSON.stringify(actuales));
    if (!anteriores || typeof anteriores !== "object") return;

    const cambios = [];
    normales.forEach(pedido => {
        const clave = `normal:${pedido.id}`;
        if (anteriores[clave] && anteriores[clave] !== actuales[clave]) {
            cambios.push({
                titulo: "Actualización de tu pedido",
                cuerpo: `${etiquetaPedido(pedido)}: ${estadoBonito(pedido.estado)} · Envío ${estadoBonito(pedido.estadoEnvio)}`
            });
        }
    });
    personalizados.forEach(pedido => {
        const clave = `personalizado:${pedido.id}`;
        if (anteriores[clave] && anteriores[clave] !== actuales[clave]) {
            cambios.push({
                titulo: "Actualización de tu diseño",
                cuerpo: `${etiquetaPedido(pedido, true)}: ${estadoBonito(pedido.estado)}`
            });
        }
    });

    if (cambios.length) {
        const cambio = cambios[0];
        window.PixBenPWA?.mostrarNotificacion(
                cambio.titulo,
                cambios.length > 1 ? `${cambio.cuerpo} y ${cambios.length - 1} cambio(s) más.` : cambio.cuerpo,
                "/htmls/mis-pedidos.html"
        );
    }
}

async function cargarPedidos() {
    if (cargaPedidosEnCurso) return;
    cargaPedidosEnCurso = true;

    if (!tieneSesionValida(usuarioPedidos)) {
        alert("Debes iniciar sesión para consultar tus pedidos");
        window.location.replace("login.html");
        return;
    }

    try {
        const [normales, personalizados] = await Promise.all([
            obtenerColeccionUsuario("pedidos", usuarioPedidos),
            obtenerColeccionUsuario("pedidos-personalizados", usuarioPedidos)
        ]);
        mostrarEstadoPedidos("");
        detectarCambiosPedidos(normales, personalizados);

        if (!normales.length && !personalizados.length) {
            listaPedidos.innerHTML = '<div class="sin-pedidos"><i class="fa-solid fa-box-open"></i><h2>Todavía no tienes pedidos</h2><p>Tus compras y solicitudes personalizadas aparecerán aquí.</p></div>';
            return;
        }

        const tarjetasPersonalizadas = personalizados.map(p => {
            const precio = p.precio == null ? "Por procesar" : `S/ ${Number(p.precio).toFixed(2)}`;
            const imagen = p.imagenFrente || p.imagenEspalda;
            return `<article class="tarjeta-pedido pedido-personalizado-usuario">
                <div class="pedido-superior"><div><span class="tipo-pedido">Personalizado</span><h2>${escaparPedidos(p.productoNombre || "Diseño personalizado")}</h2><p class="pedido-fecha">${escaparPedidos(fechaBonita(p.fechaCreacion))}</p></div><span class="estado-pedido">${escaparPedidos(estadoBonito(p.estado))}</span></div>
                <div class="pedido-personalizado-contenido">${imagen ? `<img src="${escaparPedidos(imagen)}" alt="Vista previa">` : ""}<div><p>${escaparPedidos(p.color || "")} · ${escaparPedidos(p.talla || "Unidad")} · ${Number(p.cantidad || 1)} unidad(es)</p><p>${escaparPedidos(p.mensajeAdmin || "Estamos procesando tu solicitud.")}</p></div></div>
                <div class="pedido-total"><span>Precio</span><strong>${escaparPedidos(precio)}</strong></div>
            </article>`;
        }).join("");

        const tarjetasNormales = normales.slice().reverse().map((p, i) => {
            const items = Array.isArray(p.items) && p.items.length
                    ? `<ul class="pedido-items">${p.items.map(item => `<li>${Number(item.cantidad || 1)}× ${escaparPedidos(item.nombre || "Producto")}${item.talla && item.talla !== "UNIDAD" ? ` · ${escaparPedidos(item.talla)}` : ""}</li>`).join("")}</ul>`
                    : '<p class="pedido-sin-detalle">El detalle de productos no fue registrado en esta compra anterior.</p>';
            const subtotal = Number(p.subtotal ?? p.total ?? 0);
            const envio = "Pago directo al transportista";
            const total = subtotal;
            return `<article class="tarjeta-pedido">
                <div class="pedido-superior"><div><span class="tipo-pedido normal">Compra normal</span><h2>Pedido #${escaparPedidos(p.id ? p.id.slice(-8).toUpperCase() : i + 1)}</h2><p class="pedido-fecha">${escaparPedidos(fechaBonita(p.fecha))}</p></div><span class="estado-pedido">${escaparPedidos(estadoBonito(p.estado))}</span></div>
                ${items}
                <div class="pedido-datos-logistica"><p><b>Pago:</b> ${escaparPedidos(estadoBonito(p.metodoPago || "Sin método"))} · ${escaparPedidos(estadoBonito(p.estadoPago || "Por verificar"))}</p><p><b>Envío:</b> ${escaparPedidos(estadoBonito(p.metodoEnvio || "Por coordinar"))} · ${escaparPedidos(estadoBonito(p.estadoEnvio || "Pendiente coordinación"))}</p><p><b>Destino:</b> ${escaparPedidos(p.destinoEnvio || "Pendiente")}</p></div>
                <div class="pedido-desglose"><span>Productos <b>S/ ${subtotal.toFixed(2)}</b></span><span>Envío <b>${envio}</b></span></div>
                <div class="pedido-total"><span>Total pagado a PixBen</span><strong>S/ ${total.toFixed(2)}</strong></div>
            </article>`;
        }).join("");
        listaPedidos.innerHTML = tarjetasPersonalizadas + tarjetasNormales;
    } catch (error) {
        console.error(error);
        mostrarEstadoPedidos(error.message || "No se pudieron cargar tus pedidos", true);
    } finally {
        cargaPedidosEnCurso = false;
    }
}

cargarPedidos();

window.setInterval(() => {
    if (!document.hidden && navigator.onLine) cargarPedidos();
}, 90 * 1000);

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && navigator.onLine) cargarPedidos();
});
