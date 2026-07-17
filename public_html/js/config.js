const API_URL = "https://pixben-backend.onrender.com";
const IMAGEN_FALLBACK = "/imagensponsor/polo-ocean.webp";

function obtenerUrlImagen(imagen) {
    if (!imagen) {
        return IMAGEN_FALLBACK;
    }

    if (/^https?:\/\//i.test(imagen)) {
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
    const encontradas = texto.match(/(XXL|XL|XS|S|M|L)/g) || [];
    const unicas = [...new Set(encontradas)];

    return unicas.length ? orden.filter(talla => unicas.includes(talla)) : orden;
}

function detectarColoresProducto(producto) {
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
            .filter(([, palabras]) => palabras.some(palabra => texto.includes(normalizarTexto(palabra))))
            .map(([color]) => color);
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

function guardarUsuarioSesion(datos) {
    const usuarioNuevo = normalizarUsuarioSesion(datos);
    if (!usuarioNuevo) return null;

    // Algunas respuestas de perfil no vuelven a incluir el token. Se conserva el actual.
    const actual = (() => {
        try { return normalizarUsuarioSesion(JSON.parse(localStorage.getItem("usuario"))); }
        catch { return null; }
    })();
    if (!usuarioNuevo.token && actual?.token) usuarioNuevo.token = actual.token;

    localStorage.setItem("usuario", JSON.stringify(usuarioNuevo));
    return usuarioNuevo;
}

function obtenerUsuarioSesion() {
    try {
        const usuario = normalizarUsuarioSesion(JSON.parse(localStorage.getItem("usuario")));
        if (usuario) localStorage.setItem("usuario", JSON.stringify(usuario));
        return usuario;
    } catch {
        localStorage.removeItem("usuario");
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
    const cantidad = Math.max(1, Number(datos?.cantidad || 1));
    const existente = carrito.find(item => Number(item.productoId) === productoId
            && String(item.talla || "UNIDAD").toUpperCase() === talla
            && !item.personalizado);

    if (existente) {
        existente.cantidad = Math.min(50, Number(existente.cantidad || 1) + cantidad);
    } else {
        carrito.push({
            id: crearIdCarritoInvitado(),
            productoId,
            cantidad: Math.min(50, cantidad),
            talla,
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
    const numero = Math.max(1, Math.min(50, Number(cantidad || 1)));
    const carrito = obtenerCarritoInvitado();
    const item = carrito.find(actual => actual.id === id);
    if (item) item.cantidad = numero;
    return guardarCarritoInvitado(carrito);
}

function vaciarCarritoInvitado() {
    localStorage.removeItem(CLAVE_CARRITO_INVITADO);
}

// Una sesión antigua sin token ya no da acceso a datos privados.
(() => {
    const usuario = obtenerUsuarioSesion();
    if (usuario) guardarUsuarioSesion(usuario);
})();
