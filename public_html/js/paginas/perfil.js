"use strict";

let usuarioPerfil = obtenerUsuarioSesion();
if (!tieneSesionValida(usuarioPerfil)) {
    alert("Debes iniciar sesión para ver tu perfil");
    window.location.replace("login.html");
} else {
    iniciarPerfil();
}

function iniciarPerfil() {
    renderizarUsuario(usuarioPerfil);
    cargarUsuarioActualizado();
    cargarResumenPerfil();
    document.getElementById("formPerfil").addEventListener("submit", guardarPerfil);
    document.getElementById("formPassword").addEventListener("submit", cambiarPassword);
    document.getElementById("inputFotoPerfil").addEventListener("change", subirFotoPerfil);
    document.getElementById("btnCerrarSesionPerfil").addEventListener("click", cerrarSesion);
}

async function cargarUsuarioActualizado() {
    try {
        const respuesta = await fetchConSesion(`${API_URL}/usuarios/me`);
        if (!respuesta.ok) return;
        usuarioPerfil = guardarUsuarioSesion(await respuesta.json());
        renderizarUsuario(usuarioPerfil);
    } catch (error) {
        console.warn("No se pudo actualizar el perfil desde el servidor", error);
    }
}

function renderizarUsuario(usuario) {
    const visible = obtenerNombreVisible(usuario);
    const foto = obtenerFotoPerfil(usuario);
    document.getElementById("saludoUsuario").textContent = `Hola, ${visible} 👋`;
    document.getElementById("nombreUsuario").textContent = visible;
    document.getElementById("aliasSidebar").textContent = usuario.alias ? `@${usuario.alias}` : "Cliente PixBen";
    document.getElementById("nombreCompleto").textContent = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || visible;
    document.getElementById("aliasUsuario").textContent = usuario.alias || "Aún no configurado";
    document.getElementById("correoUsuario").textContent = usuario.correo || "—";
    document.getElementById("rolUsuario").textContent = usuario.rol || "cliente";
    document.getElementById("fotoPerfil").src = foto;
    document.getElementById("fotoBienvenida").src = foto;
    document.getElementById("editarNombre").value = usuario.nombre || "";
    document.getElementById("editarApellido").value = usuario.apellido || "";
    document.getElementById("editarAlias").value = usuario.alias || "";
}

async function cargarResumenPerfil() {
    try {
        const [pedidos, personalizados, favoritos, historial] = await Promise.all([
            obtenerColeccionUsuario("pedidos", usuarioPerfil),
            obtenerColeccionUsuario("pedidos-personalizados", usuarioPerfil),
            obtenerColeccionUsuario("favoritos", usuarioPerfil),
            obtenerColeccionUsuario("historial", usuarioPerfil)
        ]);
        document.getElementById("totalPedidos").textContent = pedidos.length + personalizados.length;
        document.getElementById("totalFavoritos").textContent = favoritos.length;
        document.getElementById("totalHistorial").textContent = historial.length;
    } catch (error) {
        console.error("No se pudo cargar el resumen del perfil", error);
    }
}

async function guardarPerfil(evento) {
    evento.preventDefault();
    const estado = document.getElementById("estadoPerfil");
    marcarEstado(estado, "Guardando...", false);
    try {
        const respuesta = await fetchConSesion(`${API_URL}/usuarios/me/perfil`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                nombre: document.getElementById("editarNombre").value.trim(),
                apellido: document.getElementById("editarApellido").value.trim(),
                alias: document.getElementById("editarAlias").value.trim()
            })
        });
        if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo actualizar el perfil"));
        usuarioPerfil = guardarUsuarioSesion(await respuesta.json());
        renderizarUsuario(usuarioPerfil);
        marcarEstado(estado, "Perfil actualizado correctamente", true);
    } catch (error) {
        marcarEstado(estado, error.message, false, true);
    }
}

async function subirFotoPerfil(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type)) {
        alert("Solo se permiten imágenes PNG, JPG o WEBP");
        evento.target.value = "";
        return;
    }
    if (archivo.size > 8 * 1024 * 1024) {
        alert("La foto no debe superar 8 MB");
        evento.target.value = "";
        return;
    }
    const estado = document.getElementById("estadoPerfil");
    marcarEstado(estado, "Subiendo foto...", false);
    const datos = new FormData();
    datos.append("foto", archivo);
    try {
        const respuesta = await fetchConSesion(`${API_URL}/usuarios/me/foto`, {method: "POST", body: datos});
        if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo subir la foto"));
        usuarioPerfil = guardarUsuarioSesion(await respuesta.json());
        renderizarUsuario(usuarioPerfil);
        marcarEstado(estado, "Foto actualizada correctamente", true);
    } catch (error) {
        marcarEstado(estado, error.message, false, true);
    } finally {
        evento.target.value = "";
    }
}

async function cambiarPassword(evento) {
    evento.preventDefault();
    const estado = document.getElementById("estadoPassword");
    const passwordActual = document.getElementById("passwordActual").value;
    const passwordNueva = document.getElementById("passwordNueva").value;
    const confirmarPassword = document.getElementById("confirmarPassword").value;
    if (passwordNueva !== confirmarPassword) {
        marcarEstado(estado, "Las contraseñas nuevas no coinciden", false, true);
        return;
    }
    marcarEstado(estado, "Actualizando...", false);
    try {
        const respuesta = await fetchConSesion(`${API_URL}/usuarios/me/password`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({passwordActual, passwordNueva, confirmarPassword})
        });
        if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo cambiar la contraseña"));
        evento.target.reset();
        marcarEstado(estado, "Contraseña actualizada correctamente", true);
    } catch (error) {
        marcarEstado(estado, error.message, false, true);
    }
}

function marcarEstado(elemento, mensaje, exito = false, error = false) {
    elemento.textContent = mensaje;
    elemento.classList.toggle("exito", exito);
    elemento.classList.toggle("error", error);
}

async function cerrarSesion() {
    await cerrarSesionPixben("../index.html");
}
