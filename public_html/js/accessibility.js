(function(){
    "use strict";

    const STORAGE_KEY = "pixben_accesibilidad_v1";
    const DEFAULTS = {
        textSize: "normal",
        highContrast: false,
        reduceMotion: false,
        underlineLinks: false,
        readingSpacing: false
    };

    let prefs = leerPreferencias();
    let ultimoFoco = null;

    function leerPreferencias(){
        try {
            return {...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")};
        } catch {
            return {...DEFAULTS};
        }
    }

    function guardarPreferencias(){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }

    function aplicarPreferencias(){
        const root = document.documentElement;
        root.classList.toggle("a11y-text-medium", prefs.textSize === "medium");
        root.classList.toggle("a11y-text-large", prefs.textSize === "large");
        root.classList.toggle("a11y-high-contrast", Boolean(prefs.highContrast));
        root.classList.toggle("a11y-reduce-motion", Boolean(prefs.reduceMotion));
        root.classList.toggle("a11y-underline-links", Boolean(prefs.underlineLinks));
        root.classList.toggle("a11y-reading-spacing", Boolean(prefs.readingSpacing));
        sincronizarModal();
    }

    function prepararPagina(){
        const main = document.querySelector("main");
        if (main && !main.id) main.id = "contenido-principal";
        if (main && !document.querySelector(".saltar-contenido")) {
            const skip = document.createElement("a");
            skip.className = "saltar-contenido";
            skip.href = "#" + main.id;
            skip.textContent = "Saltar al contenido principal";
            document.body.prepend(skip);
        }

        document.querySelectorAll("img:not([alt])").forEach(img => img.setAttribute("alt", ""));
        document.querySelectorAll("button:not([type])").forEach(btn => btn.setAttribute("type", "button"));

        document.querySelectorAll("[data-open-accessibility]").forEach(btn => {
            btn.addEventListener("click", evento => {
                evento.preventDefault();
                abrirModal(btn);
            });
        });

        if (!document.querySelector(".a11y-flotante")) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "a11y-flotante";
            boton.setAttribute("aria-label", "Abrir accesibilidad y preferencias");
            boton.setAttribute("title", "Accesibilidad y preferencias");
            boton.innerHTML = '<span aria-hidden="true">♿</span>';
            boton.addEventListener("click", () => abrirModal(boton));
            document.body.appendChild(boton);
        }
    }

    function crearModal(){
        if (document.getElementById("modalAccesibilidad")) return;
        const modal = document.createElement("div");
        modal.id = "modalAccesibilidad";
        modal.className = "a11y-modal";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="a11y-modal-fondo" data-a11y-close></div>
            <section class="a11y-modal-contenido" role="dialog" aria-modal="true"
                     aria-labelledby="tituloAccesibilidad" aria-describedby="descAccesibilidad">
                <header class="a11y-modal-cabecera">
                    <div>
                        <span class="a11y-eyebrow">EXPERIENCIA INCLUSIVA</span>
                        <h2 id="tituloAccesibilidad">Accesibilidad y preferencias</h2>
                        <p id="descAccesibilidad">Ajusta PixBen para leer, navegar y comprar con mayor comodidad.</p>
                    </div>
                    <button class="a11y-cerrar" type="button" data-a11y-close aria-label="Cerrar preferencias de accesibilidad">✕</button>
                </header>
                <div class="a11y-modal-cuerpo">
                    <section class="a11y-bloque">
                        <h3>Tamaño de texto</h3>
                        <p>Modifica el tamaño general de lectura sin cambiar el contenido.</p>
                        <div class="a11y-opciones" role="group" aria-label="Tamaño de texto">
                            <button type="button" class="a11y-opcion" data-a11y-text="normal">A Normal</button>
                            <button type="button" class="a11y-opcion" data-a11y-text="medium">A+ Mediano</button>
                            <button type="button" class="a11y-opcion" data-a11y-text="large">A++ Grande</button>
                        </div>
                    </section>
                    <section class="a11y-bloque">
                        <h3>Visualización</h3>
                        <p>Opciones para mejorar contraste y legibilidad.</p>
                        <div class="a11y-switch-grid">
                            <button type="button" class="a11y-toggle" data-a11y-toggle="highContrast"><i aria-hidden="true">◐</i> Contraste alto</button>
                            <button type="button" class="a11y-toggle" data-a11y-toggle="underlineLinks"><i aria-hidden="true">U</i> Subrayar enlaces</button>
                            <button type="button" class="a11y-toggle" data-a11y-toggle="readingSpacing"><i aria-hidden="true">↔</i> Espaciado de lectura</button>
                            <button type="button" class="a11y-toggle" data-a11y-toggle="reduceMotion"><i aria-hidden="true">◌</i> Reducir animaciones</button>
                        </div>
                    </section>
                    <section class="a11y-bloque">
                        <h3>Navegación por teclado</h3>
                        <p>PixBen muestra un foco visible al navegar con Tab y ofrece un enlace para saltar directamente al contenido principal.</p>
                    </section>
                </div>
                <footer class="a11y-modal-pie">
                    <button type="button" class="a11y-restablecer" id="a11yReset">Restablecer</button>
                    <button type="button" class="a11y-listo" data-a11y-close>Guardar y cerrar</button>
                </footer>
                <p class="a11y-estado" id="a11yEstado" aria-live="polite"></p>
            </section>`;
        document.body.appendChild(modal);

        modal.addEventListener("click", evento => {
            const text = evento.target.closest("[data-a11y-text]");
            if (text) {
                prefs.textSize = text.dataset.a11yText;
                guardarPreferencias();
                aplicarPreferencias();
                anunciar("Tamaño de texto actualizado");
                return;
            }
            const toggle = evento.target.closest("[data-a11y-toggle]");
            if (toggle) {
                const key = toggle.dataset.a11yToggle;
                prefs[key] = !prefs[key];
                guardarPreferencias();
                aplicarPreferencias();
                anunciar("Preferencia actualizada");
                return;
            }
            if (evento.target.closest("[data-a11y-close]")) cerrarModal();
        });

        modal.querySelector("#a11yReset").addEventListener("click", () => {
            prefs = {...DEFAULTS};
            guardarPreferencias();
            aplicarPreferencias();
            anunciar("Preferencias restablecidas");
        });

        modal.addEventListener("keydown", controlarTecladoModal);
    }

    function sincronizarModal(){
        const modal = document.getElementById("modalAccesibilidad");
        if (!modal) return;
        modal.querySelectorAll("[data-a11y-text]").forEach(btn => {
            btn.setAttribute("aria-pressed", String(btn.dataset.a11yText === prefs.textSize));
        });
        modal.querySelectorAll("[data-a11y-toggle]").forEach(btn => {
            btn.setAttribute("aria-pressed", String(Boolean(prefs[btn.dataset.a11yToggle])));
        });
    }

    function abrirModal(origen){
        crearModal();
        ultimoFoco = origen || document.activeElement;
        const modal = document.getElementById("modalAccesibilidad");
        modal.hidden = false;
        document.body.classList.add("a11y-modal-abierto");
        sincronizarModal();
        modal.querySelector(".a11y-cerrar").focus();
    }

    function cerrarModal(){
        const modal = document.getElementById("modalAccesibilidad");
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove("a11y-modal-abierto");
        if (ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
    }

    function controlarTecladoModal(evento){
        const modal = document.getElementById("modalAccesibilidad");
        if (evento.key === "Escape") {
            evento.preventDefault();
            cerrarModal();
            return;
        }
        if (evento.key !== "Tab") return;
        const focusables = [...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
                .filter(el => !el.disabled && !el.hidden);
        if (!focusables.length) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    }

    function anunciar(mensaje){
        const estado = document.getElementById("a11yEstado");
        if (estado) estado.textContent = mensaje;
    }

    window.PixBenAccessibility = {open: abrirModal, close: cerrarModal, preferences: () => ({...prefs})};

    aplicarPreferencias();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            crearModal();
            prepararPagina();
            aplicarPreferencias();
        });
    } else {
        crearModal();
        prepararPagina();
        aplicarPreferencias();
    }
})();
