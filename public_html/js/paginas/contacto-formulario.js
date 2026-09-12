"use strict";

(() => {
    const formulario = document.getElementById("formContacto");
    const estado = document.getElementById("estadoContacto");
    const usuario = obtenerUsuarioSesion();
    if (!formulario) return;

    if (usuario) {
        document.getElementById("contactoNombre").value = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ");
        document.getElementById("contactoCorreo").value = usuario.correo || "";
    }

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        const boton = formulario.querySelector('button[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Enviando...";
        estado.textContent = "";
        estado.className = "estado-contacto";

        try {
            const respuesta = await fetch(`${API_URL}/contactos`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    nombre: document.getElementById("contactoNombre").value.trim(),
                    correo: document.getElementById("contactoCorreo").value.trim(),
                    asunto: document.getElementById("contactoAsunto").value.trim(),
                    mensaje: document.getElementById("contactoMensaje").value.trim()
                })
            });
            if (!respuesta.ok) {
                let mensaje = "No se pudo enviar el mensaje";
                try { mensaje = (await respuesta.json()).message || mensaje; } catch {}
                throw new Error(mensaje);
            }
            formulario.reset();
            if (usuario) {
                document.getElementById("contactoNombre").value = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ");
                document.getElementById("contactoCorreo").value = usuario.correo || "";
            }
            estado.textContent = "Mensaje enviado. El administrador lo verá en el panel de PixBen.";
            estado.classList.add("ok");
        } catch (error) {
            estado.textContent = error.message;
            estado.classList.add("error");
        } finally {
            boton.disabled = false;
            boton.textContent = "Enviar mensaje";
        }
    });
})();
