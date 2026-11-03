"use strict";

(() => {
    const formulario = document.getElementById("formContacto");
    const estado = document.getElementById("estadoContacto");
    if (!formulario || !estado) return;

    const boton = formulario.querySelector('button[type="submit"]');
    const etiqueta = boton?.querySelector(".pb-contact-send__label");
    if (!boton) return;

    // Los campos inician vacíos. El navegador puede sugerir datos con autocomplete.
    // El envío sigue utilizando POST /contactos y la bandeja de administración actual.
    const actualizarEnvio = (enviando) => {
        boton.disabled = enviando;
        boton.classList.toggle("is-loading", enviando);
        formulario.setAttribute("aria-busy", enviando ? "true" : "false");
        if (etiqueta) etiqueta.textContent = enviando ? "Enviando..." : "Enviar mensaje";
        else boton.textContent = enviando ? "Enviando..." : "Enviar mensaje";
    };

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        if (boton.disabled || !formulario.reportValidity()) return;

        estado.textContent = "";
        estado.className = "estado-contacto";
        actualizarEnvio(true);

        const datos = {
            nombre: document.getElementById("contactoNombre").value.trim(),
            correo: document.getElementById("contactoCorreo").value.trim(),
            asunto: document.getElementById("contactoAsunto").value.trim(),
            mensaje: document.getElementById("contactoMensaje").value.trim()
        };

        try {
            const respuesta = await fetch(`${API_URL}/contactos`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(datos)
            });
            if (!respuesta.ok) {
                let mensaje = "No pudimos enviar tu mensaje. Inténtalo nuevamente.";
                try {
                    const detalle = await respuesta.json();
                    mensaje = detalle.message || detalle.mensaje || mensaje;
                } catch (_) { /* No todos los errores devuelven JSON. */ }
                throw new Error(mensaje);
            }

            formulario.reset();
            estado.textContent = "¡Mensaje enviado! Recibimos tu consulta en PixBen y podremos responderte por correo.";
            estado.classList.add("ok");
        } catch (error) {
            estado.textContent = error?.message || "No fue posible conectar con PixBen. Inténtalo nuevamente.";
            estado.classList.add("error");
        } finally {
            actualizarEnvio(false);
        }
    });
})();
