"use strict";

const parametrosResena = new URLSearchParams(window.location.search);
const productoIdResenas = Number(parametrosResena.get("id"));
const usuarioResenas = obtenerUsuarioSesion();
const contenedorResenas = document.getElementById("listaResenas");
const botonVerMasResenas = document.getElementById("btnVerMasResenas");
let paginaResenas = 0;
const tamanioPaginaResenas = 6;

botonVerMasResenas.addEventListener("click", () => cargarResenas(false));
contenedorResenas.addEventListener("click", evento => {
    const like = evento.target.closest("[data-like-resena]");
    const editar = evento.target.closest("[data-editar-resena]");
    const eliminar = evento.target.closest("[data-eliminar-resena]");
    if (like) alternarMeGusta(like);
    if (editar) editarResena(editar.dataset.editarResena, editar.dataset.comentario || "");
    if (eliminar) eliminarResena(eliminar.dataset.eliminarResena);
});

async function cargarResenas(reiniciar = true) {
    if (reiniciar) {
        paginaResenas = 0;
        contenedorResenas.innerHTML = '<p class="cargando-resenas"><i class="fa-solid fa-spinner fa-spin"></i> Cargando reseñas...</p>';
    }
    botonVerMasResenas.disabled = true;
    try {
        const parametros = new URLSearchParams({page: paginaResenas, size: tamanioPaginaResenas});
        const respuesta = await fetchConSesionOpcional(`${API_URL}/resenas/producto/${productoIdResenas}/pagina?${parametros}`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar las reseñas");
        const pagina = await respuesta.json();
        const resenas = Array.isArray(pagina.contenido) ? pagina.contenido : [];
        document.getElementById("totalResenas").textContent = `${pagina.totalElementos || 0} reseña${Number(pagina.totalElementos) === 1 ? "" : "s"}`;

        if (reiniciar) contenedorResenas.innerHTML = "";
        if (!resenas.length && paginaResenas === 0) {
            contenedorResenas.innerHTML = '<div class="sin-resenas"><i class="fa-regular fa-comments"></i><p>Todavía no hay reseñas. Sé la primera persona en opinar.</p></div>';
        } else {
            contenedorResenas.insertAdjacentHTML("beforeend", resenas.map(renderizarResena).join(""));
            contenedorResenas.querySelectorAll(".resena-avatar").forEach(img => img.addEventListener("error", () => { img.src = AVATAR_FALLBACK; }));
        }
        paginaResenas += 1;
        botonVerMasResenas.hidden = !pagina.hayMas;
    } catch (error) {
        console.error(error);
        if (paginaResenas === 0) contenedorResenas.innerHTML = `<div class="sin-resenas">${escaparHtmlSeguro(error.message)}</div>`;
    } finally {
        botonVerMasResenas.disabled = false;
    }
}

function renderizarResena(resena) {
    const propia = usuarioResenas && (Number(usuarioResenas.id) === Number(resena.usuarioId) || usuarioResenas.rol === "admin");
    const acciones = propia ? `<div class="acciones-resena"><button type="button" data-editar-resena="${escaparHtmlSeguro(resena.id)}" data-comentario="${escaparHtmlSeguro(resena.comentario)}"><i class="fa-solid fa-pen"></i></button><button type="button" data-eliminar-resena="${escaparHtmlSeguro(resena.id)}"><i class="fa-solid fa-trash"></i></button></div>` : "";
    const foto = resena.fotoPerfilUrl || AVATAR_FALLBACK;
    const fecha = resena.fecha ? new Date(resena.fecha).toLocaleString("es-PE", {dateStyle: "medium", timeStyle: "short"}) : "";
    return `<article class="reseña-card" data-resena-id="${escaparHtmlSeguro(resena.id)}">
        <div class="resena-cabecera"><div class="resena-autor"><img class="resena-avatar" src="${escaparHtmlSeguro(foto)}" alt="Avatar"><div class="resena-identidad"><h4>${escaparHtmlSeguro(resena.aliasUsuario || resena.usuario || "Cliente PixBen")}</h4><span class="resena-estrellas">${"★".repeat(Number(resena.calificacion || 0))}${"☆".repeat(Math.max(0,5-Number(resena.calificacion || 0)))}</span></div></div><small class="resena-fecha">${escaparHtmlSeguro(fecha)}${resena.editada ? " · Editada" : ""}</small></div>
        <p class="resena-comentario">${escaparHtmlSeguro(resena.comentario)}</p>
        <div class="resena-pie"><button class="btn-me-gusta ${resena.meGustaUsuarioActual ? "activo" : ""}" type="button" data-like-resena="${escaparHtmlSeguro(resena.id)}" aria-pressed="${Boolean(resena.meGustaUsuarioActual)}"><i class="${resena.meGustaUsuarioActual ? "fa-solid" : "fa-regular"} fa-heart"></i><span data-like-cantidad>${Number(resena.cantidadMeGusta || 0)}</span></button>${acciones}</div>
    </article>`;
}

async function alternarMeGusta(boton) {
    if (!usuarioResenas?.id) {
        alert("Inicia sesión para indicar que una reseña te resulta útil");
        return;
    }
    const respuesta = await fetchConSesion(`${API_URL}/resenas/${encodeURIComponent(boton.dataset.likeResena)}/me-gusta`, {method: "POST"});
    if (!respuesta.ok) return alert("No se pudo registrar tu reacción");
    const datos = await respuesta.json();
    boton.classList.toggle("activo", Boolean(datos.activo));
    boton.setAttribute("aria-pressed", String(Boolean(datos.activo)));
    boton.querySelector("i").className = `${datos.activo ? "fa-solid" : "fa-regular"} fa-heart`;
    boton.querySelector("[data-like-cantidad]").textContent = datos.cantidad;
}

async function editarResena(id, comentarioActual) {
    const comentario = prompt("Editar comentario:", comentarioActual);
    if (comentario === null) return;
    const limpio = comentario.trim();
    if (!limpio) return alert("El comentario no puede quedar vacío");
    const respuesta = await fetchConSesion(`${API_URL}/resenas/${encodeURIComponent(id)}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({comentario: limpio})});
    if (!respuesta.ok) return alert(await obtenerMensajeRespuesta(respuesta, "No se pudo editar la reseña"));
    cargarResenas(true);
}

async function eliminarResena(id) {
    if (!confirm("¿Eliminar esta reseña?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/resenas/${encodeURIComponent(id)}`, {method: "DELETE"});
    if (!respuesta.ok) return alert("No se pudo eliminar la reseña");
    cargarResenas(true);
}

window.cargarResenas = cargarResenas;
cargarResenas(true);
