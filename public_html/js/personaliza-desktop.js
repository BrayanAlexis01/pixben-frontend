"use strict";
/* Control de interfaz: usa exclusivamente la API acotada del personalizador.
   No toca la estructura interna de Fabric ni los datos de las cotizaciones. */
(() => {
    const mq = window.matchMedia("(min-width: 1321px)");
    const studio = window.PixBenStudioEditor;
    const tools = document.getElementById("pbStudioTools");
    const rail = [...document.querySelectorAll("[data-pb-desktop-tool]")];
    const details = [...(tools?.querySelectorAll(":scope > details.grupo-editor") || [])];
    const templates = document.getElementById("pbProTemplates");
    const printPanel = document.getElementById("pbProPrintPanel");
    const stage = document.getElementById("pbProProductStage");
    const image = document.getElementById("pbProProductImage");
    const empty = document.getElementById("pbProProductEmpty");
    const stageButtons = [...document.querySelectorAll("[data-pb-stage-mode]")];
    const previewButtons = [...document.querySelectorAll("[data-pb-preview-mode]")];
    const canvasShell = document.getElementById("canvasShell");
    const sideLabel = document.getElementById("pbProStageSide");
    const liveState = document.getElementById("pbProLiveState");
    let current = "producto";
    let stageMode = "design";
    let lastSelected = "ninguno";
    let lastSide = "";
    let ultimaCaptura = 0;
    let temporizadorVista = null;
    function programarVistaProducto() {
        if (!mq.matches || stageMode !== "product") return;
        clearTimeout(temporizadorVista);
        temporizadorVista = setTimeout(refreshProductStage, 280);
    }
    if (!studio || !tools || details.length !== 7 || !templates || !printPanel || !stage || !image) return;

    const sections = {
        producto:[0], plantillas:[], texto:[1,2], imagen:[1,3],
        elementos:[1,4,5], capas:[5,6], calidad:[]
    };

    function chooseTool(name, options = {}) {
        if (!mq.matches || !Object.prototype.hasOwnProperty.call(sections,name)) return;
        current = name;
        tools.classList.add("pb-pro-rail-active");
        details.forEach((group,index) => {
            const show = sections[name].includes(index);
            group.classList.toggle("pb-pro-group-active",show);
            if (show && !group.hidden) group.open = true;
        });
        templates.hidden = name !== "plantillas";
        printPanel.hidden = name !== "calidad";
        rail.forEach(button => {
            const active = button.dataset.pbDesktopTool === name;
            button.setAttribute("aria-pressed",String(active));
            button.classList.toggle("pb-pro-rail-selected",active);
        });
        if (options.focusFirst) {
            const target = name === "plantillas" ? templates.querySelector("button") :
                name === "calidad" ? printPanel.querySelector("input") :
                tools.querySelector(".grupo-editor.pb-pro-group-active:not([hidden]) summary");
            target?.focus({preventScroll:true});
        }
    }

    function showDesign() {
        stageMode="design";
        ultimaCaptura++;
        stage.hidden=true;
        canvasShell.removeAttribute("aria-hidden");
        stageButtons.forEach(b => b.setAttribute("aria-pressed",String(b.dataset.pbStageMode==="design")));
    }
    async function refreshProductStage() {
        if (!mq.matches || stageMode!=="product") return;
        const captura = ++ultimaCaptura;
        try {
            const imageData = await studio.capturarProductoActual();
            if (captura !== ultimaCaptura || !mq.matches || stageMode!=="product") return;
            if (imageData) {
                image.src=imageData;
                image.hidden=false;
                empty.hidden=true;
            } else {
                image.removeAttribute("src");
                image.hidden=true;
                empty.hidden=false;
            }
        } catch(error) {
            image.removeAttribute("src");
            image.hidden=true;
            empty.hidden=false;
            const label = empty.querySelector("span");
            if(label) label.textContent="No se pudo generar la simulación. Revisa la imagen del producto o vuelve al modo Diseño.";
        }
    }
    function showProduct() {
        if (!mq.matches) return;
        stageMode="product";
        stage.hidden=false;
        canvasShell.setAttribute("aria-hidden","true");
        stageButtons.forEach(b => b.setAttribute("aria-pressed",String(b.dataset.pbStageMode==="product")));
        lastSide=studio.getState().lado;
        refreshProductStage();
    }

    function syncMode() {
        if (!mq.matches) {
            tools.classList.remove("pb-pro-rail-active");
            details.forEach(group=>group.classList.remove("pb-pro-group-active"));
            const tablet = window.innerWidth > 820;
            if(tablet) details.forEach(group=>group.open=true);
            // En tablet las herramientas siguen en su layout tradicional, pero
            // plantillas y ayudas quedan accesibles. En móvil las controla su barra inferior.
            if(tablet) {
                templates.hidden=false;
                printPanel.hidden=false;
            }
            showDesign();
            return;
        }
        chooseTool(current);
    }
    rail.forEach(button=>button.addEventListener("click",()=>chooseTool(button.dataset.pbDesktopTool,{focusFirst:true})));
    document.querySelectorAll("[data-pb-proxy]").forEach(button=>{
        button.addEventListener("click",()=>document.getElementById(button.dataset.pbProxy)?.click());
    });
    document.querySelectorAll("[data-pb-template]").forEach(button=>{
        button.addEventListener("click",async()=>{
            if(button.disabled)return;
            button.disabled=true;
            const feedback=document.getElementById("pbProTemplateFeedback");
            try {
                const result=await studio.aplicarPlantillaEstudio(button.dataset.pbTemplate);
                if(result) {
                    if(feedback) feedback.textContent="Plantilla añadida. Personaliza cada texto y detalle.";
                    if(mq.matches) chooseTool("texto");
                } else if(feedback) feedback.textContent="Plantilla no añadida.";
            }catch(error){
                if(feedback) feedback.textContent="No se pudo cargar la plantilla. Inténtalo de nuevo.";
            }finally{button.disabled=false;}
        });
    });
    document.getElementById("pbProSnapEnabled")?.addEventListener("change",event=>
        studio.activarGuiasMagneticas(event.target.checked)
    );
    stageButtons.forEach(button=>button.addEventListener("click",()=>{
        if(button.dataset.pbStageMode==="product") showProduct();
        else showDesign();
    }));
    document.getElementById("pbProChooseProduct")?.addEventListener("click",()=>{
        showDesign();
        chooseTool("producto",{focusFirst:true});
        document.getElementById("productoSelect")?.focus({preventScroll:true});
    });
    previewButtons.forEach(button=>button.addEventListener("click",()=>{
        const isProduct=button.dataset.pbPreviewMode==="product";
        if (isProduct && !studio.getState().tieneProducto) {
            alert("Selecciona un producto base para ver una presentación realista de la prenda.");
            return;
        }
        document.getElementById("modalPreview")?.classList.toggle("pb-pro-modal-product",isProduct);
        previewButtons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
    }));
    document.addEventListener("pixben:studio-update",event=>{
        const state=studio.getState();
        if(sideLabel) sideLabel.textContent=state.lado==="frente"?"Vista del frente":"Vista de la espalda";
        if(liveState) liveState.innerHTML='<i class="fa-solid fa-circle" aria-hidden="true"></i> '+(state.elementos ? state.elementos+" elementos en "+state.lado : "Editor listo");
        if(mq.matches) {
            if (stageMode === "product") programarVistaProducto();
            const picked=state.seleccionado;
            if(picked!==lastSelected && picked!=="ninguno" && picked!=="producto") {
                chooseTool(picked==="forma"?"elementos":picked);
            }
            if(lastSide!==state.lado && stageMode==="product") {
                lastSide=state.lado;
                // El cambio de cara ya está resuelto por el editor principal.
                refreshProductStage();
            }
            lastSelected=picked;
        }
    });
    // Los cambios en color, tamaño, cantidad o textos también actualizan la
    // simulación, sin capturar cada pulsación ni ralentizar el editor.
    tools.addEventListener("input", programarVistaProducto);
    tools.addEventListener("change", programarVistaProducto);
    mq.addEventListener?.("change",syncMode);
    syncMode();
})();