const PRODUCTOS_POR_PAGINA = 16;

const estadoCatalogo = {
    productos: [],
    filtrados: [],
    pagina: 1,
    categoria: "todos",
    colores: new Set(),
    tallas: new Set(),
    precioMin: 0,
    precioMax: Number.POSITIVE_INFINITY,
    busqueda: "",
    orden: "popular",
    soloStock: false
};

const elementosCatalogo = {};

window.addEventListener("DOMContentLoaded", iniciarCatalogo);

async function iniciarCatalogo() {
    elementosCatalogo.grid = document.getElementById("productos-grid");
    elementosCatalogo.paginacion = document.querySelector(".paginacion");
    elementosCatalogo.categorias = document.getElementById("listaCategorias");
    elementosCatalogo.inputBuscar = document.getElementById("inputBuscar");
    elementosCatalogo.precioMin = document.getElementById("precioMin");
    elementosCatalogo.precioMax = document.getElementById("precioMax");
    elementosCatalogo.precioRange = document.getElementById("precioMaxRange");
    elementosCatalogo.valorPrecio = document.getElementById("valorPrecioMax");
    elementosCatalogo.orden = document.getElementById("ordenProductos");
    elementosCatalogo.soloStock = document.getElementById("soloStock");
    elementosCatalogo.contador = document.getElementById("contadorProductos");
    elementosCatalogo.estado = document.getElementById("estadoCatalogo");

    configurarEventosCatalogo();
    await cargarProductosCatalogo();
}

async function cargarProductosCatalogo() {
    mostrarEstado("Cargando productos...");

    try {
        const response = await fetch(`${API_URL}/productos`);

        if (!response.ok) {
            throw new Error(`No se pudieron cargar los productos (${response.status})`);
        }

        const data = await response.json();
        estadoCatalogo.productos = Array.isArray(data) ? data : [];
        configurarRangoPrecio();
        crearCategorias();
        aplicarFiltros();
    } catch (error) {
        console.error(error);
        mostrarEstado("No se pudo cargar el catálogo. Intenta nuevamente en unos segundos.", true);
    }
}

function configurarEventosCatalogo() {
    elementosCatalogo.inputBuscar?.addEventListener("input", evento => {
        estadoCatalogo.busqueda = normalizarTexto(evento.target.value);
        aplicarFiltros();
    });

    elementosCatalogo.precioRange?.addEventListener("input", evento => {
        elementosCatalogo.precioMax.value = evento.target.value;
        actualizarTextoPrecio();
    });

    elementosCatalogo.precioMax?.addEventListener("input", () => {
        const maximoRange = Number(elementosCatalogo.precioRange.max);
        const valor = Math.min(Number(elementosCatalogo.precioMax.value || maximoRange), maximoRange);
        elementosCatalogo.precioRange.value = valor;
        actualizarTextoPrecio();
    });

    document.getElementById("btnAplicarFiltros")?.addEventListener("click", aplicarFiltros);
    document.getElementById("btnLimpiarFiltros")?.addEventListener("click", limpiarFiltros);

    document.querySelectorAll(".color-filtro").forEach(boton => {
        boton.addEventListener("click", () => {
            alternarSeleccion(estadoCatalogo.colores, boton.dataset.color, boton);
        });
    });

    document.querySelectorAll(".talla-filtro").forEach(boton => {
        boton.addEventListener("click", () => {
            alternarSeleccion(estadoCatalogo.tallas, boton.dataset.talla, boton);
        });
    });

    elementosCatalogo.orden?.addEventListener("change", evento => {
        estadoCatalogo.orden = evento.target.value;
        aplicarFiltros();
    });

    elementosCatalogo.soloStock?.addEventListener("change", evento => {
        estadoCatalogo.soloStock = evento.target.checked;
        aplicarFiltros();
    });

    const buscador = document.getElementById("buscador");
    const iconoBuscar = document.getElementById("iconoBuscar");

    iconoBuscar?.addEventListener("click", evento => {
        evento.stopPropagation();
        buscador?.classList.toggle("activo");
        if (buscador?.classList.contains("activo")) {
            elementosCatalogo.inputBuscar?.focus();
        }
    });

    document.addEventListener("click", evento => {
        if (buscador && !buscador.contains(evento.target)) {
            buscador.classList.remove("activo");
        }
    });
}

function configurarRangoPrecio() {
    const precios = estadoCatalogo.productos
            .map(producto => Number(producto.precio))
            .filter(Number.isFinite);

    const maximo = precios.length ? Math.ceil(Math.max(...precios) / 10) * 10 : 500;
    const minimo = precios.length ? Math.floor(Math.min(...precios)) : 0;

    elementosCatalogo.precioMin.min = 0;
    elementosCatalogo.precioMin.max = maximo;
    elementosCatalogo.precioMin.value = 0;

    elementosCatalogo.precioMax.min = 0;
    elementosCatalogo.precioMax.max = maximo;
    elementosCatalogo.precioMax.value = maximo;

    elementosCatalogo.precioRange.min = 0;
    elementosCatalogo.precioRange.max = maximo;
    elementosCatalogo.precioRange.value = maximo;

    estadoCatalogo.precioMin = 0;
    estadoCatalogo.precioMax = maximo;
    actualizarTextoPrecio();
}

