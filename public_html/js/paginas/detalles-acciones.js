"use strict";

let favoritoActualId = "";
let favoritoActualColor = "";
let favoritoActualTalla = "";

async function publicarResena() {
    const productoId = Number(new URLSearchParams(window.location.search).get("id"));
    const usuario = obtenerUsuarioSesion();
    if (!tieneSesionValida(usuario)) return alert("Debes iniciar sesión para publicar una reseña");
    const comentario = document.getElementById("comentarioResena").value.trim();
    if (!comentario) return alert("Escribe un comentario");
    const calificacion = Number(document.getElementById("calificacionResena").value);
    const respuesta = await fetchConSesion(`${API_URL}/resenas`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({productoId, ...crearReferenciaUsuario(usuario), aliasUsuario: obtenerNombreVisible(usuario), fotoPerfilUrl: usuario.fotoPerfilUrl || "", comentario, calificacion})
    });
    if (!respuesta.ok) return alert(await obtenerMensajeRespuesta(respuesta, "No se pudo publicar la reseña"));
    document.getElementById("comentarioResena").value = "";
    alert("Reseña publicada correctamente");
    if (window.cargarResenas) window.cargarResenas(true);
}

const usuarioFormularioResena = obtenerUsuarioSesion();
if (!usuarioFormularioResena) {
    const formulario = document.querySelector(".formulario-resena");
    if (formulario) formulario.innerHTML = `<div class="login-resena"><i class="fa-solid fa-comment-slash"></i><h3>Inicia sesión para escribir una reseña</h3><p>Debes iniciar sesión para compartir tu opinión.</p><a href="login.html"><button type="button">Iniciar sesión</button></a></div>`;
}

function seleccionarTalla(talla, botonSeleccionado) {
    tallaSeleccionada = talla;
    document.querySelectorAll(".tallas-producto button").forEach(boton => boton.classList.remove("activa"));
    botonSeleccionado.classList.add("activa");
    refrescarEstadoVarianteFavorita();
}

async function agregarCarrito(mostrarConfirmacion = true) {
    if (variantesColorProducto.length && colorSeleccionado === "") {
        alert("Selecciona un color");
        return false;
    }
    if (productoRequiereTalla && tallaSeleccionada === "") {
        alert("Selecciona una talla");
        return false;
    }
    const productoId = Number(new URLSearchParams(window.location.search).get("id"));
    const cantidad = Number(document.getElementById("cantidadProducto").value);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert("Ingresa una cantidad válida");
        return false;
    }
    const stockDisponible = variantesColorProducto.length
            ? obtenerStockColorProducto(productoActual, colorSeleccionado)
            : Number(productoActual?.stock || 0);
    if (productoActual && cantidad > stockDisponible) {
        alert(`La cantidad supera el stock disponible${colorSeleccionado && colorSeleccionado !== "SIN_COLOR" ? ` para el color ${colorSeleccionado}` : ""}`);
        return false;
    }

    const usuario = obtenerUsuarioSesion();
    const boton = document.getElementById("btnAgregarCarrito");
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Agregando...';
    }

    try {
        if (tieneSesionValida(usuario)) {
            const respuesta = await fetchConSesion(`${API_URL}/carrito`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({productoId, cantidad, talla: tallaSeleccionada || "UNIDAD", color: colorSeleccionado || "SIN_COLOR"})
            });
            if (!respuesta.ok) {
                alert(await obtenerMensajeRespuesta(respuesta, "No se pudo agregar el producto al carrito"));
                return false;
            }
        } else {
            agregarAlCarritoInvitado({productoId, cantidad, talla: tallaSeleccionada || "UNIDAD", color: colorSeleccionado || "SIN_COLOR"});
        }

        if (mostrarConfirmacion) {
            alert(tieneSesionValida(usuario)
                    ? "Producto agregado al carrito"
                    : "Producto agregado. Puedes finalizar tu compra sin crear una cuenta.");
        }
        return true;
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
        }
    }
}

async function comprarAhora() {
    const agregado = await agregarCarrito(false);
    if (agregado) window.location.href = "carrito de compras.html?checkout=1";
}

