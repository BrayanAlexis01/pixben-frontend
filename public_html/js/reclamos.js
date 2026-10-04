"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formReclamoPixBen");
    const estado = document.getElementById("estadoReclamoPixBen");
    if (!form || !estado) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;
        estado.textContent = "Registrando tu solicitud...";
        estado.className = "policy-form-status";
        try {
            const cuerpo = {
                tipo: document.getElementById("reclamoTipo").value,
                nombre: document.getElementById("reclamoNombre").value.trim(),
                documento: document.getElementById("reclamoDocumento").value.trim(),
                correo: document.getElementById("reclamoCorreo").value.trim(),
                telefono: document.getElementById("reclamoTelefono").value.trim(),
                pedidoReferencia: document.getElementById("reclamoPedido").value.trim(),
                detalle: document.getElementById("reclamoDetalle").value.trim(),
                pedidoConsumidor: document.getElementById("reclamoPedidoConsumidor").value.trim()
            };
            const respuesta = await fetch(`${API_URL}/reclamos`, {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(cuerpo)
            });
            if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo registrar la solicitud"));
            const datos = await respuesta.json();
            estado.textContent = `Registro recibido. Código: ${datos.id}. Guarda este código como constancia.`;
            estado.className = "policy-form-status ok";
            form.reset();
        } catch (error) {
            estado.textContent = error.message || "No se pudo registrar la solicitud.";
            estado.className = "policy-form-status error";
        } finally {
            boton.disabled = false;
        }
    });
});
