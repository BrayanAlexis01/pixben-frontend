/* Menú responsive global de PixBen.
   - Inserta el botón hamburguesa sin repetir HTML.
   - Abre/cierra un panel lateral.
   - Bloquea el scroll de la página mientras está abierto.
   - Cierra con el fondo oscuro, Escape, un enlace o al volver a escritorio. */
(function () {
    "use strict";

    const BREAKPOINT = 1100;

    function hijosDirectos(elemento) {
        return Array.from(elemento.children);
    }

    function iniciarMenuResponsive() {
        const cabecera = document.querySelector("header");
        if (!cabecera || cabecera.dataset.menuResponsiveInicializado === "true") {
            return;
        }

        const navegacion = hijosDirectos(cabecera).find((hijo) => hijo.tagName === "NAV");
        if (!navegacion) {
            return;
        }

        cabecera.dataset.menuResponsiveInicializado = "true";

        const acciones = hijosDirectos(cabecera).find(
            (hijo) => hijo.classList && hijo.classList.contains("acciones-header")
        );

        const drawer = document.createElement("div");
        drawer.className = "site-drawer";
        drawer.id = "menuPrincipalResponsive";

        cabecera.insertBefore(drawer, navegacion);
        drawer.appendChild(navegacion);
        if (acciones) {
            drawer.appendChild(acciones);
        }

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "menu-hamburguesa";
        boton.setAttribute("aria-label", "Abrir menú de navegación");
        boton.setAttribute("aria-controls", drawer.id);
        boton.setAttribute("aria-expanded", "false");
        boton.innerHTML = "<span></span><span></span><span></span>";
        cabecera.appendChild(boton);

        const overlay = document.createElement("div");
        overlay.className = "site-menu-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);

        let posicionScroll = 0;
        let elementoConFocoAnterior = null;

        const esMovil = () => window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;

        function actualizarAriaMenu() {
            const abierto = document.body.classList.contains("menu-movil-abierto");
            drawer.setAttribute("aria-hidden", esMovil() && !abierto ? "true" : "false");
        }

        function abrirMenu() {
            if (!esMovil()) {
                return;
            }

            elementoConFocoAnterior = document.activeElement;
            posicionScroll = window.scrollY || document.documentElement.scrollTop || 0;

            document.documentElement.classList.add("menu-movil-abierto");
            document.body.classList.add("menu-movil-abierto");
            document.body.style.position = "fixed";
            document.body.style.top = `-${posicionScroll}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.width = "100%";

            boton.setAttribute("aria-expanded", "true");
            boton.setAttribute("aria-label", "Cerrar menú de navegación");
            overlay.setAttribute("aria-hidden", "false");
            drawer.setAttribute("aria-hidden", "false");

            const primerEnlace = drawer.querySelector("a, button, input, select, textarea");
            window.setTimeout(() => primerEnlace && primerEnlace.focus(), 120);
        }

        function cerrarMenu(devolverFoco = true) {
            const estabaAbierto = document.body.classList.contains("menu-movil-abierto");

            document.documentElement.classList.remove("menu-movil-abierto");
            document.body.classList.remove("menu-movil-abierto");
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";

            boton.setAttribute("aria-expanded", "false");
            boton.setAttribute("aria-label", "Abrir menú de navegación");
            overlay.setAttribute("aria-hidden", "true");
            actualizarAriaMenu();

            if (estabaAbierto) {
                window.scrollTo(0, posicionScroll);
            }

            if (devolverFoco && elementoConFocoAnterior instanceof HTMLElement) {
                elementoConFocoAnterior.focus();
            }
        }

        function alternarMenu() {
            const abierto = document.body.classList.contains("menu-movil-abierto");
            abierto ? cerrarMenu(false) : abrirMenu();
        }

        boton.addEventListener("click", alternarMenu);
        overlay.addEventListener("click", () => cerrarMenu());

        drawer.addEventListener("click", (evento) => {
            const enlace = evento.target.closest("nav a");
            if (enlace && esMovil()) {
                cerrarMenu(false);
            }
        });

        document.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape" && document.body.classList.contains("menu-movil-abierto")) {
                cerrarMenu();
                return;
            }

            if (evento.key !== "Tab" || !document.body.classList.contains("menu-movil-abierto")) {
                return;
            }

            const enfocables = Array.from(
                drawer.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            ).filter((elemento) => elemento.offsetParent !== null);

            if (enfocables.length === 0) {
                evento.preventDefault();
                boton.focus();
                return;
            }

            const primero = enfocables[0];
            const ultimo = enfocables[enfocables.length - 1];

            if (evento.shiftKey && document.activeElement === primero) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primero.focus();
            }
        });

        window.addEventListener("resize", () => {
            if (!esMovil()) {
                cerrarMenu(false);
            } else {
                actualizarAriaMenu();
            }
        });

        actualizarAriaMenu();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarMenuResponsive);
    } else {
        iniciarMenuResponsive();
    }
})();