function actualizarTextoPrecio() {
    const valor = Number(elementosCatalogo.precioMax?.value || 0);
    if (elementosCatalogo.valorPrecio) {
        elementosCatalogo.valorPrecio.textContent = `Hasta S/ ${valor.toFixed(2)}`;
    }
}

function crearCategorias() {
    const categorias = [...new Set(
        estadoCatalogo.productos
                .map(producto => String(producto.categoria || "").trim())
                .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    elementosCatalogo.categorias.innerHTML = "";
    elementosCatalogo.categorias.appendChild(crearBotonCategoria("Todos los productos", "todos"));

    categorias.forEach(categoria => {
        elementosCatalogo.categorias.appendChild(crearBotonCategoria(categoria, categoria));
    });
}

function crearBotonCategoria(etiqueta, valor) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "categoria-filtro";
    boton.textContent = etiqueta;
    boton.dataset.categoria = valor;

    if (normalizarTexto(valor) === normalizarTexto(estadoCatalogo.categoria)) {
        boton.classList.add("seleccionado");
    }

    boton.addEventListener("click", () => {
        estadoCatalogo.categoria = valor;
        document.querySelectorAll(".categoria-filtro").forEach(item => {
            item.classList.toggle("seleccionado", item === boton);
        });
        aplicarFiltros();
    });

    return boton;
}

function alternarSeleccion(conjunto, valor, boton) {
    if (conjunto.has(valor)) {
        conjunto.delete(valor);
        boton.classList.remove("seleccionado");
        boton.setAttribute("aria-pressed", "false");
    } else {
        conjunto.add(valor);
        boton.classList.add("seleccionado");
        boton.setAttribute("aria-pressed", "true");
    }
}

function aplicarFiltros() {
    const precioMin = Number(elementosCatalogo.precioMin?.value || 0);
    const precioMax = Number(elementosCatalogo.precioMax?.value || Number.POSITIVE_INFINITY);

    estadoCatalogo.precioMin = Math.min(precioMin, precioMax);
    estadoCatalogo.precioMax = Math.max(precioMin, precioMax);
    estadoCatalogo.soloStock = Boolean(elementosCatalogo.soloStock?.checked);

    const categoriaNormalizada = normalizarTexto(estadoCatalogo.categoria);

    estadoCatalogo.filtrados = estadoCatalogo.productos.filter(producto => {
        const textoProducto = normalizarTexto(
                `${producto.nombre} ${producto.descripcion} ${producto.categoria}`
        );
        const precio = Number(producto.precio);
        const coloresProducto = detectarColoresProducto(producto);

        const coincideBusqueda = !estadoCatalogo.busqueda || textoProducto.includes(estadoCatalogo.busqueda);
        const coincideCategoria = categoriaNormalizada === "todos"
                || normalizarTexto(producto.categoria) === categoriaNormalizada;
        const coincidePrecio = Number.isFinite(precio)
                && precio >= estadoCatalogo.precioMin
                && precio <= estadoCatalogo.precioMax;
        const coincideColor = estadoCatalogo.colores.size === 0
                || [...estadoCatalogo.colores].some(color => coloresProducto.includes(color));
        const tallasProducto = obtenerTallasProducto(producto);
        const coincideTalla = estadoCatalogo.tallas.size === 0
                || [...estadoCatalogo.tallas].some(talla => tallasProducto.includes(talla));
        const coincideStock = !estadoCatalogo.soloStock || Number(producto.stock) > 0;

        return coincideBusqueda
                && coincideCategoria
                && coincidePrecio
                && coincideColor
                && coincideTalla
                && coincideStock;
    });

    ordenarProductos();
    estadoCatalogo.pagina = 1;
    renderizarCatalogo();
}

function ordenarProductos() {
    estadoCatalogo.filtrados.sort((a, b) => {
        switch (estadoCatalogo.orden) {
            case "precio-asc":
                return Number(a.precio) - Number(b.precio);
            case "precio-desc":
                return Number(b.precio) - Number(a.precio);
            case "nombre":
                return String(a.nombre).localeCompare(String(b.nombre), "es");
            default:
                if (Boolean(a.destacado) !== Boolean(b.destacado)) {
                    return a.destacado ? -1 : 1;
                }
                return Number(b.id || 0) - Number(a.id || 0);
        }
    });
}

function renderizarCatalogo() {
    const total = estadoCatalogo.filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA));
    estadoCatalogo.pagina = Math.min(estadoCatalogo.pagina, totalPaginas);

    if (elementosCatalogo.contador) {
        elementosCatalogo.contador.textContent = `${total} producto${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`;
    }

    if (total === 0) {
        elementosCatalogo.grid.innerHTML = `
            <div class="sin-resultados">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                <h3>No encontramos productos</h3>
                <p>Prueba otra categoría, precio, color o limpia los filtros.</p>
            </div>`;
        elementosCatalogo.paginacion.innerHTML = "";
        mostrarEstado("");
        return;
    }

    const inicio = (estadoCatalogo.pagina - 1) * PRODUCTOS_POR_PAGINA;
    const pagina = estadoCatalogo.filtrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    elementosCatalogo.grid.innerHTML = pagina.map(producto => {
        const precio = Number(producto.precio || 0).toFixed(2);
        const categoria = producto.categoria || "Sin categoría";
        const agotado = Number(producto.stock) <= 0;

        return `
            <article class="producto" tabindex="0" role="link"
                     data-producto-id="${producto.id}"
                     aria-label="Ver ${producto.nombre}">
                <div class="producto-imagen-contenedor">
                    ${producto.destacado ? '<span class="badge-destacado">Destacado</span>' : ""}
                    ${agotado ? '<span class="badge-agotado">Agotado</span>' : ""}
                    <img src="${obtenerUrlImagen(producto.imagen)}"
                         alt="${producto.nombre}"
                         loading="lazy"
                         onerror="manejarErrorImagen(this)">
                </div>
                <div class="producto-info">
                    <span class="producto-categoria">${categoria}</span>
                    <h3>${producto.nombre}</h3>
                    <p class="precio">S/ ${precio}</p>
                </div>
            </article>`;
    }).join("");

    elementosCatalogo.grid.querySelectorAll(".producto").forEach(tarjeta => {
        const abrir = () => {
            window.location.href = `detalles-producto.html?id=${tarjeta.dataset.productoId}`;
        };
        tarjeta.addEventListener("click", abrir);
        tarjeta.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrir();
            }
        });
    });

    crearPaginacion(totalPaginas);
    mostrarEstado("");
}

