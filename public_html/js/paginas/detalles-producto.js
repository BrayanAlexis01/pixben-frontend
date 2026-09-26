"use strict";

let tallaSeleccionada = "";
let colorSeleccionado = "";
let variantesColorProducto = [];
let productoRequiereTalla = true;
let productoActual = null;
let imagenesGaleria = [];
let indiceGaleria = 0;
let secuenciaCambioColor = 0;

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
    try {
        if (productoActual) {
            renderizarGaleria(await obtenerGaleriaProducto(productoActual));
            return;
        }
    } catch (error) {
        console.warn("No se pudo cargar la galería completa:", error);
    }
    renderizarGaleria(normalizarGaleria(imagenPrincipal));
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

async function seleccionarColor(nombre, botonSeleccionado) {
    colorSeleccionado = nombre;
    const secuencia = ++secuenciaCambioColor;
    document.querySelectorAll(".boton-color-producto").forEach(boton => {
        const activo = boton === botonSeleccionado;
        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });

    const stockColor = obtenerStockColorProducto(productoActual, nombre);
    const textoStock = document.getElementById("stockColorProducto");
    textoStock.textContent = `${stockColor} unidad${stockColor === 1 ? "" : "es"} disponible${stockColor === 1 ? "" : "s"} en ${nombre}`;
    textoStock.classList.toggle("agotado", stockColor <= 0);
    const cantidad = document.getElementById("cantidadProducto");
    cantidad.max = Math.max(1, stockColor);
    if (Number(cantidad.value) > stockColor && stockColor > 0) cantidad.value = stockColor;

    botonSeleccionado?.classList.add("cargando-galeria");
    try {
        const galeriaColor = await obtenerGaleriaVarianteProducto(productoActual, nombre);
        if (secuencia === secuenciaCambioColor && colorSeleccionado === nombre) {
            renderizarGaleria(galeriaColor);
            const ogImagen = document.querySelector('meta[property="og:image"]');
            if (ogImagen && galeriaColor[0]) ogImagen.content = galeriaColor[0];
        }
    } catch (error) {
        console.warn("No se pudo cambiar la galería de la variante:", error);
    } finally {
        botonSeleccionado?.classList.remove("cargando-galeria");
    }
    window.actualizarEstadoFavorito?.();
}

function renderizarColoresProducto(producto) {
    variantesColorProducto = obtenerVariantesColorProducto(producto);
    const seccion = document.getElementById("seccionColores");
    const contenedor = document.getElementById("coloresDisponiblesProducto");
    const textoStock = document.getElementById("stockColorProducto");

    if (!variantesColorProducto.length) {
        seccion.hidden = true;
        contenedor.innerHTML = "";
        textoStock.textContent = "";
        colorSeleccionado = "SIN_COLOR";
        return;
    }

    seccion.hidden = false;
    colorSeleccionado = "";
    textoStock.textContent = "Selecciona un color para ver su stock.";
    contenedor.innerHTML = variantesColorProducto.map((color, indice) => `
        <button type="button" class="boton-color-producto" data-color="${escaparHtmlSeguro(color.nombre)}"
                data-clave-color="${escaparHtmlSeguro(color.clave || "")}" aria-pressed="false" ${color.stock <= 0 ? "disabled" : ""}>
            <span class="muestra-color" style="--color-producto:${color.codigoHex}"></span>
            <span>${escaparHtmlSeguro(color.nombre)}</span>
            <small>${color.stock > 0 ? `${color.stock} disp.` : "Agotado"}</small>
        </button>`).join("");

    contenedor.querySelectorAll(".boton-color-producto").forEach(boton => {
        boton.addEventListener("click", () => seleccionarColor(boton.dataset.color, boton));
    });

    const colorUrl = new URLSearchParams(window.location.search).get("color");
    const preseleccion = Array.from(contenedor.querySelectorAll(".boton-color-producto"))
            .find(boton => normalizarTexto(boton.dataset.color) === normalizarTexto(colorUrl) && !boton.disabled);
    const disponibles = Array.from(contenedor.querySelectorAll(".boton-color-producto:not(:disabled)"));
    if (preseleccion) preseleccion.click();
    else if (disponibles.length) disponibles[0].click();
}

async function cargarProducto() {
    if (!id) {
        console.error("No se recibió el ID del producto");
        return;
    }

    try {
        const response = await fetchConReintentos(`${API_URL}/productos/${id}`, {cache: "no-store"}, 3, 1800);
        if (!response.ok) throw new Error("No se pudo cargar el producto");
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
        const ogUrl = document.querySelector('meta[property="og:url"]');
        const urlProducto = `https://pixben.netlify.app/htmls/detalles-producto.html?id=${encodeURIComponent(id)}`;
        if (ogUrl) ogUrl.content = urlProducto;

        let datosEstructurados = document.getElementById("seoProductoJsonLd");
        if (!datosEstructurados) {
            datosEstructurados = document.createElement("script");
            datosEstructurados.type = "application/ld+json";
            datosEstructurados.id = "seoProductoJsonLd";
            document.head.appendChild(datosEstructurados);
        }
        datosEstructurados.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: producto.nombre || "Producto PixBen",
            description: producto.descripcion || "Producto personalizado PixBen",
            image: [obtenerUrlImagen(producto.imagen)],
            ...(producto.sku ? {sku: producto.sku} : {}),
            brand: {"@type": "Brand", name: "PixBen"},
            offers: {
                "@type": "Offer",
                url: urlProducto,
                priceCurrency: "PEN",
                price: Number(producto.precio || 0).toFixed(2),
                availability: Number(producto.stock || 0) > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock"
            }
        });

        document.getElementById("stockProducto").textContent = `${producto.stock} unidades`;
        document.getElementById("cantidadProducto").max = Math.max(1, Number(producto.stock) || 1);

        await cargarGaleriaProducto(id, producto.imagen);
        renderizarColoresProducto(producto);
        window.actualizarEstadoFavorito?.();
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
