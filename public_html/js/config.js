const API_URL = "https://pixben-backend.onrender.com";
const IMAGEN_FALLBACK = "/imagensponsor/polo-ocean.webp";
const PIXBEN_WHATSAPP_MAYOR = "51947565664";

function abrirWhatsAppPixBen(mensaje) {
    const url = `https://wa.me/${PIXBEN_WHATSAPP_MAYOR}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

function preguntarPorMayorPixBen(producto, opciones = {}) {
    const nombre = producto?.nombre || "un producto de PixBen";
    const sku = producto?.sku ? ` (SKU: ${producto.sku})` : "";
    const variante = [
        opciones.color && !["SIN_COLOR", ""].includes(String(opciones.color)) ? `Color: ${opciones.color}` : "",
        opciones.talla && !["UNIDAD", "ÚNICA", "SIN_TALLA", ""].includes(String(opciones.talla).toUpperCase()) ? `Talla: ${opciones.talla}` : "",
        Number(opciones.cantidad || 0) > 0 ? `Cantidad referencial: ${opciones.cantidad}` : ""
    ].filter(Boolean).join(" · ");
    const enlace = producto?.id ? `https://pixben.netlify.app/htmls/detalles-producto.html?id=${encodeURIComponent(producto.id)}` : location.href;
    abrirWhatsAppPixBen(
        `Hola, vengo de la página web de PixBen. Quisiera consultar precio por mayor de: ${nombre}${sku}.`
        + (variante ? `\n${variante}.` : "")
        + `\nEnlace: ${enlace}\n¿Me puedes indicar precio por mayor, disponibilidad y cantidad mínima?`
    );
}

function consultarServicioPixBen(tipo) {
    if (tipo === "dtf") {
        abrirWhatsAppPixBen(
            "Hola, vengo de la página web de PixBen. Quisiera cotizar Film DTF Premium por metro. "
            + "Tengo mi propio diseño y quisiera saber cuántos metros necesito y el precio. "
            + "Entiendo que ustedes acomodan el diseño dentro del metro para aprovechar mejor el área de impresión."
        );
        return;
    }
    abrirWhatsAppPixBen(
        "Hola, vengo de la página web de PixBen. Quisiera consultar por Bolsos de Tocuyo, "
        + "opciones de personalización y precio por mayor. ¿Me pueden indicar modelos, medidas y cantidad mínima?"
    );
}

function obtenerUrlImagen(imagen) {
    if (!imagen) {
        return IMAGEN_FALLBACK;
    }

    if (/^https?:\/\//i.test(imagen)) {
        return imagen;
    }

    // Imágenes precargadas que viajan con Netlify y no dependen de Render.
    if (String(imagen).startsWith("/imagen/") || String(imagen).startsWith("../imagen/")) {
        return imagen;
    }

    return `${API_URL}/imagen/${encodeURIComponent(imagen)}`;
}

function manejarErrorImagen(elemento) {
    if (!elemento || elemento.dataset.fallbackAplicado === "true") {
        return;
    }

    elemento.dataset.fallbackAplicado = "true";
    elemento.src = IMAGEN_FALLBACK;
}