async function actualizarEstadoFavorito() {
    const boton = document.getElementById("btnAgregarFavorito");
    const usuario = obtenerUsuarioSesion();
    if (!usuario?.id) {
        boton.classList.remove("activo");
        boton.querySelector("span").textContent = "Guardar en favoritos";
        return;
    }
    const productoId = Number(new URLSearchParams(window.location.search).get("id"));
    const parametros = new URLSearchParams({usuarioId: usuario.id, usuario: usuario.nombre, productoId});
    const respuesta = await fetchConSesion(`${API_URL}/favoritos/estado?productoId=${encodeURIComponent(productoId)}`);
    if (!respuesta.ok) return;
    const estado = await respuesta.json();
    favoritoActualId = estado.id || "";
    favoritoActualColor = estado.color || "";
    favoritoActualTalla = estado.talla || "";
    refrescarEstadoVarianteFavorita();
}

function varianteFavoritaCoincide() {
    if (!favoritoActualId) return false;
    const colorActual = colorSeleccionado || (variantesColorProducto.length ? "" : "SIN_COLOR");
    const tallaActual = tallaSeleccionada || "SIN_TALLA";
    const coincideColor = !variantesColorProducto.length
            || !colorActual
            || normalizarTexto(colorActual) === normalizarTexto(favoritoActualColor);
    const tallaGuardadaUtil = favoritoActualTalla && !["SIN_TALLA", "UNIDAD"].includes(String(favoritoActualTalla).toUpperCase());
    const coincideTalla = !productoRequiereTalla
            || !tallaSeleccionada
            || !tallaGuardadaUtil
            || String(tallaActual).toUpperCase() === String(favoritoActualTalla).toUpperCase();
    return coincideColor && coincideTalla;
}

function refrescarEstadoVarianteFavorita() {
    aplicarEstadoFavorito(varianteFavoritaCoincide());
}

function aplicarEstadoFavorito(activo) {
    const boton = document.getElementById("btnAgregarFavorito");
    boton.classList.toggle("activo", activo);
    boton.setAttribute("aria-pressed", String(activo));
    boton.querySelector("i").className = `${activo ? "fa-solid" : "fa-regular"} fa-heart`;
    boton.querySelector("span").textContent = activo ? "Guardado en favoritos" : "Guardar en favoritos";
}

async function agregarFavorito() {
    const usuario = obtenerUsuarioSesion();
    if (!usuario?.id) return alert("Debes iniciar sesión");
    if (variantesColorProducto.length && !colorSeleccionado) return alert("Selecciona primero el color que deseas guardar");
    const productoId = Number(new URLSearchParams(window.location.search).get("id"));
    if (favoritoActualId && varianteFavoritaCoincide()) {
        const respuesta = await fetchConSesion(`${API_URL}/favoritos/${encodeURIComponent(favoritoActualId)}`, {method: "DELETE"});
        if (!respuesta.ok) return alert("No se pudo quitar de favoritos");
        favoritoActualId = "";
        favoritoActualColor = "";
        favoritoActualTalla = "";
        aplicarEstadoFavorito(false);
        return;
    }
    const respuesta = await fetchConSesion(`${API_URL}/favoritos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            productoId,
            color: colorSeleccionado || "SIN_COLOR",
            talla: tallaSeleccionada || "SIN_TALLA"
        })
    });
    if (!respuesta.ok) return alert(await obtenerMensajeRespuesta(respuesta, "No se pudo agregar a favoritos"));
    const guardado = await respuesta.json();
    favoritoActualId = guardado.id || "";
    favoritoActualColor = guardado.color || colorSeleccionado || "SIN_COLOR";
    favoritoActualTalla = guardado.talla || tallaSeleccionada || "SIN_TALLA";
    aplicarEstadoFavorito(true);
}

actualizarEstadoFavorito();

window.refrescarEstadoVarianteFavorita = refrescarEstadoVarianteFavorita;
window.agregarCarrito = agregarCarrito;
window.comprarAhora = comprarAhora;
