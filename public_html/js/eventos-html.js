/*
 * Enlaza eventos que antes estaban escritos como onclick/onchange/onerror
 * dentro de los HTML. Se carga al final de cada página.
 */

document.addEventListener("DOMContentLoaded", function () {
    enlazarClick(".usuario-icono", function () {
        if (typeof window.toggleMenuUsuario === "function") {
            window.toggleMenuUsuario();
        }
    });

    enlazarClick("#btnCerrarSesion", function (evento) {
        evento.preventDefault();
        if (typeof window.cerrarSesion === "function") {
            window.cerrarSesion();
        }
    });

    enlazarClick("#btnCerrarSesionPerfil", function (evento) {
        evento.preventDefault();
        if (typeof window.cerrarSesion === "function") {
            window.cerrarSesion();
        }
    });

    enlazarClick("#btnAbrirCheckout", llamarGlobal("abrirCheckout"));
    enlazarClick("#btnVaciarCarrito", llamarGlobal("vaciarCarrito"));
    enlazarClick("#btnCerrarCheckout", llamarGlobal("cerrarCheckout"));
    enlazarClick("#btnConfirmarCompra", llamarGlobal("confirmarCompra"));
    enlazarClick("#btnIniciarSesion", llamarGlobal("iniciarSesion"));
    enlazarClick("#btnRegistrar", llamarGlobal("registrar"));
    enlazarClick("#btnAgregarCarrito", llamarGlobal("agregarCarrito"));
    enlazarClick("#btnComprarAhora", llamarGlobal("comprarAhora"));
    enlazarClick("#btnAgregarFavorito", llamarGlobal("agregarFavorito"));
    enlazarClick("#btnPublicarResena", llamarGlobal("publicarResena"));

    const metodoPago = document.getElementById("metodoPago");
    if (metodoPago) {
        metodoPago.addEventListener("change", llamarGlobal("mostrarMetodoPago"));
    }

    const metodoEnvio = document.getElementById("metodoEnvio");
    if (metodoEnvio) {
        metodoEnvio.addEventListener("change", llamarGlobal("actualizarFormularioEnvio"));
    }

    document.querySelectorAll("[data-talla]").forEach(function (boton) {
        boton.addEventListener("click", function () {
            if (typeof window.seleccionarTalla === "function") {
                window.seleccionarTalla(boton.dataset.talla, boton);
            }
        });
    });

    const imagenProducto = document.getElementById("imagenProducto");
    if (imagenProducto) {
        imagenProducto.addEventListener("error", function () {
            if (typeof window.manejarErrorImagen === "function") {
                window.manejarErrorImagen(imagenProducto);
            }
        });
    }
});

function enlazarClick(selector, manejador) {
    const elemento = document.querySelector(selector);
    if (elemento && typeof manejador === "function") {
        elemento.addEventListener("click", manejador);
    }
}

function llamarGlobal(nombreFuncion) {
    return function () {
        const funcion = window[nombreFuncion];
        if (typeof funcion === "function") {
            funcion();
        }
    };
}
