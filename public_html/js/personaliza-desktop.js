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
            } else {
                // Al entrar al editor móvil el panel Calidad no debe interrumpir
                // ninguna pestaña; Producto habilita sus plantillas al abrirse.
                templates.hidden=true;
                printPanel.hidden=true;
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

    /* Biblioteca original: el catálogo y sus SVG no se descargan hasta pulsar
       Explorar plantillas. Se renderizan 8 tarjetas por lote para ahorrar memoria. */
    const libraryButton = document.getElementById("pbLoadTemplateLibrary");
    const libraryIntro = document.getElementById("pbTemplateLibraryIntro");
    const libraryBody = document.getElementById("pbTemplateLibraryBody");
    const categoryList = document.getElementById("pbTemplateCategories");
    const templateGallery = document.getElementById("pbTemplateGallery");
    const templateSearch = document.getElementById("pbTemplateSearch");
    const templateCount = document.getElementById("pbTemplateCount");
    const showMore = document.getElementById("pbTemplateMore");
    const templateFeedback = document.getElementById("pbProTemplateFeedback");
    let templatePackRequest = null;
    let selectedCategory = "Todos";
    let visibleTemplateCount = 8;
    let templateSearchTerm = "";

    function normalizeTemplateText(text) {
        return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    }

    function requestTemplatePack() {
        if (window.PixBenTemplateLibrary) return Promise.resolve(window.PixBenTemplateLibrary);
        if (!templatePackRequest) {
            templatePackRequest = new Promise((resolve,reject)=>{
                const script=document.createElement("script");
                script.src="../js/personaliza-template-library.js?v=1";
                script.async=true;
                script.onload=()=>{
                    if (window.PixBenTemplateLibrary) resolve(window.PixBenTemplateLibrary);
                    else reject(new Error("La biblioteca de plantillas no está disponible."));
                };
                script.onerror=()=>reject(new Error("No se pudo cargar la biblioteca. Revisa tu conexión."));
                document.head.appendChild(script);
            }).catch(err=>{
                templatePackRequest=null;
                throw err;
            });
        }
        return templatePackRequest;
    }

    function getFilteredTemplates() {
        const pack=window.PixBenTemplateLibrary;
        if (!pack) return [];
        const term=normalizeTemplateText(templateSearchTerm);
        return pack.items.filter(t=>{
            const categoryMatch=selectedCategory==="Todos"||selectedCategory===t.category;
            const textMatch=!term||normalizeTemplateText(
                [t.name,t.category,t.description,t.id].join(" ")
            ).includes(term);
            return categoryMatch&&textMatch;
        });
    }

    function renderTemplateCategories() {
        const pack=window.PixBenTemplateLibrary;
        if (!pack||!categoryList) return;
        categoryList.replaceChildren();
        pack.categories.forEach(category=>{
            const button=document.createElement("button");
            button.type="button";
            button.textContent=category;
            button.setAttribute("aria-pressed",String(category===selectedCategory));
            button.className=category===selectedCategory?"pb-template-category-selected":"";
            button.addEventListener("click",()=>{
                selectedCategory=category;
                visibleTemplateCount=8;
                renderTemplateCategories();
                renderTemplateCards();
            });
            categoryList.append(button);
        });
    }

    function makeTemplateCard(template,library) {
        const card=document.createElement("article");
        card.className="pb-template-card";
        const picture=document.createElement("div");
        picture.className="pb-template-card__art";
        // Solo se inserta SVG generado desde definiciones originales del repositorio,
        // no desde nombres ni HTML introducidos por usuarios.
        picture.innerHTML=library.renderSvg(template);
        const info=document.createElement("div");
        info.className="pb-template-card__info";
        const label=document.createElement("span");
        label.className="pb-template-card__category";
        label.textContent=template.category;
        const title=document.createElement("strong");
        title.textContent=template.name;
        const description=document.createElement("small");
        description.textContent=template.description;
        info.append(label,title,description);
        const actions=document.createElement("div");
        actions.className="pb-template-card__actions";
        const use=document.createElement("button");
        use.type="button";
        use.dataset.templateId=template.id;
        use.dataset.templateAction="apply";
        use.innerHTML='<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Usar';
        use.className="pb-template-card__apply";
        use.setAttribute("aria-label","Usar plantilla "+template.name);
        const download=document.createElement("button");
        download.type="button";
        download.dataset.templateId=template.id;
        download.dataset.templateAction="download";
        download.innerHTML='<i class="fa-solid fa-download" aria-hidden="true"></i> Descargar muestra';
        download.className="pb-template-card__download";
        download.setAttribute("aria-label","Descargar muestra de "+template.name+" en SVG");
        actions.append(use,download);
        card.append(picture,info,actions);
        return card;
    }

    function renderTemplateCards() {
        if (!templateGallery || !window.PixBenTemplateLibrary) return;
        const pack=window.PixBenTemplateLibrary;
        const list=getFilteredTemplates();
        const subset=list.slice(0,visibleTemplateCount);
        templateGallery.replaceChildren();
        subset.forEach(template=>templateGallery.append(makeTemplateCard(template,pack)));
        if (!subset.length) {
            const note=document.createElement("p");
            note.className="pb-template-gallery-empty";
            note.textContent="No encontramos diseños con esos filtros. Prueba otra categoría o palabra.";
            templateGallery.append(note);
        }
        if (templateCount) templateCount.textContent =
            list.length+" "+(list.length===1?"diseño disponible":"diseños disponibles");
        if (showMore) {
            showMore.hidden=list.length<=visibleTemplateCount;
            showMore.textContent=showMore.hidden?"": "Mostrar más diseños ("+
                (list.length-visibleTemplateCount)+" restantes)";
        }
        pack.ensureFonts(subset);
    }

    libraryButton?.addEventListener("click",async()=>{
        if(libraryButton.disabled)return;
        libraryButton.disabled=true;
        const original=libraryButton.innerHTML;
        libraryButton.innerHTML='<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Cargando galería...';
        if(templateFeedback)templateFeedback.textContent="";
        try {
            const pack=await requestTemplatePack();
            if(libraryIntro)libraryIntro.hidden=true;
            if(libraryBody)libraryBody.hidden=false;
            libraryButton.setAttribute("aria-expanded","true");
            renderTemplateCategories();
            renderTemplateCards();
            if (templateFeedback) templateFeedback.textContent=
                pack.items.length+" plantillas disponibles. Puedes elegir o descargar una muestra.";
            templateSearch?.focus({preventScroll:true});
        } catch(err) {
            if (templateFeedback) templateFeedback.textContent=
                err.message||"No pudimos cargar la biblioteca. Intenta de nuevo.";
        } finally {
            libraryButton.disabled=false;
            libraryButton.innerHTML=original;
        }
    });
    templateSearch?.addEventListener("input",event=>{
        templateSearchTerm=event.target.value.slice(0,80);
        visibleTemplateCount=8;
        renderTemplateCards();
    });
    showMore?.addEventListener("click",()=>{
        visibleTemplateCount+=8;
        renderTemplateCards();
    });
    templateGallery?.addEventListener("click",async event=>{
        const button=event.target.closest("button[data-template-action]");
        if(!button||button.disabled)return;
        const pack=window.PixBenTemplateLibrary;
        const item=pack?.get(button.dataset.templateId);
        if(!item)return;
        if(button.dataset.templateAction==="download") {
            try {
                pack.downloadTemplate(item);
                if(templateFeedback)templateFeedback.textContent=
                    "Se inició la descarga de la muestra SVG de «"+item.name+"».";
            }catch(err) {
                if(templateFeedback)templateFeedback.textContent="No se pudo generar la muestra.";
            }
            return;
        }
        button.disabled=true;
        const original=button.innerHTML;
        button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Añadiendo...';
        try {
            const applied=await studio.aplicarPlantillaEstudio(item.id);
            if(applied) {
                if(templateFeedback)templateFeedback.textContent=
                    "Plantilla «"+item.name+"» añadida. Puedes editar cada texto y forma.";
                if(mq.matches)chooseTool("texto");
                else if(window.matchMedia("(max-width:820px)").matches) {
                    document.querySelector("[data-pb-mobile-close]")?.click();
                }
            } else if(templateFeedback) {
                templateFeedback.textContent="No se realizaron cambios en el diseño.";
            }
        }catch(err) {
            if(templateFeedback)templateFeedback.textContent=
                err.message||"No se pudo aplicar la plantilla.";
        }finally{
            button.disabled=false;
            button.innerHTML=original;
        }
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