function normalizarTexto(valor) {
    return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reintenta únicamente fallos típicos de arranque/infraestructura. No repite
 * errores funcionales (400/401/403/404) para no duplicar operaciones.
 */
async function fetchConReintentos(url, opciones = {}, intentos = 3, pausaMs = 1800) {
    let ultimoError = null;
    const reintentables = new Set([502, 503, 504]);

    for (let intento = 1; intento <= Math.max(1, intentos); intento++) {
        try {
            const respuesta = await fetch(url, opciones);
            if (!reintentables.has(respuesta.status) || intento === intentos) {
                return respuesta;
            }
        } catch (error) {
            ultimoError = error;
            if (intento === intentos) throw error;
        }

        await esperar(pausaMs * intento);
    }

    if (ultimoError) throw ultimoError;
    throw new Error("No se pudo conectar con PixBen");
}

function productoUsaTalla(categoria, nombre = "") {
    const texto = normalizarTexto(`${categoria} ${nombre}`);
    const prendasConTalla = [
        "polo", "polos", "camiseta", "camisetas", "camisa", "camisas",
        "polera", "poleras", "hoodie", "hoodies", "sudadera", "sudaderas",
        "casaca", "casacas", "chaqueta", "chaquetas", "pantalon", "pantalones",
        "short", "shorts", "vestido", "vestidos"
    ];

    return prendasConTalla.some(palabra => texto.includes(palabra));
}

function obtenerTallasProducto(producto) {
    if (!productoUsaTalla(producto?.categoria, producto?.nombre)) {
        return [];
    }

    const orden = ["XS", "S", "M", "L", "XL", "XXL"];
    const valorConfigurado = producto?.tallasDisponibles;
    let configuradas = [];

    if (Array.isArray(valorConfigurado)) {
        configuradas = valorConfigurado;
    } else if (typeof valorConfigurado === "string" && valorConfigurado.trim()) {
        configuradas = valorConfigurado.split(",");
    }

    configuradas = [...new Set(configuradas
            .map(talla => String(talla).trim().toUpperCase())
            .filter(talla => orden.includes(talla)))];

    if (configuradas.length) {
        return orden.filter(talla => configuradas.includes(talla));
    }

    // Compatibilidad con productos antiguos, creados antes de añadir el campo.
    const texto = String(`${producto?.nombre ?? ""} ${producto?.descripcion ?? ""}`).toUpperCase();
    const encontradas = texto.match(/\b(XXL|XL|XS|S|M|L)\b/g) || [];
    const unicas = [...new Set(encontradas)];

    return unicas.length ? orden.filter(talla => unicas.includes(talla)) : orden;
}

function detectarColoresProducto(producto) {
    // Primero usa las variantes reales configuradas en Admin. El texto queda como
    // compatibilidad para productos antiguos creados antes del sistema de colores.
    const variantesConfiguradas = obtenerVariantesColorProducto(producto)
            .map(color => normalizarTexto(color.nombre));
    const texto = normalizarTexto(
            `${producto?.nombre ?? ""} ${producto?.descripcion ?? ""} ${producto?.categoria ?? ""}`
    );

    const equivalencias = {
        negro: ["negro", "negra", "black"],
        blanco: ["blanco", "blanca", "white"],
        gris: ["gris", "plomo", "gray", "grey"],
        morado: ["morado", "morada", "purpura", "violeta", "purple"],
        rosado: ["rosado", "rosada", "rosa", "pink"],
        azul: ["azul", "celeste", "blue"],
        rojo: ["rojo", "roja", "red"],
        verde: ["verde", "green"],
        beige: ["beige", "crema", "arena"],
        amarillo: ["amarillo", "amarilla", "yellow"],
        marron: ["marron", "marrón", "cafe", "café", "brown"]
    };

    return Object.entries(equivalencias)
            .filter(([, palabras]) => palabras.some(palabra => {
                const alias = normalizarTexto(palabra);
                return texto.includes(alias) || variantesConfiguradas.some(variante => variante.includes(alias));
            }))
            .map(([color]) => color);
}


function obtenerVariantesColorProducto(producto) {
    if (!Array.isArray(producto?.colores)) return [];
    return producto.colores
            .filter(color => color && String(color.nombre || "").trim())
            .slice(0, 7)
            .map((color, indice) => ({
                clave: String(color.clave || "").trim().toLowerCase(),
                nombre: String(color.nombre).trim(),
                codigoHex: /^#[0-9a-f]{6}$/i.test(String(color.codigoHex || ""))
                        ? String(color.codigoHex).toUpperCase() : "#808080",
                stock: Math.max(0, Number(color.stock || 0)),
                imagenIndice: Number.isInteger(Number(color.imagenIndice))
                        ? Number(color.imagenIndice) : indice
            }));
}

function obtenerStockColorProducto(producto, nombreColor) {
    const variantes = obtenerVariantesColorProducto(producto);
    if (!variantes.length) return Math.max(0, Number(producto?.stock || 0));
    const encontrada = variantes.find(color => normalizarTexto(color.nombre) === normalizarTexto(nombreColor));
    return encontrada ? encontrada.stock : 0;
}

const CACHE_GALERIAS_PRODUCTO = new Map();

async function obtenerDatosGaleriaProducto(producto) {
    const idProducto = Number(producto?.id);
    if (!Number.isFinite(idProducto)) return {imagenes: [], imagenesPorVariante: {}};
    if (!CACHE_GALERIAS_PRODUCTO.has(idProducto)) {
        CACHE_GALERIAS_PRODUCTO.set(idProducto, (async () => {
            try {
                const respuesta = await fetch(`${API_URL}/imagenes/${idProducto}`, {cache: "no-store"});
                if (!respuesta.ok) return {imagenes: [], imagenesPorVariante: {}};
                const datos = await respuesta.json();
                return {
                    imagenes: Array.isArray(datos?.imagenes) ? datos.imagenes : [],
                    imagenesPorVariante: datos?.imagenesPorVariante && typeof datos.imagenesPorVariante === "object"
                            ? datos.imagenesPorVariante : {}
                };
            } catch (error) {
                console.warn("No se pudo cargar la galería del producto:", error);
                return {imagenes: [], imagenesPorVariante: {}};
            }
        })());
    }
    return CACHE_GALERIAS_PRODUCTO.get(idProducto);
}

function normalizarUrlsGaleria(lista = []) {
    const urls = [];
    (Array.isArray(lista) ? lista : []).forEach(imagen => {
        const url = obtenerUrlImagen(imagen);
        if (url && !urls.includes(url)) urls.push(url);
    });
    return urls;
}

async function obtenerGaleriaProducto(producto) {
    const principal = obtenerUrlImagen(producto?.imagen);
    const datos = await obtenerDatosGaleriaProducto(producto);
    const urls = normalizarUrlsGaleria([principal, ...(datos.imagenes || [])]);
    return urls.length ? urls : [IMAGEN_FALLBACK];
}

async function obtenerGaleriaVarianteProducto(producto, nombreColor) {
    const variantes = obtenerVariantesColorProducto(producto);
    const variante = variantes.find(color => normalizarTexto(color.nombre) === normalizarTexto(nombreColor));
    if (!variante) return obtenerGaleriaProducto(producto);

    const datos = await obtenerDatosGaleriaProducto(producto);
    const porVariante = datos.imagenesPorVariante || {};
    const galeriaPropia = variante.clave ? porVariante[variante.clave] : null;
    const urlsPropias = normalizarUrlsGaleria(galeriaPropia);
    if (urlsPropias.length) return urlsPropias;

    // Compatibilidad: antes cada color apuntaba a una sola imagen de la galería general.
    const general = await obtenerGaleriaProducto(producto);
    const indice = Number(variante.imagenIndice);
    const heredada = Number.isInteger(indice) && general[indice] ? general[indice] : general[0];
    return heredada ? [heredada] : [IMAGEN_FALLBACK];
}

async function obtenerImagenVarianteProducto(producto, nombreColor) {
    const galeria = await obtenerGaleriaVarianteProducto(producto, nombreColor);
    return galeria[0] || obtenerUrlImagen(producto?.imagen) || IMAGEN_FALLBACK;
}

const AVATAR_FALLBACK = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" rx="150" fill="#e5e7eb"/>
  <circle cx="150" cy="112" r="55" fill="#9ca3af"/>
  <path d="M54 270c7-62 45-96 96-96s89 34 96 96" fill="#9ca3af"/>
</svg>`);

function normalizarUsuarioSesion(datos) {
    if (!datos || typeof datos !== "object") return null;
    const correo = String(datos.correo || datos.email || "").trim().toLowerCase();
    const nombreBase = String(datos.nombre || datos.nombres || datos.name || "").trim();
    const alias = String(datos.alias || datos.apodo || "").trim();
    const nombre = nombreBase || alias || (correo.includes("@") ? correo.split("@")[0] : "Usuario");
    const idNumero = datos.id == null ? null : Number(datos.id);
    return {
        id: Number.isFinite(idNumero) ? idNumero : null,
        nombre,
        apellido: String(datos.apellido || datos.apellidos || "").trim(),
        correo,
        rol: String(datos.rol || "cliente").trim().toLowerCase(),
        alias,
        fotoPerfilUrl: String(datos.fotoPerfilUrl || datos.foto || datos.avatar || "").trim(),
        token: String(datos.token || "").trim()
    };
}

const PIXBEN_TOKEN_CLIENTE_KEY = "pixben_session_token_v2";
const PIXBEN_TOKEN_ADMIN_KEY = "pixben_admin_session_token_v2";

function limpiarTokensSesionPixBen() {
    localStorage.removeItem(PIXBEN_TOKEN_CLIENTE_KEY);
    sessionStorage.removeItem(PIXBEN_TOKEN_ADMIN_KEY);
}

function guardarUsuarioSesion(datos) {
    const usuarioNuevo = normalizarUsuarioSesion(datos);
    if (!usuarioNuevo) return null;

    const actual = obtenerUsuarioSesion();
    if (!usuarioNuevo.token && actual?.token) usuarioNuevo.token = actual.token;

    const token = usuarioNuevo.token;
    if (usuarioNuevo.rol === "admin") {
        localStorage.removeItem(PIXBEN_TOKEN_CLIENTE_KEY);
        if (token) sessionStorage.setItem(PIXBEN_TOKEN_ADMIN_KEY, token);
    } else {
        sessionStorage.removeItem(PIXBEN_TOKEN_ADMIN_KEY);
        if (token) localStorage.setItem(PIXBEN_TOKEN_CLIENTE_KEY, token);
    }

    const persistente = {...usuarioNuevo, token:""};
    localStorage.setItem("usuario", JSON.stringify(persistente));
    return {...persistente, token};
}

function obtenerUsuarioSesion() {
    try {
        const bruto = JSON.parse(localStorage.getItem("usuario"));
        const usuario = normalizarUsuarioSesion(bruto);
        if (!usuario) return null;

        // Migra silenciosamente sesiones antiguas que guardaban el token dentro del JSON.
        const tokenLegado = String(bruto?.token || "").trim();
        let token = usuario.rol === "admin"
                ? sessionStorage.getItem(PIXBEN_TOKEN_ADMIN_KEY)
                : localStorage.getItem(PIXBEN_TOKEN_CLIENTE_KEY);
        if (!token && tokenLegado) {
            token = tokenLegado;
            if (usuario.rol === "admin") sessionStorage.setItem(PIXBEN_TOKEN_ADMIN_KEY, tokenLegado);
            else localStorage.setItem(PIXBEN_TOKEN_CLIENTE_KEY, tokenLegado);
        }
        const persistente = {...usuario, token:""};
        localStorage.setItem("usuario", JSON.stringify(persistente));
        return {...persistente, token:String(token || "")};
    } catch {
        localStorage.removeItem("usuario");
        limpiarTokensSesionPixBen();
        return null;
    }
}

function obtenerNombreVisible(usuario = obtenerUsuarioSesion()) {
    if (!usuario) return "Usuario";
    return usuario.alias || usuario.nombre || (usuario.correo ? usuario.correo.split("@")[0] : "Usuario");
}

function obtenerFotoPerfil(usuario = obtenerUsuarioSesion()) {
    return usuario?.fotoPerfilUrl || AVATAR_FALLBACK;
}

function crearReferenciaUsuario(usuario = obtenerUsuarioSesion()) {
    if (!usuario) return {};
    return {
        usuarioId: usuario.id,
        usuario: obtenerNombreVisible(usuario),
        correo: usuario.correo || ""
    };
}

function tieneSesionValida(usuario = obtenerUsuarioSesion()) {
    return Boolean(usuario?.id && usuario?.token);
}

function cabecerasSesion(headersIniciales = {}) {
    const usuario = obtenerUsuarioSesion();
    if (!usuario?.token) throw new Error("Debes iniciar sesión nuevamente");
    const headers = new Headers(headersIniciales);
    headers.set("X-Session-Token", usuario.token);
    return headers;
}

async function fetchConSesion(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: cabecerasSesion(opciones.headers || {})
    });
    if (respuesta.status === 401) {
        localStorage.removeItem("usuario");
        limpiarTokensSesionPixBen();
        throw new Error("Tu sesión venció. Inicia sesión nuevamente");
    }
    return respuesta;
}

async function fetchConSesionOpcional(url, opciones = {}) {
    const usuario = obtenerUsuarioSesion();
    const headers = new Headers(opciones.headers || {});
    if (usuario?.token) headers.set("X-Session-Token", usuario.token);
    return fetch(url, {...opciones, headers});
}

function endpointPorUsuario(recurso) {
    return `${API_URL}/${recurso}/mios`;
}

async function obtenerColeccionUsuario(recurso, usuario = obtenerUsuarioSesion()) {
    if (!tieneSesionValida(usuario)) throw new Error("Debes iniciar sesión nuevamente");
    const respuesta = await fetchConSesion(`${API_URL}/${recurso}/mios`);
    if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo cargar la información"));
    const datos = await respuesta.json();
    return Array.isArray(datos) ? datos : [];
}

async function cerrarSesionPixben(rutaDestino = null) {
    const usuario = obtenerUsuarioSesion();
    try {
        if (usuario?.token) {
            await window.PixBenPWA?.desuscribirNotificacionesCuenta?.();
            await fetchConSesion(`${API_URL}/usuarios/logout`, {method: "POST"});
        }
    } catch (error) {
        console.warn("No se pudo cerrar la sesión en el servidor", error);
    } finally {
        localStorage.removeItem("usuario");
        limpiarTokensSesionPixBen();
        if (rutaDestino) window.location.href = rutaDestino;
    }
}

async function obtenerMensajeRespuesta(respuesta, respaldo = "Ocurrió un error") {
    try {
        const json = await respuesta.json();
        return json.message || json.mensaje || json.error || respaldo;
    } catch {
        try {
            const texto = await respuesta.text();
            return texto || respaldo;
        } catch {
            return respaldo;
        }
    }
}

function escaparHtmlSeguro(valor) {
    return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
}

// Carrito local para visitantes que prefieren comprar sin crear una cuenta.
const CLAVE_CARRITO_INVITADO = "pixbenCarritoInvitado";

function obtenerCarritoInvitado() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO_INVITADO) || "[]");
        return Array.isArray(datos) ? datos.filter(item => item && item.productoId != null) : [];
    } catch {
        localStorage.removeItem(CLAVE_CARRITO_INVITADO);
        return [];
    }
}

function guardarCarritoInvitado(items) {
    const seguros = Array.isArray(items) ? items.slice(0, 100) : [];
    localStorage.setItem(CLAVE_CARRITO_INVITADO, JSON.stringify(seguros));
    return seguros;
}

function crearIdCarritoInvitado() {
    if (window.crypto?.randomUUID) return `guest-${window.crypto.randomUUID()}`;
    return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function agregarAlCarritoInvitado(datos) {
    const carrito = obtenerCarritoInvitado();
    const productoId = Number(datos?.productoId);
    const talla = String(datos?.talla || "UNIDAD").trim().toUpperCase();
    const color = String(datos?.color || "SIN_COLOR").trim();
    const cantidad = Math.max(1, Number(datos?.cantidad || 1));
    const existente = carrito.find(item => Number(item.productoId) === productoId
            && String(item.talla || "UNIDAD").toUpperCase() === talla
            && normalizarTexto(item.color || "SIN_COLOR") === normalizarTexto(color)
            && !item.personalizado);

    if (existente) {
        existente.cantidad = Math.min(20, Number(existente.cantidad || 1) + cantidad);
    } else {
        carrito.push({
            id: crearIdCarritoInvitado(),
            productoId,
            cantidad: Math.min(20, cantidad),
            talla,
            color,
            personalizado: false
        });
    }
    guardarCarritoInvitado(carrito);
    return carrito;
}

function eliminarDelCarritoInvitado(id) {
    return guardarCarritoInvitado(obtenerCarritoInvitado().filter(item => item.id !== id));
}

function actualizarCarritoInvitado(id, cantidad) {
    const numero = Math.max(1, Math.min(20, Number(cantidad || 1)));
    const carrito = obtenerCarritoInvitado();
    const item = carrito.find(actual => actual.id === id);
    if (item) item.cantidad = numero;
    return guardarCarritoInvitado(carrito);
}

function vaciarCarritoInvitado() {
    localStorage.removeItem(CLAVE_CARRITO_INVITADO);
}

// Referencias locales de pedidos hechos sin cuenta. El servidor siempre vuelve a validar código + correo.
const CLAVE_PEDIDOS_INVITADO = "pixbenPedidosInvitado";

function obtenerPedidosInvitadoGuardados() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS_INVITADO) || "[]");
        return Array.isArray(datos) ? datos.filter(item => item?.codigo && item?.correo).slice(0, 20) : [];
    } catch {
        localStorage.removeItem(CLAVE_PEDIDOS_INVITADO);
        return [];
    }
}

function guardarReferenciaPedidoInvitado(pedido, correo) {
    const codigo = String(pedido?.codigoSeguimiento || pedido?.id || "").trim().toUpperCase();
    const email = String(correo || pedido?.correo || "").trim().toLowerCase();
    if (!codigo || !email) return obtenerPedidosInvitadoGuardados();
    const guardados = obtenerPedidosInvitadoGuardados().filter(item => item.codigo !== codigo);
    guardados.unshift({codigo, correo: email, fecha: pedido?.fecha || new Date().toISOString()});
    localStorage.setItem(CLAVE_PEDIDOS_INVITADO, JSON.stringify(guardados.slice(0, 20)));
    return guardados;
}

function eliminarReferenciaPedidoInvitado(codigo) {
    const normalizado = String(codigo || "").trim().toUpperCase();
    const guardados = obtenerPedidosInvitadoGuardados().filter(item => item.codigo !== normalizado);
    localStorage.setItem(CLAVE_PEDIDOS_INVITADO, JSON.stringify(guardados));
    return guardados;
}

// Una sesión antigua sin token ya no da acceso a datos privados.
(() => {
    const usuario = obtenerUsuarioSesion();
    if (usuario) guardarUsuarioSesion(usuario);
})();


/* Centro global de privacidad y enlaces legales */
const PIXBEN_PRIVACY_CONSENT_KEY = "pixben_privacy_consent_v2";

function obtenerConsentimientoPrivacidadPixBen() {
    try {
        const value = JSON.parse(localStorage.getItem(PIXBEN_PRIVACY_CONSENT_KEY) || "null");
        return value && value.version === 2 ? value : null;
    } catch {
        return null;
    }
}

function analiticaPermitidaPixBen() {
    return obtenerConsentimientoPrivacidadPixBen()?.analytics === true;
}

function guardarConsentimientoPrivacidadPixBen(analytics) {
    const value = {
        essential:true,
        analytics:Boolean(analytics),
        marketing:false,
        version:2,
        updatedAt:new Date().toISOString()
    };
    localStorage.setItem(PIXBEN_PRIVACY_CONSENT_KEY, JSON.stringify(value));
    if (!value.analytics) {
        localStorage.removeItem("pixbenVisitanteAnonimo");
        Object.keys(sessionStorage).filter(key => key.startsWith("pixben-visita:"))
                .forEach(key => sessionStorage.removeItem(key));
    }
    window.dispatchEvent(new CustomEvent("pixben:privacy-consent", {detail:value}));
    document.getElementById("pixbenPrivacyCenter")?.remove();
    return value;
}

function mostrarPreferenciasPrivacidadPixBen(force = false) {
    if (!force && obtenerConsentimientoPrivacidadPixBen()) return;
    document.getElementById("pixbenPrivacyCenter")?.remove();

    const panel = document.createElement("aside");
    panel.id = "pixbenPrivacyCenter";
    panel.className = "pixben-privacy-center";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Preferencias de privacidad");
    panel.innerHTML = `
        <div class="pixben-privacy-copy">
            <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
            <div>
                <strong>Tu privacidad en PixBen</strong>
                <p>Usamos almacenamiento necesario para sesión, carrito, accesibilidad y seguridad. La analítica interna es opcional y no se activa sin tu consentimiento. Actualmente no usamos cookies publicitarias.</p>
                <a href="${location.pathname.includes("/htmls/") ? "politica de cookies.html" : "htmls/politica de cookies.html"}">Ver política de cookies</a>
            </div>
        </div>
        <div class="pixben-privacy-actions">
            <button type="button" class="privacy-secondary" data-pixben-essential>Solo necesarias</button>
            <button type="button" class="privacy-primary" data-pixben-analytics>Aceptar analítica</button>
        </div>`;
    document.body.appendChild(panel);
    panel.querySelector("[data-pixben-essential]")?.addEventListener("click", () => guardarConsentimientoPrivacidadPixBen(false));
    panel.querySelector("[data-pixben-analytics]")?.addEventListener("click", () => guardarConsentimientoPrivacidadPixBen(true));
}

function instalarEnlacesLegalesPixBen() {
    const footer = document.querySelector("footer");
    if (!footer || footer.querySelector("[data-pixben-legal-links]")) return;
    const enHtmls = location.pathname.includes("/htmls/");
    const prefijo = enHtmls ? "" : "htmls/";
    const nav = document.createElement("nav");
    nav.className = "pixben-legal-links";
    nav.dataset.pixbenLegalLinks = "true";
    nav.setAttribute("aria-label", "Información legal");
    nav.innerHTML = `
        <a href="${prefijo}politica de privacidad.html">Privacidad</a>
        <a href="${prefijo}politica de cookies.html">Cookies</a>
        <a href="${prefijo}terminos y condiciones.html">Términos</a>
        <a href="${prefijo}libro de reclamaciones.html">Libro de Reclamaciones</a>
        <button type="button" data-pixben-cookie-settings>Configurar privacidad</button>`;
    footer.appendChild(nav);
}

document.addEventListener("click", event => {
    if (event.target.closest("[data-pixben-cookie-settings]")) {
        event.preventDefault();
        mostrarPreferenciasPrivacidadPixBen(true);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    instalarEnlacesLegalesPixBen();
    setTimeout(() => mostrarPreferenciasPrivacidadPixBen(false), 250);
});
