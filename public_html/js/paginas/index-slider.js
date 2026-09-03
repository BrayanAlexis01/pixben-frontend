"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const banner = document.querySelector(".banner");
    const slider = document.getElementById("slider");

    if (!banner || !slider) {
        return;
    }

    /*
     * Solo obtenemos los cuatro banners originales.
     * El clon se añade después.
     */
    const slidesOriginales =
            Array.from(slider.querySelectorAll(".slide"));

    if (slidesOriginales.length === 0) {
        banner.classList.add("carrusel-listo");
        return;
    }

    let indiceActual = 0;
    let intervalo = null;
    let reiniciando = false;

    /*
     * Copia del primer banner para producir:
     *
     * 1 → 2 → 3 → 4 → copia del 1
     *
     * Al terminar la transición se regresa al primer banner
     * original sin que el usuario vea el salto.
     */
    if (slidesOriginales.length > 1) {

        const primerClon =
                slidesOriginales[0].cloneNode(true);

        primerClon.setAttribute("aria-hidden", "true");
        primerClon.classList.add("slide-clonado");
        primerClon.tabIndex = -1;

        slider.appendChild(primerClon);
    }

    function moverSlider(conAnimacion) {

        slider.style.transition = conAnimacion
                ? "transform 0.8s ease-in-out"
                : "none";

        slider.style.transform =
                `translate3d(-${indiceActual * 100}vw, 0, 0)`;
    }

    function detenerCarrusel() {

        if (intervalo !== null) {
            clearInterval(intervalo);
            intervalo = null;
        }
    }

    function siguienteSlide() {

        if (
            reiniciando ||
            slidesOriginales.length <= 1
        ) {
            return;
        }

        indiceActual++;
        moverSlider(true);
    }

    function iniciarCarrusel() {

        detenerCarrusel();

        if (slidesOriginales.length <= 1) {
            return;
        }

        intervalo = window.setInterval(
                siguienteSlide,
                5000
        );
    }

    /*
     * Al llegar al clon del primer banner, regresamos
     * inmediatamente al primer banner verdadero.
     */
    slider.addEventListener("transitionend", (event) => {

        if (event.propertyName !== "transform") {
            return;
        }

        if (indiceActual !== slidesOriginales.length) {
            return;
        }

        reiniciando = true;
        indiceActual = 0;

        moverSlider(false);

        /*
         * Obliga al navegador a aplicar el cambio sin transición.
         */
        void slider.offsetWidth;

        reiniciando = false;
    });

    slider.addEventListener(
            "mouseenter",
            detenerCarrusel
    );

    slider.addEventListener(
            "mouseleave",
            iniciarCarrusel
    );

    document.addEventListener(
            "visibilitychange",
            () => {

                if (document.hidden) {
                    detenerCarrusel();
                } else {
                    iniciarCarrusel();
                }
            }
    );

    function mostrarCarrusel() {

        indiceActual = 0;
        moverSlider(false);

        banner.classList.add("carrusel-listo");

        iniciarCarrusel();
    }

    /*
     * Preparamos la primera imagen antes de mostrar el slider.
     * Mientras tanto se ve el mismo banner como fondo,
     * por lo que no aparecerá el espacio blanco.
     */
    const primeraImagen = new Image();

    let imagenProcesada = false;

    function finalizarCarga() {

        if (imagenProcesada) {
            return;
        }

        imagenProcesada = true;
        mostrarCarrusel();
    }

    primeraImagen.addEventListener(
            "load",
            finalizarCarga
    );

    primeraImagen.addEventListener(
            "error",
            finalizarCarga
    );

    primeraImagen.src =
            "imagensponsor/banners/banner-polos.webp";

    if (primeraImagen.complete) {
        finalizarCarga();
    }
});