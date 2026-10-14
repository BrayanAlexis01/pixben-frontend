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

        // Una sola consulta para los productos repetidos en tallas/colores.
        // Si un producto fue eliminado, conservamos la referencia para poder retirarla.
        const ids = [...new Set(favoritos.map(f => Number(f.productoId)).filter(Number.isInteger))];
        const productos = new Map();
        for (let i = 0; i < ids.length; i += 50) {
            const lote = ids.slice(i, i + 50);
            try {
                const respuesta = await fetch(`${API_URL}/productos/por-ids?ids=${lote.join(",")}`);
                if (!respuesta.ok) throw new Error("Consulta de favoritos no disponible");
                const datos = await respuesta.json();
                (Array.isArray(datos) ? datos : []).forEach(producto =>
                    productos.set(Number(producto.id), producto));
            } catch (error) {
                // Compatibilidad con versiones anteriores del backend.
                await Promise.all(lote.map(async id => {
                    try {
                        const r = await fetch(`${API_URL}/productos/${id}`);
                        if (r.ok) productos.set(id, await r.json());
                    } catch (errorProducto) {
                        console.warn("No se pudo cargar un favorito", id, errorProducto);
                    }
                }));
            }
        }

        const completos = await Promise.all(favoritos.map(async favorito => {
            const producto = productos.get(Number(favorito.productoId));
            if (!producto) return {favorito, producto:null, imagenVariante:null};
            try {
                return {favorito, producto,
                    imagenVariante:await obtenerImagenVarianteProducto(producto, favorito.color)};
            } catch (error) {
                console.warn("Sin imagen de variante para el favorito", favorito.id, error);
                return {favorito, producto, imagenVariante:producto.imagen || ""};
            }
        }));

        const noDisponibles = completos.filter(entrada => !entrada.producto).length;
        if (noDisponibles) {
            resumenFavoritos.textContent += ` · ${noDisponibles} no disponible${noDisponibles === 1 ? "" : "s"}`;
        }
        contenedorFavoritos.innerHTML = completos.map(({favorito, producto, imagenVariante}) => {
            if (!producto) {
                return `<article class="tarjeta-cuenta tarjeta-favorito-no-disponible">
                    <button class="btn-quitar-tarjeta" type="button" data-quitar-favorito="${escaparHtmlSeguro(favorito.id)}" aria-label="Quitar producto no disponible de favoritos"><i class="fa-solid fa-heart-crack"></i></button>
                    <div class="tarjeta-cuenta-contenido">
                        <h2>Producto no disponible</h2>
                        <p>Este producto ya no está en el catálogo. Puedes quitarlo de tus favoritos.</p>
                    </div></article>`;
            }
            const parametros = new URLSearchParams({id: producto.id});
            if (favorito.color && favorito.color !== "SIN_COLOR") parametros.set("color", favorito.color);
            const variante = [
                favorito.color && favorito.color !== "SIN_COLOR" ? `Color: ${favorito.color}` : "",
                favorito.talla && !["UNIDAD", "SIN_TALLA"].includes(favorito.talla) ? `Talla: ${favorito.talla}` : ""
            ].filter(Boolean).join(" · ");
            return `
            <article class="tarjeta-cuenta">
                <button class="btn-quitar-tarjeta" type="button" data-quitar-favorito="${escaparHtmlSeguro(favorito.id)}" aria-label="Quitar de favoritos"><i class="fa-solid fa-heart-crack"></i></button>
                <a class="tarjeta-cuenta-imagen" href="detalles-producto.html?${parametros.toString()}"><img src="${escaparHtmlSeguro(imagenVariante)}" alt="${escaparHtmlSeguro(producto.nombre)}" loading="lazy"></a>
                <div class="tarjeta-cuenta-contenido"><h2>${escaparHtmlSeguro(producto.nombre)}</h2>${variante ? `<p class="variante-favorito">${escaparHtmlSeguro(variante)}</p>` : ""}<p class="tarjeta-cuenta-precio">S/ ${Number(producto.precio || 0).toFixed(2)}</p></div>
            </article>`;
        }).join("");
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
