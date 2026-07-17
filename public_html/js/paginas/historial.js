"use strict";

const usuarioHistorial = obtenerUsuarioSesion();
const contenedorHistorial = document.getElementById("historial");
const resumenHistorial = document.getElementById("resumenHistorial");
const botonLimpiar = document.getElementById("btnLimpiarHistorial");

if (!tieneSesionValida(usuarioHistorial)) {
    alert("Debes iniciar sesión para ver tu historial");
    window.location.replace("login.html");
} else {
    cargarHistorial();
}

botonLimpiar.addEventListener("click", limpiarHistorial);
contenedorHistorial.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-quitar-historial]");
    if (!boton) return;
    evento.preventDefault();
    evento.stopPropagation();
    eliminarProductoHistorial(Number(boton.dataset.quitarHistorial));
});

async function cargarHistorial() {
    contenedorHistorial.innerHTML = estadoHistorial("fa-spinner fa-spin", "Cargando tu historial...", "");
    try {
        const registros = await obtenerColeccionUsuario("historial", usuarioHistorial);
        const unicos = [];
        const vistos = new Set();
        registros.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).forEach(registro => {
            if (!vistos.has(registro.productoId)) {
                vistos.add(registro.productoId);
                unicos.push(registro);
            }
        });
        resumenHistorial.textContent = `${unicos.length} producto${unicos.length === 1 ? "" : "s"} visto${unicos.length === 1 ? "" : "s"}`;
        botonLimpiar.hidden = unicos.length === 0;
        if (!unicos.length) {
            contenedorHistorial.innerHTML = estadoHistorial("fa-clock", "Tu historial está vacío", "Los productos que visites aparecerán aquí.", true);
            return;
        }

        const completos = await Promise.all(unicos.map(async registro => {
            const respuesta = await fetch(`${API_URL}/productos/${registro.productoId}`);
            return respuesta.ok ? {registro, producto: await respuesta.json()} : null;
        }));

        contenedorHistorial.innerHTML = completos.filter(Boolean).map(({registro, producto}) => `
            <article class="tarjeta-cuenta">
                <button class="btn-quitar-tarjeta" type="button" data-quitar-historial="${producto.id}" aria-label="Eliminar del historial"><i class="fa-solid fa-xmark"></i></button>
                <a class="tarjeta-cuenta-imagen" href="detalles-producto.html?id=${producto.id}"><img src="${escaparHtmlSeguro(obtenerUrlImagen(producto.imagen))}" alt="${escaparHtmlSeguro(producto.nombre)}"></a>
                <div class="tarjeta-cuenta-contenido"><h2>${escaparHtmlSeguro(producto.nombre)}</h2><p class="tarjeta-cuenta-precio">S/ ${Number(producto.precio || 0).toFixed(2)}</p><p class="tarjeta-cuenta-fecha">Visto ${formatearFechaHistorial(registro.fecha)}</p></div>
            </article>`).join("");
        contenedorHistorial.querySelectorAll("img").forEach(img => img.addEventListener("error", () => manejarErrorImagen(img)));
    } catch (error) {
        console.error(error);
        contenedorHistorial.innerHTML = estadoHistorial("fa-triangle-exclamation", "No se pudo cargar el historial", error.message);
    }
}

async function eliminarProductoHistorial(productoId) {
    if (!confirm("¿Eliminar este producto de tu historial?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/historial/producto/${productoId}`, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeRespuesta(respuesta, "No se pudo eliminar del historial"));
    cargarHistorial();
}

async function limpiarHistorial() {
    if (!confirm("¿Eliminar todo tu historial? Esta acción no se puede deshacer.")) return;
    const respuesta = await fetchConSesion(`${API_URL}/historial/mios`, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeRespuesta(respuesta, "No se pudo limpiar el historial"));
    cargarHistorial();
}

function formatearFechaHistorial(valor) {
    if (!valor) return "recientemente";
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? "recientemente" : fecha.toLocaleString("es-PE", {dateStyle: "medium", timeStyle: "short"});
}

function estadoHistorial(icono, titulo, texto, enlace = false) {
    return `<div class="estado-vacio"><i class="fa-solid ${icono}"></i><h2>${escaparHtmlSeguro(titulo)}</h2>${texto ? `<p>${escaparHtmlSeguro(texto)}</p>` : ""}${enlace ? '<a href="productos.html">Explorar productos</a>' : ""}</div>`;
}
