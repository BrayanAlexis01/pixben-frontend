"use strict";
/* Studio móvil: navegación por herramientas sin mover ni recrear el canvas Fabric.
 * El editor base, sus controles, borradores y cotizaciones siguen siendo los originales. */
(() => {
    const query = window.matchMedia("(max-width: 820px)");
    const body = document.body;
    const tools = document.getElementById("pbStudioTools");
    const order = document.getElementById("pbStudioOrder");
    const backdrop = document.getElementById("pbMobileSheetBackdrop");
    const tabs = [...document.querySelectorAll("[data-pb-studio-tab]")];
    const groups = [...(tools?.querySelectorAll(":scope > details.grupo-editor") || [])];
    const quick = document.getElementById("pbMobileQuickActions");
    const tip = document.getElementById("pbMobileToolTip");
    const heading = document.getElementById("pbMobileToolsTitle");
    const expand = document.getElementById("pbMobileToolsExpand");
    const addText = document.getElementById("pbMobileAddText");
    const addImage = document.getElementById("pbMobileAddImage");
    let active = null;
    let lastButton = null;

    if (!tools || !order || !backdrop || !tabs.length || groups.length < 7) return;

    const groupTypes = ["producto", "imagen", "texto", "imagen", "capas", "capas", "capas"];
    groups.forEach((node, i) => {
        node.dataset.pbToolGroup = groupTypes[i];
    });

    const titles = {
        producto: "Elige tu producto",
        texto: "Texto y tipografías",
        imagen: "Imágenes y formas",
        capas: "Editar elementos",
        pedido: "Revisar cotización"
    };
    const tips = {
        producto: "Elige el producto, color, talla y cantidad para tu diseño.",
        texto: "Añade una frase y personaliza su estilo. Toca el texto en el lienzo para editarlo.",
        imagen: "Sube tu imagen, añade formas o selecciona una foto del lienzo para ajustar sus colores.",
        capas: "Selecciona un elemento en el lienzo para cambiar tamaño, posición y orden."
    };

    const mobile = () => query.matches;

    const setExpanded = (value) => {
        tools.classList.toggle("pb-mobile-sheet-expanded", value);
        if (expand) {
            expand.setAttribute("aria-pressed", String(value));
            expand.setAttribute("aria-label", value ? "Reducir panel de herramientas" : "Ampliar panel de herramientas");
        }
    };

    function updateTabs() {
        tabs.forEach(button => {
            const on = active === button.dataset.pbStudioTab;
            button.classList.toggle("pb-studio-tab-active", on);
            button.setAttribute("aria-expanded", String(on));
            button.setAttribute("aria-pressed", String(on));
        });
    }

    function closeSheet({returnFocus = true} = {}) {
        const focusTarget = lastButton;
        active = null;
        body.classList.remove("pb-studio-sheet-open");
        backdrop.hidden = true;
        tools.classList.remove("pb-mobile-sheet-open");
        order.classList.remove("pb-mobile-sheet-open");
        setExpanded(false);
        updateTabs();
        [tools, order].forEach(sheet => {
            sheet.removeAttribute("role");
            sheet.removeAttribute("aria-modal");
        });
        if (mobile()) {
            tools.inert = true;
            order.inert = true;
        }
        if (returnFocus && mobile() && focusTarget && focusTarget.isConnected) {
            focusTarget.focus({preventScroll:true});
        }
    }

    function showGroups(selected) {
        groups.forEach(group => {
            const visible = group.dataset.pbToolGroup === selected;
            group.classList.toggle("pb-mobile-group-visible", visible);
            // Se preserva el atributo hidden del editor para los ajustes contextuales.
            if (visible && !group.hidden) group.open = true;
        });
        heading.textContent = titles[selected] || "Herramientas";
        if (quick) {
            quick.hidden = !["texto", "imagen"].includes(selected);
            addText.hidden = selected !== "texto";
            addImage.hidden = selected !== "imagen";
        }
        if (tip) {
            tip.hidden = !tips[selected];
            tip.textContent = tips[selected] || "";
        }
        tools.scrollTop = 0;
    }

    function openSheet(name, button) {
        if (!mobile()) return;
        if (active === name) {
            closeSheet();
            return;
        }
        lastButton = button || null;
        active = name;
        const isOrder = name === "pedido";
        body.classList.add("pb-studio-sheet-open");
        backdrop.hidden = false;
        tools.classList.toggle("pb-mobile-sheet-open", !isOrder);
        order.classList.toggle("pb-mobile-sheet-open", isOrder);
        tools.inert = isOrder;
        order.inert = !isOrder;
        setExpanded(false);
        if (!isOrder) showGroups(name);
        const sheet = isOrder ? order : tools;
        sheet.setAttribute("role", "dialog");
        sheet.setAttribute("aria-modal", "true");
        const other = isOrder ? tools : order;
        other.removeAttribute("role");
        other.removeAttribute("aria-modal");
        updateTabs();
        sheet.querySelector(".pb-mobile-sheet-close")?.focus({preventScroll:true});
    }

    const setMode = () => {
        if (!mobile()) {
            closeSheet({returnFocus:false});
            body.classList.remove("pb-studio-mobile-on","pb-studio-keyboard-open");
            tools.inert = false;
            order.inert = false;
            document.documentElement.style.removeProperty("--pb-studio-keyboard-inset");
            return;
        }
        body.classList.add("pb-studio-mobile-on");
        closeSheet({returnFocus:false});
    };

    tabs.forEach(button => {
        button.addEventListener("click", () => openSheet(button.dataset.pbStudioTab, button));
    });
    document.querySelectorAll("[data-pb-mobile-close]").forEach(button =>
        button.addEventListener("click", () => closeSheet())
    );
    backdrop.addEventListener("click", () => closeSheet());

    if (expand) expand.addEventListener("click", () =>
        setExpanded(!tools.classList.contains("pb-mobile-sheet-expanded"))
    );
    if (addText) addText.addEventListener("click", () =>
        document.getElementById("btnAgregarTexto")?.click()
    );
    if (addImage) addImage.addEventListener("click", () =>
        document.getElementById("btnSubirImagen")?.click()
    );

    document.addEventListener("keydown", event => {
        if (!active || !mobile()) return;
        const otherModal = document.querySelector(".modal-preview:not([hidden])");
        if (otherModal) return;
        if (event.key === "Escape") {
            event.preventDefault();
            closeSheet();
            return;
        }
        if (event.key !== "Tab") return;
        const sheet = active === "pedido" ? order : tools;
        const focusables = [...sheet.querySelectorAll("button:not([disabled]),a[href],input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),summary")].filter(el =>
            !el.closest("[hidden]") && el.getClientRects().length > 0
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // Arrastrar hacia arriba expande el panel y hacia abajo lo contrae o cierra.
    [tools, order].forEach(sheet => {
        const handle = sheet.querySelector(".pb-mobile-sheet-heading");
        let startY = null;
        handle?.addEventListener("touchstart", event => {
            startY = event.changedTouches[0]?.clientY ?? null;
        }, {passive:true});
        handle?.addEventListener("touchend", event => {
            if (!mobile() || !active || startY === null) return;
            const distance = (event.changedTouches[0]?.clientY ?? startY) - startY;
            startY = null;
            if (distance < -45 && sheet === tools) setExpanded(true);
            else if (distance > 55) {
                if (sheet === tools && tools.classList.contains("pb-mobile-sheet-expanded")) setExpanded(false);
                else closeSheet();
            }
        }, {passive:true});
    });
    const viewport = window.visualViewport;
    const updateKeyboard = () => {
        if (!mobile()) return;
        const keyboard = viewport ?
            Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
        const focus = document.activeElement;
        const enteringText = focus?.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=color]),textarea,select");
        const shown = keyboard > 130 && enteringText && Boolean(active);
        body.classList.toggle("pb-studio-keyboard-open", shown);
        document.documentElement.style.setProperty("--pb-studio-keyboard-inset", shown ? keyboard + "px" : "0px");
    };
    viewport?.addEventListener("resize", updateKeyboard);
    viewport?.addEventListener("scroll", updateKeyboard);
    document.addEventListener("focusin", updateKeyboard);
    document.addEventListener("focusout", () => window.requestAnimationFrame(updateKeyboard));

    query.addEventListener?.("change", setMode);
    setMode();
})();