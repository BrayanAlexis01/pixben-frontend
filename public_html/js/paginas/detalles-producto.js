"use strict";

let tallaSeleccionada = "";
let productoRequiereTalla = true;
let productoActual = null;
let imagenesGaleria = [];
let indiceGaleria = 0;

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id");

function normalizarGaleria(imagenPrincipal, imagenesAdicionales = []) {
    const urls = [];

    [imagenPrincipal, ...imagenesAdicionales].forEach(imagen => {
        if (!imagen) {
            return;
        }
        const url = obtenerUrlImagen(imagen);
        if (url && !urls.includes(url)) {
            urls.push(url);
        }
    });

    return urls.length ? urls : [IMAGEN_FALLBACK];
}

function mostrarImagenGaleria(indice) {
    if (imagenesGaleria.length === 0) {
        return;
    }

    indiceGaleria = (indice + imagenesGaleria.length) % imagenesGaleria.length;
    const imagenPrincipal = document.getElementById("imagenProducto");
    imagenPrincipal.src = imagenesGaleria[indiceGaleria];
    imagenPrincipal.alt = `${productoActual?.nombre || "Producto"} - imagen ${indiceGaleria + 1}`;

    document.querySelectorAll(".miniatura-producto").forEach((miniatura, posicion) => {
        const activa = posicion === indiceGaleria;
        miniatura.classList.toggle("activa", activa);
        miniatura.setAttribute("aria-current", activa ? "true" : "false");
    });

    const contador = document.getElementById("contadorGaleria");
    contador.textContent = `${indiceGaleria + 1} / ${imagenesGaleria.length}`;
}

function renderizarGaleria(urls) {
    imagenesGaleria = urls;
    indiceGaleria = 0;

    const miniaturas = document.getElementById("galeriaMiniaturas");
    const anterior = document.getElementById("btnImagenAnterior");
    const siguiente = document.getElementById("btnImagenSiguiente");
    const contador = document.getElementById("contadorGaleria");
    const tieneVarias = urls.length > 1;

    anterior.hidden = !tieneVarias;
    siguiente.hidden = !tieneVarias;
    contador.hidden = !tieneVarias;
    miniaturas.hidden = !tieneVarias;
    miniaturas.innerHTML = "";

    if (tieneVarias) {
        urls.forEach((url, indice) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "miniatura-producto";
            boton.setAttribute("aria-label", `Ver imagen ${indice + 1}`);

            const imagen = document.createElement("img");
            imagen.src = url;
            imagen.alt = `Miniatura ${indice + 1} de ${productoActual?.nombre || "producto"}`;
            imagen.addEventListener("error", () => manejarErrorImagen(imagen));

            boton.appendChild(imagen);
            boton.addEventListener("click", () => mostrarImagenGaleria(indice));
            miniaturas.appendChild(boton);
        });
    }

    mostrarImagenGaleria(0);
}

async function cargarGaleriaProducto(productoId, imagenPrincipal) {
    let adicionales = [];

    try {
        const response = await fetch(`${API_URL}/imagenes/${productoId}`);
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.imagenes)) {
                adicionales = data.imagenes;
            }
        }
    } catch (error) {
        console.warn("No se pudo cargar la galería adicional:", error);
    }

    renderizarGaleria(normalizarGaleria(imagenPrincipal, adicionales));
}

function configurarControlesGaleria() {
    document.getElementById("btnImagenAnterior")
            .addEventListener("click", () => mostrarImagenGaleria(indiceGaleria - 1));
    document.getElementById("btnImagenSiguiente")
            .addEventListener("click", () => mostrarImagenGaleria(indiceGaleria + 1));

    document.addEventListener("keydown", evento => {
        if (imagenesGaleria.length <= 1) {
            return;
        }
        if (evento.key === "ArrowLeft") {
            mostrarImagenGaleria(indiceGaleria - 1);
        } else if (evento.key === "ArrowRight") {
            mostrarImagenGaleria(indiceGaleria + 1);
        }
    });
}

async function cargarProducto() {
    if (!id) {
        console.error("No se recibió el ID del producto");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/${id}`);
        if (!response.ok) {
            throw new Error("No se pudo cargar el producto");
        }

        const producto = await response.json();
        productoActual = producto;
        productoRequiereTalla = productoUsaTalla(producto.categoria, producto.nombre);

        const seccionTallas = document.getElementById("seccionTallas");
        const contenedorTallas = document.getElementById("tallasDisponiblesProducto");
        if (productoRequiereTalla) {
            const tallas = obtenerTallasProducto(producto);
            seccionTallas.hidden = false;
            tallaSeleccionada = "";
            contenedorTallas.innerHTML = tallas.map(talla =>
                `<button type="button" data-talla="${talla}">${talla}</button>`
            ).join("");
            contenedorTallas.querySelectorAll("button").forEach(boton => {
                boton.addEventListener("click", () => seleccionarTalla(boton.dataset.talla, boton));
            });
        } else {
            seccionTallas.hidden = true;
            contenedorTallas.innerHTML = "";
            tallaSeleccionada = "Única";
        }

        document.getElementById("nombreProducto").textContent = producto.nombre;
        document.getElementById("precioProducto").textContent = `S/ ${Number(producto.precio).toFixed(2)}`;
        document.getElementById("descripcionProducto").textContent = producto.descripcion;
        document.getElementById("categoriaProducto").textContent = producto.categoria;
        document.title = `${producto.nombre || "Producto personalizado"} | PixBen`;
        const descripcionSeo = document.querySelector('meta[name="description"]');
        if (descripcionSeo) descripcionSeo.content = String(producto.descripcion || `Compra ${producto.nombre} personalizado en PixBen`).slice(0, 155);
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = `https://pixben.netlify.app/htmls/detalles-producto.html?id=${encodeURIComponent(id)}`;
        const ogTitulo = document.querySelector('meta[property="og:title"]');
        if (ogTitulo) ogTitulo.content = `${producto.nombre || "Producto"} | PixBen`;
        const ogImagen = document.querySelector('meta[property="og:image"]');
        if (ogImagen) ogImagen.content = obtenerUrlImagen(producto.imagen);

        document.getElementById("stockProducto").textContent = `${producto.stock} unidades`;
        document.getElementById("cantidadProducto").max = Math.max(1, Number(producto.stock) || 1);

        await cargarGaleriaProducto(id, producto.imagen);
        registrarHistorial();
    } catch (error) {
        console.error(error);
    }
}

function registrarHistorial() {
    const usuario = obtenerUsuarioSesion();
    if (!tieneSesionValida(usuario)) return;

    fetchConSesion(`${API_URL}/historial`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({productoId: Number(id)})
    }).catch(error => console.warn("No se pudo registrar el historial:", error));
}

configurarControlesGaleria();
cargarProducto();