function crearPaginacion(totalPaginas) {
    elementosCatalogo.paginacion.innerHTML = "";
    if (totalPaginas <= 1) {
        return;
    }

    agregarBotonPagina("«", 1, estadoCatalogo.pagina === 1, "Primera página");
    agregarBotonPagina("‹", estadoCatalogo.pagina - 1, estadoCatalogo.pagina === 1, "Página anterior");

    const paginas = calcularPaginasVisibles(totalPaginas, estadoCatalogo.pagina);
    let anterior = 0;

    paginas.forEach(numero => {
        if (anterior && numero - anterior > 1) {
            const puntos = document.createElement("span");
            puntos.className = "puntos";
            puntos.textContent = "…";
            elementosCatalogo.paginacion.appendChild(puntos);
        }
        agregarBotonPagina(String(numero), numero, false, `Página ${numero}`, numero === estadoCatalogo.pagina);
        anterior = numero;
    });

    agregarBotonPagina("›", estadoCatalogo.pagina + 1, estadoCatalogo.pagina === totalPaginas, "Página siguiente");
    agregarBotonPagina("»", totalPaginas, estadoCatalogo.pagina === totalPaginas, "Última página");
}

function calcularPaginasVisibles(total, actual) {
    const numeros = new Set([1, total, actual - 1, actual, actual + 1]);
    return [...numeros].filter(numero => numero >= 1 && numero <= total).sort((a, b) => a - b);
}

function agregarBotonPagina(texto, pagina, deshabilitado, etiqueta, activo = false) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.disabled = deshabilitado;
    boton.classList.toggle("activo", activo);
    boton.setAttribute("aria-label", etiqueta);
    boton.addEventListener("click", () => {
        estadoCatalogo.pagina = pagina;
        renderizarCatalogo();
        document.querySelector(".productos-seccion")?.scrollIntoView({behavior: "smooth", block: "start"});
    });
    elementosCatalogo.paginacion.appendChild(boton);
}

function limpiarFiltros() {
    estadoCatalogo.categoria = "todos";
    estadoCatalogo.colores.clear();
    estadoCatalogo.tallas.clear();
    estadoCatalogo.busqueda = "";
    estadoCatalogo.orden = "popular";
    estadoCatalogo.soloStock = false;

    elementosCatalogo.inputBuscar.value = "";
    elementosCatalogo.precioMin.value = 0;
    elementosCatalogo.precioMax.value = elementosCatalogo.precioMax.max;
    elementosCatalogo.precioRange.value = elementosCatalogo.precioRange.max;
    elementosCatalogo.orden.value = "popular";
    elementosCatalogo.soloStock.checked = false;

    document.querySelectorAll(".categoria-filtro").forEach(boton => {
        boton.classList.toggle("seleccionado", boton.dataset.categoria === "todos");
    });
    document.querySelectorAll(".color-filtro, .talla-filtro").forEach(boton => {
        boton.classList.remove("seleccionado");
        boton.setAttribute("aria-pressed", "false");
    });

    actualizarTextoPrecio();
    aplicarFiltros();
}

function mostrarEstado(mensaje, esError = false) {
    if (!elementosCatalogo.estado) {
        return;
    }
    elementosCatalogo.estado.textContent = mensaje;
    elementosCatalogo.estado.classList.toggle("error", esError);
    elementosCatalogo.estado.hidden = !mensaje;
}
