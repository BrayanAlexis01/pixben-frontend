"use strict";

function mostrarMetodoPago() {
    const metodo = document.getElementById("metodoPago")?.value;
    const contenedor = document.getElementById("contenedorPago");
    if (!contenedor) return;

    const opciones = {
        YAPE: {
            titulo: "Paga con Yape",
            imagen: "../imagen/pagos/yape.webp",
            texto: "Escanea el QR desde Yape y luego escribe el código de operación."
        },
        PLIN: {
            titulo: "Paga con Plin",
            imagen: "../imagen/pagos/plin.webp",
            texto: "Escanea el QR desde Plin y guarda el número de operación."
        },
        BCP: {
            titulo: "Transferencia BCP",
            imagen: "../imagen/pagos/bcp.webp",
            texto: "Cuenta: 19194784840060 · CCI: 00219119478484006053"
        }
    };

    const opcion = opciones[metodo];
    if (!opcion) {
        contenedor.innerHTML = '<p class="pago-vacio">Selecciona Yape, Plin o transferencia BCP para ver los datos.</p>';
        return;
    }

    contenedor.innerHTML = `<article class="tarjeta-metodo-pago">
        <div class="pago-texto"><span>Pago manual seguro</span><h4>${opcion.titulo}</h4><p>${opcion.texto}</p><small>No se descarga ningún archivo y la operación será verificada por el administrador.</small></div>
        <img src="${opcion.imagen}" alt="Datos para ${opcion.titulo}">
    </article>`;
}

function actualizarFormularioEnvio() {
    const metodo = document.getElementById("metodoEnvio")?.value;
    const direccion = document.getElementById("direccion");
    const referencia = document.getElementById("referenciaEnvio");
    const label = document.getElementById("labelDireccion");
    const ayuda = document.getElementById("ayudaEnvio");
    if (!direccion || !referencia || !label || !ayuda) return;

    if (metodo === "SHALOM") {
        label.textContent = "Ciudad y agencia de Shalom";
        direccion.placeholder = "Ej. Lima, agencia Plaza Norte";
        referencia.placeholder = "Nombre de quien recogerá, DNI o agencia preferida";
        ayuda.textContent = "PixBen entregará el pedido a Shalom. El cliente paga el envío directamente en la agencia o según la modalidad coordinada.";
    } else if (metodo === "INDRIVE") {
        label.textContent = "Dirección de entrega por InDrive";
        direccion.placeholder = "Distrito, avenida, calle y número";
        referencia.placeholder = "Punto de referencia y horario disponible";
        ayuda.textContent = "El cliente paga directamente al conductor de InDrive. PixBen no añade ni cobra ese costo.";
    } else {
        label.textContent = "Destino o dirección";
        direccion.placeholder = "Selecciona primero el método de envío";
        referencia.placeholder = "Agencia, distrito, punto de referencia, horario, etc.";
        ayuda.textContent = "Selecciona Shalom o InDrive. El envío se pagará directamente al transportista y no forma parte del pago a PixBen.";
    }
}

window.mostrarMetodoPago = mostrarMetodoPago;
window.actualizarFormularioEnvio = actualizarFormularioEnvio;

document.addEventListener("DOMContentLoaded", () => {
    mostrarMetodoPago();
    actualizarFormularioEnvio();
});
