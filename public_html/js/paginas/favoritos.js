"use strict";

const usuarioFavoritos = obtenerUsuarioSesion();
const contenedorFavoritos = document.getElementById("favoritos");
const resumenFavoritos = document.getElementById("resumenFavoritos");

if (!tieneSesionValida(usuarioFavoritos)) {
    alert("Debes iniciar sesión para ver tus favoritos");
    window.location.replace("login.html");
} else {
    cargarFavoritos();
}

contenedorFavoritos.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-quitar-favorito]");
    if (boton) {
        evento.preventDefault();
        evento.stopPropagation();
        quitarFavorito(boton.dataset.quitarFavorito);
    }
});

async function cargarFavoritos() {
    contenedorFavoritos.innerHTML = estadoVacio("fa-spinner fa-spin", "Cargando tus favoritos...", "");
    try {
        const favoritos = await obtenerColeccionUsuario("favoritos", usuarioFavoritos);
        resumenFavoritos.textContent = `${favoritos.length} producto${favoritos.length === 1 ? "" : "s"} guardado${favoritos.length === 1 ? "" : "s"}`;
        if (!favoritos.length) {
            contenedorFavoritos.innerHTML = estadoVacio("fa-heart-crack", "Aún no tienes favoritos", "Explora el catálogo y guarda los productos que más te gusten.", true);
            return;
        }

        const completos = await Promise.all(favoritos.map(async favorito => {
            const respuesta = await fetch(`${API_URL}/productos/${favorito.productoId}`);
            return respuesta.ok ? {favorito, producto: await respuesta.json()} : null;
        }));

        contenedorFavoritos.innerHTML = completos.filter(Boolean).map(({favorito, producto}) => `
            <article class="tarjeta-cuenta">
                <button class="btn-quitar-tarjeta" type="button" data-quitar-favorito="${escaparHtmlSeguro(favorito.id)}" aria-label="Quitar de favoritos"><i class="fa-solid fa-heart-crack"></i></button>
                <a class="tarjeta-cuenta-imagen" href="detalles-producto.html?id=${producto.id}"><img src="${escaparHtmlSeguro(obtenerUrlImagen(producto.imagen))}" alt="${escaparHtmlSeguro(producto.nombre)}"></a>
                <div class="tarjeta-cuenta-contenido"><h2>${escaparHtmlSeguro(producto.nombre)}</h2><p class="tarjeta-cuenta-precio">S/ ${Number(producto.precio || 0).toFixed(2)}</p></div>
            </article>`).join("");
        contenedorFavoritos.querySelectorAll("img").forEach(img => img.addEventListener("error", () => manejarErrorImagen(img)));
    } catch (error) {
        console.error(error);
        contenedorFavoritos.innerHTML = estadoVacio("fa-triangle-exclamation", "No se pudieron cargar tus favoritos", error.message);
    }
}

async function quitarFavorito(id) {
    if (!confirm("¿Quitar este producto de tus favoritos?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/favoritos/${encodeURIComponent(id)}`, {method: "DELETE"});
    if (!respuesta.ok) return alert("No se pudo quitar el favorito");
    cargarFavoritos();
}

function estadoVacio(icono, titulo, texto, mostrarEnlace = false) {
    return `<div class="estado-vacio"><i class="fa-solid ${icono}"></i><h2>${escaparHtmlSeguro(titulo)}</h2>${texto ? `<p>${escaparHtmlSeguro(texto)}</p>` : ""}${mostrarEnlace ? '<a href="productos.html">Ver productos</a>' : ""}</div>`;
}
