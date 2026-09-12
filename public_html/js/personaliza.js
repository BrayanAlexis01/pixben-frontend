"use strict";

(() => {
    const usuario = obtenerUsuarioSesion();
    const canvas = new fabric.Canvas("editorCanvas", {
        preserveObjectStacking: true,
        selection: true,
        controlsAboveOverlay: true
    });

    const ANCHO_CANVAS = 560;
    const ALTO_CANVAS = 640;
    const ZONA_IMPRESION = {
        left: ANCHO_CANVAS * 0.28,
        top: ALTO_CANVAS * 0.24,
        width: ANCHO_CANVAS * 0.44,
        height: ALTO_CANVAS * 0.49
    };
    const PROPIEDADES_SERIALIZABLES = [
        "dataTipo", "dataNombre", "dataBloqueado", "dataAjustes",
        "dataCalidad", "dataDimensionesOriginales"
    ];

    const fuentes = [
        {nombre: "Montserrat", familia: "Montserrat", categoria: "Modernas"},
        {nombre: "Poppins", familia: "Poppins", categoria: "Modernas"},
        {nombre: "Arial", familia: "Arial", categoria: "Modernas"},
        {nombre: "Trebuchet MS", familia: "Trebuchet MS", categoria: "Modernas"},
        {nombre: "Bebas Neue", familia: "Bebas Neue", categoria: "Impacto"},
        {nombre: "Archivo Black", familia: "Archivo Black", categoria: "Impacto"},
        {nombre: "Alfa Slab One", familia: "Alfa Slab One", categoria: "Impacto"},
        {nombre: "Anton", familia: "Anton", categoria: "Impacto"},
        {nombre: "Oswald", familia: "Oswald", categoria: "Impacto"},
        {nombre: "Rubik Mono One", familia: "Rubik Mono One", categoria: "Impacto"},
        {nombre: "Bangers", familia: "Bangers", categoria: "Urbanas"},
        {nombre: "Permanent Marker", familia: "Permanent Marker", categoria: "Urbanas"},
        {nombre: "Righteous", familia: "Righteous", categoria: "Urbanas"},
        {nombre: "Black Ops One", familia: "Black Ops One", categoria: "Urbanas"},
        {nombre: "Bungee", familia: "Bungee", categoria: "Urbanas"},
        {nombre: "Luckiest Guy", familia: "Luckiest Guy", categoria: "Urbanas"},
        {nombre: "Playfair Display", familia: "Playfair Display", categoria: "Elegantes"},
        {nombre: "Abril Fatface", familia: "Abril Fatface", categoria: "Elegantes"},
        {nombre: "Cinzel", familia: "Cinzel", categoria: "Elegantes"},
        {nombre: "Cinzel Decorative", familia: "Cinzel Decorative", categoria: "Elegantes"},
        {nombre: "Cormorant Garamond", familia: "Cormorant Garamond", categoria: "Elegantes"},
        {nombre: "Georgia", familia: "Georgia", categoria: "Clásicas"},
        {nombre: "Courier New", familia: "Courier New", categoria: "Clásicas"},
        {nombre: "Roboto Slab", familia: "Roboto Slab", categoria: "Clásicas"},
        {nombre: "Great Vibes", familia: "Great Vibes", categoria: "Manuscritas"},
        {nombre: "Pacifico", familia: "Pacifico", categoria: "Manuscritas"},
        {nombre: "Lobster", familia: "Lobster", categoria: "Manuscritas"},
        {nombre: "Dancing Script", familia: "Dancing Script", categoria: "Manuscritas"},
        {nombre: "Satisfy", familia: "Satisfy", categoria: "Manuscritas"},
        {nombre: "Caveat", familia: "Caveat", categoria: "Manuscritas"},
        {nombre: "Kaushan Script", familia: "Kaushan Script", categoria: "Manuscritas"},
        {nombre: "Sacramento", familia: "Sacramento", categoria: "Manuscritas"},
        {nombre: "Orbitron", familia: "Orbitron", categoria: "Gamer"},
        {nombre: "Press Start 2P", familia: "Press Start 2P", categoria: "Gamer"},
        {nombre: "Chakra Petch", familia: "Chakra Petch", categoria: "Gamer"},
        {nombre: "Exo 2", familia: "Exo 2", categoria: "Gamer"},
        {nombre: "VT323", familia: "VT323", categoria: "Gamer"},
        {nombre: "Impact", familia: "Impact", categoria: "Impacto"}
    ];

    const coloresReferencia = [
        {nombre: "Blanco", hex: "#ffffff"},
        {nombre: "Negro", hex: "#111111"},
        {nombre: "Azul", hex: "#315ca8"},
        {nombre: "Rojo", hex: "#b82c3a"},
        {nombre: "Gris", hex: "#8d9299"},
        {nombre: "Beige", hex: "#d7c4a3"}
    ];

    const productoSelect = document.getElementById("productoSelect");
    const colorProducto = document.getElementById("colorProducto");
    const tallaProducto = document.getElementById("tallaProducto");
    const cantidadProducto = document.getElementById("cantidadProducto");
    const grupoTalla = document.getElementById("grupoTalla");
    const estadoSolicitud = document.getElementById("estadoSolicitud");
    const botonSolicitar = document.getElementById("btnSolicitar");
    const colorFondoLienzo = document.getElementById("colorFondoLienzo");
    const editarProductoBase = document.getElementById("editarProductoBase");
    const listaCapas = document.getElementById("listaCapas");
    const estadoBorrador = document.getElementById("estadoBorrador");

    let productos = [];
    let productoActual = null;
    let variantesColor = [];
    let galeriaProducto = [];
    let ladoActual = "frente";
    let cargandoEstado = false;
    let temporizadorHistorial = null;
    let temporizadorBorrador = null;
    let categoriaFuenteActiva = "Todas";
    let previewActual = {frente: null, espalda: null};
    let portapapelesObjeto = null;
    const estados = {frente: null, espalda: null};
    const historiales = {frente: [], espalda: []};
    const indicesHistorial = {frente: -1, espalda: -1};
    const baseImagenIndicePorLado = {frente: 0, espalda: 0};
    const vistaManualPorLado = {frente: false, espalda: false};

    configurarCanvas();
    renderizarSelectorFuentes();
    conectarEventos();
    cargarProductos();

    function configurarCanvas() {
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: "#8a2be2",
            cornerStrokeColor: "#ffffff",
            borderColor: "#8a2be2",
            cornerStyle: "circle",
            cornerSize: 12,
            padding: 5
        });

        ["selection:created", "selection:updated"].forEach(evento => canvas.on(evento, () => {
            sincronizarControlesObjeto();
            actualizarAvisoZona();
            renderizarCapas();
        }));
        canvas.on("selection:cleared", () => {
            sincronizarControlesObjeto();
            actualizarAvisoZona();
            renderizarCapas();
        });
        ["object:moving", "object:scaling", "object:rotating"].forEach(evento => canvas.on(evento, () => {
            sincronizarTransformacionSeleccionado();
            actualizarAvisoZona();
        }));
        ["object:added", "object:modified", "object:removed"].forEach(evento => {
            canvas.on(evento, () => {
                if (!cargandoEstado) programarHistorial();
                renderizarCapas();
                actualizarResumenDiseno();
            });
        });
        canvas.on("text:changed", () => {
            const objeto = obtenerObjetoActivo();
            if (esTexto(objeto)) document.getElementById("textoEditor").value = objeto.text || "";
            programarHistorial();
        });
    }

    function conectarEventos() {
        productoSelect.addEventListener("change", async () => {
            if (tieneElementosUsuario() && !confirm("Cambiar el producto base iniciará un diseño nuevo. Tu borrador actual seguirá guardado hasta que confirmes el cambio. ¿Continuar?")) {
                productoSelect.value = productoActual?.id ? String(productoActual.id) : "";
                return;
            }
            await aplicarProductoSeleccionado(true);
            programarBorrador();
        });

        tallaProducto.addEventListener("change", () => { actualizarResumen(); programarBorrador(); });
        cantidadProducto.addEventListener("input", () => {
            normalizarCantidad();
            actualizarResumen();
            programarBorrador();
        });
        colorFondoLienzo.addEventListener("input", () => {
            colorProducto.value = "Personalizado";
            document.getElementById("nombreColorLibre").textContent = colorFondoLienzo.value.toUpperCase();
            marcarColorSeleccionado("Personalizado");
            aplicarColorFondo();
            actualizarResumen();
            programarBorrador();
        });
        editarProductoBase.addEventListener("change", alternarEdicionBase);
        document.getElementById("btnRestablecerBase").addEventListener("click", restablecerProductoBase);

        document.getElementById("btnSubirImagen").addEventListener("click", () => document.getElementById("inputDiseno").click());
        document.getElementById("inputDiseno").addEventListener("change", importarImagen);
        document.getElementById("btnAgregarTexto").addEventListener("click", agregarTexto);
        document.querySelectorAll("[data-forma]").forEach(boton => boton.addEventListener("click", () => agregarForma(boton.dataset.forma)));

        document.getElementById("textoEditor").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("tamanoTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("colorTexto").addEventListener("input", () => {
            document.getElementById("valorColorTexto").textContent = document.getElementById("colorTexto").value.toUpperCase();
            actualizarTextoSeleccionado();
        });
        document.getElementById("espaciadoTexto").addEventListener("input", () => {
            document.getElementById("valorEspaciadoTexto").value = document.getElementById("espaciadoTexto").value;
            actualizarTextoSeleccionado();
        });
        document.getElementById("interlineadoTexto").addEventListener("input", () => {
            document.getElementById("valorInterlineadoTexto").value = Number(document.getElementById("interlineadoTexto").value).toFixed(2);
            actualizarTextoSeleccionado();
        });
        document.getElementById("colorContornoTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("grosorContornoTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("sombraTexto").addEventListener("change", () => {
            document.getElementById("opcionesSombraTexto").hidden = !document.getElementById("sombraTexto").checked;
            actualizarTextoSeleccionado();
        });
        document.getElementById("colorSombraTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("desenfoqueSombraTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("btnNegrita").addEventListener("click", () => alternarEstilo("fontWeight", "bold", "normal"));
        document.getElementById("btnCursiva").addEventListener("click", () => alternarEstilo("fontStyle", "italic", "normal"));
        document.getElementById("btnSubrayado").addEventListener("click", () => alternarBooleano("underline"));
        document.querySelectorAll("[data-alineacion]").forEach(boton => boton.addEventListener("click", () => aplicarAlineacionTexto(boton.dataset.alineacion)));
        document.getElementById("btnMayusculas").addEventListener("click", () => transformarTexto("mayusculas"));
        document.getElementById("btnMinusculas").addEventListener("click", () => transformarTexto("minusculas"));

        document.getElementById("btnAbrirFuentes").addEventListener("click", alternarSelectorFuentes);
        document.getElementById("buscarFuente").addEventListener("input", renderizarListaFuentes);
        document.addEventListener("click", evento => {
            const selector = document.getElementById("selectorFuentes");
            const boton = document.getElementById("btnAbrirFuentes");
            if (!selector.hidden && !selector.contains(evento.target) && !boton.contains(evento.target)) cerrarSelectorFuentes();
        });

        document.querySelectorAll("[data-filtro]").forEach(boton => boton.addEventListener("click", () => aplicarPresetImagen(boton.dataset.filtro)));
        ["brilloImagen", "contrasteImagen", "saturacionImagen"].forEach(id => document.getElementById(id).addEventListener("input", actualizarFiltrosImagen));
        document.getElementById("btnVoltearH").addEventListener("click", () => voltearImagen("flipX"));
        document.getElementById("btnVoltearV").addEventListener("click", () => voltearImagen("flipY"));

        ["rellenoForma", "bordeForma", "grosorBordeForma"].forEach(id => document.getElementById(id).addEventListener("input", actualizarFormaSeleccionada));

        document.getElementById("btnEliminar").addEventListener("click", eliminarSeleccionado);
        document.getElementById("btnDuplicar").addEventListener("click", duplicarSeleccionado);
        document.getElementById("btnCentrarH").addEventListener("click", () => centrarSeleccionado("horizontal"));
        document.getElementById("btnCentrarV").addEventListener("click", () => centrarSeleccionado("vertical"));
        document.getElementById("btnAdelante").addEventListener("click", () => moverCapa("adelante"));
        document.getElementById("btnAtras").addEventListener("click", () => moverCapa("atras"));
        document.getElementById("btnEncajarZona").addEventListener("click", encajarEnZona);
        document.getElementById("opacidadObjeto").addEventListener("input", actualizarTransformacion);
        document.getElementById("rotacionObjeto").addEventListener("input", actualizarTransformacion);
        document.getElementById("bloquearObjeto").addEventListener("change", alternarBloqueoObjeto);

        document.getElementById("btnFrente").addEventListener("click", () => cambiarLado("frente"));
        document.getElementById("btnEspalda").addEventListener("click", () => cambiarLado("espalda"));
        document.getElementById("btnDeshacer").addEventListener("click", deshacer);
        document.getElementById("btnRehacer").addEventListener("click", rehacer);
        document.getElementById("btnLimpiar").addEventListener("click", limpiarLado);
        document.getElementById("btnGuias").addEventListener("click", alternarGuias);
        document.getElementById("btnPantallaCompleta").addEventListener("click", alternarPantallaCompleta);
        document.getElementById("btnNuevoDiseno").addEventListener("click", nuevoDiseno);
        document.getElementById("btnVistaPrevia").addEventListener("click", abrirVistaPrevia);
        botonSolicitar.addEventListener("click", enviarSolicitud);
        document.getElementById("btnEnviarDesdePreview").addEventListener("click", enviarSolicitud);
        document.querySelectorAll("[data-cerrar-preview]").forEach(el => el.addEventListener("click", cerrarVistaPrevia));
        document.querySelectorAll("[data-descargar-lado]").forEach(el => el.addEventListener("click", () => descargarPreview(el.dataset.descargarLado)));

        document.getElementById("notasPedido").addEventListener("input", () => {
            document.getElementById("contadorNotas").textContent = `${document.getElementById("notasPedido").value.length}/800`;
            programarBorrador();
        });

        listaCapas.addEventListener("click", manejarClickCapa);
        configurarArrastrarSoltar();
        configurarAtajosTeclado();
        document.addEventListener("fullscreenchange", actualizarBotonPantallaCompleta);
    }

    async function cargarProductos() {
        productoSelect.innerHTML = '<option value="" selected>Lienzo libre (sin producto base)</option>';
        botonSolicitar.disabled = false;
        try {
            const respuesta = await fetchConReintentos(`${API_URL}/productos/personalizables`, {cache: "no-store"}, 3, 1300);
            if (!respuesta.ok) throw new Error("No se pudieron cargar los productos personalizables");
            productos = await respuesta.json();
            productoSelect.insertAdjacentHTML("beforeend", productos
                .map(p => `<option value="${p.id}">${escapar(p.nombre)}</option>`).join(""));
        } catch (error) {
            console.warn(error);
            mostrarEstado("Puedes diseñar en lienzo libre. Los productos base no pudieron cargarse por ahora.", false);
        }

        const restaurado = await restaurarBorrador();
        if (!restaurado) {
            productoSelect.value = "";
            await aplicarProductoSeleccionado(true);
        }
    }

    async function aplicarProductoSeleccionado(reiniciarDiseno = true) {
        productoActual = productos.find(p => String(p.id) === String(productoSelect.value)) || null;
        if (reiniciarDiseno) reiniciarEstadosEditor();
        editarProductoBase.checked = false;
        editarProductoBase.disabled = !productoActual;
        document.getElementById("btnRestablecerBase").disabled = !productoActual;

        await prepararProductoActual();
        ladoActual = "frente";
        actualizarBotonesLado();
        await cargarLado("frente", true);
        actualizarResumen();
        actualizarResumenDiseno();
    }

    function reiniciarEstadosEditor() {
        estados.frente = null;
        estados.espalda = null;
        historiales.frente = [];
        historiales.espalda = [];
        indicesHistorial.frente = -1;
        indicesHistorial.espalda = -1;
        baseImagenIndicePorLado.frente = 0;
        baseImagenIndicePorLado.espalda = 0;
        vistaManualPorLado.frente = false;
        vistaManualPorLado.espalda = false;
    }

    async function prepararProductoActual() {
        variantesColor = productoActual ? obtenerVariantesColorProducto(productoActual) : [];
        galeriaProducto = [];
        if (productoActual) {
            try { galeriaProducto = await obtenerGaleriaProducto(productoActual); }
            catch { galeriaProducto = [obtenerUrlImagen(productoActual.imagen)].filter(Boolean); }
        }

        await renderizarColoresProducto();
        renderizarTallasProducto();
        renderizarVistasProducto();
        actualizarStockPersonalizable();
    }

    async function renderizarColoresProducto() {
        const contenedor = document.getElementById("coloresProductoVisual");
        const grupoColorLibre = document.getElementById("grupoColorLibre");
        let opciones = variantesColor.length
            ? variantesColor.map(v => ({nombre: v.nombre, hex: v.codigoHex, stock: v.stock, clave: v.clave, variante: true}))
            : coloresReferencia.map(c => ({...c, variante: false}));

        contenedor.innerHTML = opciones.map((color, indice) => `
            <button type="button" class="color-visual${color.stock === 0 ? " agotado" : ""}" data-color="${escapar(color.nombre)}" data-hex="${color.hex}" data-clave="${color.clave || ""}" data-variante="${color.variante}" ${color.stock === 0 ? "disabled" : ""} aria-label="${escapar(color.nombre)}">
                <span class="swatch" style="--swatch:${color.hex}"></span>
                <span>${escapar(color.nombre)}</span>
                ${color.variante ? `<small>${color.stock > 0 ? `${color.stock} disp.` : "Agotado"}</small>` : ""}
            </button>`).join("");

        contenedor.querySelectorAll(".color-visual:not(:disabled)").forEach(boton => boton.addEventListener("click", () => seleccionarColorVisual(boton)));
        grupoColorLibre.hidden = variantesColor.length > 0;

        const primero = contenedor.querySelector(".color-visual:not(:disabled)");
        if (primero) await seleccionarColorVisual(primero, true);
        else {
            colorProducto.value = productoActual ? "POR_DEFINIR" : "Blanco";
            colorFondoLienzo.value = "#ffffff";
        }
    }

    async function seleccionarColorVisual(boton, silencioso = false) {
        const nombre = boton.dataset.color;
        const hex = boton.dataset.hex || "#ffffff";
        const esVariante = boton.dataset.variante === "true";
        colorProducto.value = nombre;
        marcarColorSeleccionado(nombre);

        if (esVariante) {
            try {
                galeriaProducto = await obtenerGaleriaVarianteProducto(productoActual, nombre);
            } catch {
                galeriaProducto = [obtenerUrlImagen(productoActual?.imagen)].filter(Boolean);
            }
            baseImagenIndicePorLado.frente = 0;
            baseImagenIndicePorLado.espalda = galeriaProducto.length > 1 ? 1 : 0;
            vistaManualPorLado.frente = false;
            vistaManualPorLado.espalda = false;
            renderizarVistasProducto();
            if (!silencioso) await reemplazarBaseSiCorresponde();
        } else {
            colorFondoLienzo.value = hex;
            document.getElementById("nombreColorLibre").textContent = nombre;
            if (!silencioso) aplicarColorFondo();
        }

        actualizarStockPersonalizable();
        actualizarResumen();
        if (!silencioso) programarBorrador();
    }

    function marcarColorSeleccionado(nombre) {
        document.querySelectorAll("#coloresProductoVisual .color-visual").forEach(boton => {
            const activo = normalizarTexto(boton.dataset.color) === normalizarTexto(nombre);
            boton.classList.toggle("activo", activo);
            boton.setAttribute("aria-pressed", String(activo));
        });
    }

    function renderizarTallasProducto() {
        const usaTalla = productoActual && productoUsaTalla(productoActual?.categoria, productoActual?.nombre);
        grupoTalla.hidden = !usaTalla;
        if (!usaTalla) {
            tallaProducto.innerHTML = '<option value="UNIDAD">Unidad</option>';
            return;
        }
        const tallas = obtenerTallasProducto(productoActual);
        tallaProducto.innerHTML = tallas.map(t => `<option value="${t}">${t}</option>`).join("");
        if (tallas.includes("M")) tallaProducto.value = "M";
    }

    function renderizarVistasProducto() {
        const grupo = document.getElementById("grupoVistasProducto");
        const contenedor = document.getElementById("vistasProductoBase");
        if (!productoActual || galeriaProducto.length <= 1) {
            grupo.hidden = true;
            contenedor.innerHTML = "";
            return;
        }
        grupo.hidden = false;
        const seleccionado = baseImagenIndicePorLado[ladoActual];
        contenedor.innerHTML = galeriaProducto.map((url, indice) => `
            <button type="button" class="vista-producto${indice === seleccionado ? " activo" : ""}" data-indice="${indice}" title="Usar imagen ${indice + 1} como ${ladoActual}">
                <img src="${escapar(url)}" alt="Vista ${indice + 1} del producto" loading="lazy">
                <span>${indice + 1}</span>
            </button>`).join("");
        contenedor.querySelectorAll(".vista-producto").forEach(boton => boton.addEventListener("click", async () => {
            baseImagenIndicePorLado[ladoActual] = Number(boton.dataset.indice);
            vistaManualPorLado[ladoActual] = true;
            renderizarVistasProducto();
            await reemplazarBaseSiCorresponde();
            registrarHistorialAhora();
            programarBorrador();
        }));
    }

    function actualizarStockPersonalizable() {
        const texto = document.getElementById("stockPersonalizable");
        if (!productoActual) {
            texto.hidden = true;
            cantidadProducto.max = 50;
            return;
        }
        let stock = Math.max(0, Number(productoActual.stock || 0));
        if (variantesColor.length) stock = obtenerStockColorProducto(productoActual, colorProducto.value);
        cantidadProducto.max = Math.max(1, Math.min(50, stock || 1));
        if (Number(cantidadProducto.value) > Number(cantidadProducto.max)) cantidadProducto.value = cantidadProducto.max;
        texto.hidden = false;
        texto.textContent = stock > 0 ? `${stock} unidad${stock === 1 ? "" : "es"} disponible${stock === 1 ? "" : "s"}${variantesColor.length ? ` en ${colorProducto.value}` : ""}.` : "Esta variante no tiene stock disponible.";
        texto.classList.toggle("agotado", stock <= 0);
    }

    function normalizarCantidad() {
        let valor = Number(cantidadProducto.value || 1);
        const max = Number(cantidadProducto.max || 50);
        valor = Math.max(1, Math.min(max, Math.round(valor)));
        cantidadProducto.value = String(valor);
    }

    function urlBaseDeseada() {
        if (!productoActual) return null;
        return galeriaProducto[baseImagenIndicePorLado[ladoActual]] || obtenerUrlImagen(productoActual.imagen);
    }

    async function asegurarProductoBase() {
        canvas.setBackgroundColor(colorFondoLienzo.value, canvas.renderAll.bind(canvas));
        const deseada = urlBaseDeseada();
        let base = obtenerProductoBase();

        if (!productoActual || !deseada) {
            if (base) canvas.remove(base);
            return;
        }

        if (base) {
            const actual = typeof base.getSrc === "function" ? base.getSrc() : base._element?.src;
            if (actual && normalizarUrl(actual) !== normalizarUrl(deseada)) {
                await reemplazarProductoBase(deseada, base);
                base = obtenerProductoBase();
            }
            if (base) {
                configurarInteraccionBase(base);
                canvas.sendToBack(base);
            }
            return;
        }
        await reemplazarProductoBase(deseada, null);
    }

    async function reemplazarBaseSiCorresponde() {
        if (!productoActual) return;
        const base = obtenerProductoBase();
        await reemplazarProductoBase(urlBaseDeseada(), base);
        canvas.requestRenderAll();
    }

    async function reemplazarProductoBase(url, anterior) {
        if (!url) return;
        const transformacion = anterior ? {
            left: anterior.left, top: anterior.top, scaleX: anterior.scaleX, scaleY: anterior.scaleY,
            angle: anterior.angle, flipX: anterior.flipX, flipY: anterior.flipY,
            originX: anterior.originX || "center", originY: anterior.originY || "center"
        } : null;
        if (anterior) canvas.remove(anterior);

        await new Promise(resolve => {
            fabric.Image.fromURL(url, imagen => {
                if (!imagen) return resolve();
                imagen.set({dataTipo: "producto-base", crossOrigin: "anonymous", originX: "center", originY: "center"});
                if (transformacion) imagen.set(transformacion);
                else {
                    imagen.set({left: canvas.width / 2, top: canvas.height / 2});
                    const escala = Math.min((canvas.width * 0.92) / imagen.width, (canvas.height * 0.92) / imagen.height);
                    imagen.scale(Number.isFinite(escala) && escala > 0 ? escala : 1);
                }
                canvas.add(imagen);
                configurarInteraccionBase(imagen);
                canvas.sendToBack(imagen);
                imagen.setCoords();
                canvas.renderAll();
                resolve();
            }, {crossOrigin: "anonymous"});
        });
    }

    function normalizarUrl(url) {
        try { return new URL(url, location.href).href; } catch { return String(url || ""); }
    }

    function obtenerProductoBase() {
        return canvas.getObjects().find(objeto => objeto.dataTipo === "producto-base") || null;
    }

    function configurarInteraccionBase(base) {
        const editable = Boolean(editarProductoBase.checked);
        base.set({
            selectable: editable,
            evented: editable,
            lockMovementX: !editable,
            lockMovementY: !editable,
            lockScalingX: !editable,
            lockScalingY: !editable,
            lockRotation: !editable,
            hasControls: editable,
            hoverCursor: editable ? "move" : "default"
        });
        base.setCoords();
    }

    function alternarEdicionBase() {
        const base = obtenerProductoBase();
        if (!base) return;
        configurarInteraccionBase(base);
        if (editarProductoBase.checked) canvas.setActiveObject(base); else canvas.discardActiveObject();
        canvas.requestRenderAll();
    }

    function restablecerProductoBase() {
        const base = obtenerProductoBase();
        if (!base) return;
        const escala = Math.min((canvas.width * 0.92) / base.width, (canvas.height * 0.92) / base.height);
        base.set({left: canvas.width / 2, top: canvas.height / 2, angle: 0, scaleX: escala, scaleY: escala, flipX: false, flipY: false});
        canvas.sendToBack(base);
        base.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function aplicarColorFondo() {
        canvas.setBackgroundColor(colorFondoLienzo.value, canvas.renderAll.bind(canvas));
        if (!cargandoEstado) registrarHistorialAhora();
    }

    function guardarEstadoActual(actualizarHistorial = false) {
        estados[ladoActual] = JSON.stringify(canvas.toJSON(PROPIEDADES_SERIALIZABLES));
        if (actualizarHistorial) registrarHistorialAhora();
    }

    async function cargarLado(lado, inicial = false) {
        cargandoEstado = true;
        const estado = estados[lado];
        if (estado) await new Promise(resolve => canvas.loadFromJSON(estado, resolve));
        else canvas.clear();
        await asegurarProductoBase();
        canvas.getObjects().forEach(objeto => aplicarEstadoBloqueo(objeto));
        canvas.discardActiveObject();
        canvas.renderAll();
        cargandoEstado = false;
        if (inicial || historiales[lado].length === 0) registrarHistorialAhora();
        renderizarCapas();
        actualizarResumenDiseno();
        renderizarVistasProducto();
        sincronizarControlesObjeto();
    }

    async function cambiarLado(nuevoLado) {
        if (nuevoLado === ladoActual) return;
        guardarEstadoActual();
        ladoActual = nuevoLado;
        actualizarBotonesLado();
        await cargarLado(nuevoLado);
        programarBorrador();
    }

    function actualizarBotonesLado() {
        document.getElementById("btnFrente").classList.toggle("lado-activo", ladoActual === "frente");
        document.getElementById("btnEspalda").classList.toggle("lado-activo", ladoActual === "espalda");
    }

    async function importarImagen(evento) {
        const archivo = evento.target.files?.[0];
        evento.target.value = "";
        if (archivo) await procesarArchivoImagen(archivo);
    }

    async function procesarArchivoImagen(archivo) {
        const tipos = ["image/png", "image/jpeg", "image/webp"];
        if (!tipos.includes(archivo.type)) return alert("Solo se permiten PNG, JPG/JPEG o WEBP. No se permite SVG.");
        if (archivo.size > 5 * 1024 * 1024) return alert("La imagen debe pesar como máximo 5 MB.");
        try {
            const validada = await leerImagenValidada(archivo);
            fabric.Image.fromURL(validada.dataUrl, imagen => {
                const calidad = calcularCalidadImagen(validada.width, validada.height);
                imagen.set({
                    originX: "center", originY: "center",
                    left: ZONA_IMPRESION.left + ZONA_IMPRESION.width / 2,
                    top: ZONA_IMPRESION.top + ZONA_IMPRESION.height / 2,
                    dataTipo: "imagen-usuario",
                    dataNombre: archivo.name,
                    dataCalidad: calidad,
                    dataDimensionesOriginales: {width: validada.width, height: validada.height},
                    dataAjustes: {preset: "normal", brillo: 0, contraste: 0, saturacion: 0}
                });
                const maxAncho = ZONA_IMPRESION.width * 0.82;
                const maxAlto = ZONA_IMPRESION.height * 0.82;
                const escala = Math.min(maxAncho / imagen.width, maxAlto / imagen.height, 1);
                imagen.scale(Number.isFinite(escala) && escala > 0 ? escala : 1);
                canvas.add(imagen);
                canvas.setActiveObject(imagen);
                canvas.requestRenderAll();
                sincronizarControlesObjeto();
                registrarHistorialAhora();
            });
        } catch (error) {
            alert(error.message);
        }
    }

    function leerImagenValidada(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
            lector.onload = () => {
                const imagen = new Image();
                imagen.onerror = () => reject(new Error("El archivo no contiene una imagen válida"));
                imagen.onload = () => {
                    if (imagen.width > 6000 || imagen.height > 6000 || imagen.width * imagen.height > 24000000) {
                        return reject(new Error("La imagen tiene dimensiones demasiado grandes"));
                    }
                    resolve({dataUrl: lector.result, width: imagen.width, height: imagen.height});
                };
                imagen.src = lector.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    function calcularCalidadImagen(ancho, alto) {
        const menor = Math.min(ancho, alto);
        if (menor >= 1600) return "alta";
        if (menor >= 900) return "media";
        return "baja";
    }

    async function agregarTexto() {
        const contenido = document.getElementById("textoEditor").value.trim() || "Tu texto";
        const familia = document.getElementById("fuenteTexto").value || "Montserrat";
        await cargarFuente(familia);
        const texto = new fabric.Textbox(contenido, {
            originX: "center", originY: "center",
            left: ZONA_IMPRESION.left + ZONA_IMPRESION.width / 2,
            top: ZONA_IMPRESION.top + ZONA_IMPRESION.height / 2,
            width: ZONA_IMPRESION.width * 0.85,
            fontFamily: familia,
            fontSize: Number(document.getElementById("tamanoTexto").value) || 38,
            fill: document.getElementById("colorTexto").value,
            textAlign: "center",
            lineHeight: Number(document.getElementById("interlineadoTexto").value) || 1.16,
            charSpacing: Number(document.getElementById("espaciadoTexto").value) || 0,
            dataTipo: "texto-usuario",
            dataNombre: contenido.slice(0, 40)
        });
        canvas.add(texto);
        canvas.setActiveObject(texto);
        canvas.requestRenderAll();
        sincronizarControlesObjeto();
        registrarHistorialAhora();
    }

    function agregarForma(tipo) {
        const fill = document.getElementById("colorForma").value;
        let forma;
        const centro = {left: ZONA_IMPRESION.left + ZONA_IMPRESION.width / 2, top: ZONA_IMPRESION.top + ZONA_IMPRESION.height / 2};
        if (tipo === "circulo") {
            forma = new fabric.Circle({radius: 62, fill, ...centro, originX: "center", originY: "center"});
        } else if (tipo === "estrella") {
            forma = new fabric.Polygon(crearPuntosEstrella(5, 72, 34), {fill, ...centro, originX: "center", originY: "center"});
        } else if (tipo === "linea") {
            forma = new fabric.Line([-80, 0, 80, 0], {stroke: fill, strokeWidth: 8, ...centro, originX: "center", originY: "center"});
        } else {
            forma = new fabric.Rect({width: 150, height: 95, rx: 12, ry: 12, fill, ...centro, originX: "center", originY: "center"});
        }
        forma.set({dataTipo: "forma-usuario", dataNombre: `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`});
        canvas.add(forma);
        canvas.setActiveObject(forma);
        canvas.requestRenderAll();
        sincronizarControlesObjeto();
        registrarHistorialAhora();
    }

    function crearPuntosEstrella(puntas, radioExterior, radioInterior) {
        const puntos = [];
        for (let i = 0; i < puntas * 2; i++) {
            const radio = i % 2 === 0 ? radioExterior : radioInterior;
            const angulo = -Math.PI / 2 + i * Math.PI / puntas;
            puntos.push({x: Math.cos(angulo) * radio, y: Math.sin(angulo) * radio});
        }
        return puntos;
    }

    function obtenerObjetoActivo() { return canvas.getActiveObject(); }
    function esTexto(objeto) { return Boolean(objeto && ["i-text", "text", "textbox"].includes(objeto.type)); }
    function esImagenUsuario(objeto) { return Boolean(objeto && objeto.type === "image" && objeto.dataTipo === "imagen-usuario"); }
    function esForma(objeto) { return Boolean(objeto && objeto.dataTipo === "forma-usuario"); }

    async function actualizarTextoSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!esTexto(objeto)) return;
        const familia = document.getElementById("fuenteTexto").value || objeto.fontFamily || "Montserrat";
        await cargarFuente(familia);
        const usarSombra = document.getElementById("sombraTexto").checked;
        objeto.set({
            text: document.getElementById("textoEditor").value,
            fontFamily: familia,
            fontSize: Number(document.getElementById("tamanoTexto").value) || objeto.fontSize,
            fill: document.getElementById("colorTexto").value,
            charSpacing: Number(document.getElementById("espaciadoTexto").value) || 0,
            lineHeight: Number(document.getElementById("interlineadoTexto").value) || 1.16,
            stroke: Number(document.getElementById("grosorContornoTexto").value) > 0 ? document.getElementById("colorContornoTexto").value : null,
            strokeWidth: Number(document.getElementById("grosorContornoTexto").value) || 0,
            shadow: usarSombra ? new fabric.Shadow({
                color: `${document.getElementById("colorSombraTexto").value}99`,
                blur: Number(document.getElementById("desenfoqueSombraTexto").value) || 0,
                offsetX: 4, offsetY: 4
            }) : null,
            dataNombre: (document.getElementById("textoEditor").value || "Texto").slice(0, 40)
        });
        objeto.setCoords();
        canvas.requestRenderAll();
        programarHistorial();
        renderizarCapas();
    }

    function alternarEstilo(propiedad, activo, inactivo) {
        const objeto = obtenerObjetoActivo();
        if (!esTexto(objeto)) return;
        objeto.set(propiedad, objeto[propiedad] === activo ? inactivo : activo);
        canvas.requestRenderAll();
        actualizarEstadoBotonesTexto(objeto);
        registrarHistorialAhora();
    }

    function alternarBooleano(propiedad) {
        const objeto = obtenerObjetoActivo();
        if (!esTexto(objeto)) return;
        objeto.set(propiedad, !objeto[propiedad]);
        canvas.requestRenderAll();
        actualizarEstadoBotonesTexto(objeto);
        registrarHistorialAhora();
    }

    function aplicarAlineacionTexto(alineacion) {
        const objeto = obtenerObjetoActivo();
        if (!esTexto(objeto)) return;
        objeto.set("textAlign", alineacion);
        canvas.requestRenderAll();
        actualizarEstadoBotonesTexto(objeto);
        registrarHistorialAhora();
    }

    function transformarTexto(tipo) {
        const objeto = obtenerObjetoActivo();
        const input = document.getElementById("textoEditor");
        const base = esTexto(objeto) ? objeto.text : input.value;
        const transformado = tipo === "mayusculas" ? base.toUpperCase() : base.toLowerCase();
        input.value = transformado;
        if (esTexto(objeto)) {
            objeto.set({text: transformado, dataNombre: transformado.slice(0, 40)});
            canvas.requestRenderAll();
            registrarHistorialAhora();
            renderizarCapas();
        }
    }

    function renderizarSelectorFuentes() {
        const categorias = ["Todas", ...new Set(fuentes.map(f => f.categoria))];
        document.getElementById("categoriasFuentes").innerHTML = categorias.map(c => `<button type="button" data-categoria="${c}" class="${c === categoriaFuenteActiva ? "activo" : ""}">${c}</button>`).join("");
        document.getElementById("categoriasFuentes").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
            categoriaFuenteActiva = b.dataset.categoria;
            renderizarSelectorFuentes();
            renderizarListaFuentes();
        }));
        renderizarListaFuentes();
    }

    function renderizarListaFuentes() {
        const busqueda = normalizarTexto(document.getElementById("buscarFuente")?.value || "");
        const seleccionada = document.getElementById("fuenteTexto").value || "Montserrat";
        const filtradas = fuentes.filter(f => (categoriaFuenteActiva === "Todas" || f.categoria === categoriaFuenteActiva) && (!busqueda || normalizarTexto(f.nombre).includes(busqueda)));
        document.getElementById("listaFuentes").innerHTML = filtradas.length ? filtradas.map(f => `
            <button type="button" class="opcion-fuente${f.familia === seleccionada ? " activa" : ""}" data-fuente="${escapar(f.familia)}" role="option" aria-selected="${f.familia === seleccionada}">
                <span class="preview-fuente" style="font-family:'${escapar(f.familia)}',sans-serif">PixBen Aa</span>
                <span class="meta-fuente"><b>${escapar(f.nombre)}</b><small>${escapar(f.categoria)}</small></span>
                ${f.familia === seleccionada ? '<i class="fa-solid fa-check"></i>' : ""}
            </button>`).join("") : '<p class="sin-fuentes">No encontramos fuentes con ese nombre.</p>';
        document.getElementById("listaFuentes").querySelectorAll("[data-fuente]").forEach(b => b.addEventListener("click", () => seleccionarFuente(b.dataset.fuente)));
    }

    async function seleccionarFuente(familia) {
        document.getElementById("fuenteTexto").value = familia;
        document.getElementById("nombreFuenteActual").textContent = familia;
        document.getElementById("muestraFuenteActual").style.fontFamily = `'${familia}', sans-serif`;
        await cargarFuente(familia);
        renderizarListaFuentes();
        await actualizarTextoSeleccionado();
        cerrarSelectorFuentes();
    }

    function alternarSelectorFuentes() {
        const selector = document.getElementById("selectorFuentes");
        selector.hidden = !selector.hidden;
        document.getElementById("btnAbrirFuentes").setAttribute("aria-expanded", String(!selector.hidden));
        if (!selector.hidden) setTimeout(() => document.getElementById("buscarFuente").focus(), 30);
    }

    function cerrarSelectorFuentes() {
        document.getElementById("selectorFuentes").hidden = true;
        document.getElementById("btnAbrirFuentes").setAttribute("aria-expanded", "false");
    }

    async function cargarFuente(familia) {
        if (!document.fonts?.load) return;
        try { await document.fonts.load(`32px "${familia}"`); } catch { /* fallback del navegador */ }
    }

    function sincronizarControlesObjeto() {
        const objeto = obtenerObjetoActivo();
        document.getElementById("grupoImagen").hidden = !esImagenUsuario(objeto);
        document.getElementById("grupoForma").hidden = !esForma(objeto);
        if (!objeto) {
            document.getElementById("bloquearObjeto").checked = false;
            actualizarAvisoZona();
            return;
        }
        sincronizarTransformacionSeleccionado();
        document.getElementById("bloquearObjeto").checked = Boolean(objeto.dataBloqueado);

        if (esTexto(objeto)) {
            document.getElementById("textoEditor").value = objeto.text || "";
            document.getElementById("fuenteTexto").value = objeto.fontFamily || "Montserrat";
            document.getElementById("nombreFuenteActual").textContent = objeto.fontFamily || "Montserrat";
            document.getElementById("muestraFuenteActual").style.fontFamily = `'${objeto.fontFamily || "Montserrat"}', sans-serif`;
            document.getElementById("tamanoTexto").value = Math.round(objeto.fontSize || 38);
            document.getElementById("colorTexto").value = colorHexValido(objeto.fill) ? objeto.fill : "#111111";
            document.getElementById("valorColorTexto").textContent = document.getElementById("colorTexto").value.toUpperCase();
            document.getElementById("espaciadoTexto").value = objeto.charSpacing || 0;
            document.getElementById("valorEspaciadoTexto").value = objeto.charSpacing || 0;
            document.getElementById("interlineadoTexto").value = objeto.lineHeight || 1.16;
            document.getElementById("valorInterlineadoTexto").value = Number(objeto.lineHeight || 1.16).toFixed(2);
            document.getElementById("colorContornoTexto").value = colorHexValido(objeto.stroke) ? objeto.stroke : "#ffffff";
            document.getElementById("grosorContornoTexto").value = objeto.strokeWidth || 0;
            document.getElementById("sombraTexto").checked = Boolean(objeto.shadow);
            document.getElementById("opcionesSombraTexto").hidden = !objeto.shadow;
            actualizarEstadoBotonesTexto(objeto);
        }

        if (esImagenUsuario(objeto)) sincronizarControlesImagen(objeto);
        if (esForma(objeto)) sincronizarControlesForma(objeto);
    }

    function actualizarEstadoBotonesTexto(objeto) {
        document.getElementById("btnNegrita").classList.toggle("activo", objeto?.fontWeight === "bold");
        document.getElementById("btnCursiva").classList.toggle("activo", objeto?.fontStyle === "italic");
        document.getElementById("btnSubrayado").classList.toggle("activo", Boolean(objeto?.underline));
        document.querySelectorAll("[data-alineacion]").forEach(b => b.classList.toggle("activo", b.dataset.alineacion === (objeto?.textAlign || "left")));
    }

    function sincronizarTransformacionSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        const opacidad = Math.round((objeto.opacity ?? 1) * 100);
        const rotacion = Math.round(objeto.angle ?? 0);
        document.getElementById("opacidadObjeto").value = opacidad;
        document.getElementById("valorOpacidadObjeto").value = `${opacidad}%`;
        document.getElementById("rotacionObjeto").value = rotacion;
        document.getElementById("valorRotacionObjeto").value = `${rotacion}°`;
    }

    function sincronizarControlesImagen(objeto) {
        const ajustes = {...{preset: "normal", brillo: 0, contraste: 0, saturacion: 0}, ...(objeto.dataAjustes || {})};
        document.getElementById("brilloImagen").value = ajustes.brillo;
        document.getElementById("contrasteImagen").value = ajustes.contraste;
        document.getElementById("saturacionImagen").value = ajustes.saturacion;
        actualizarOutputsFiltros(ajustes);
        document.querySelectorAll("[data-filtro]").forEach(b => b.classList.toggle("activo", b.dataset.filtro === ajustes.preset));
        const d = objeto.dataDimensionesOriginales || {};
        const calidad = objeto.dataCalidad || "media";
        document.getElementById("calidadImagen").innerHTML = `<i class="fa-solid ${calidad === "alta" ? "fa-circle-check" : calidad === "media" ? "fa-circle-info" : "fa-triangle-exclamation"}"></i><div><b>Calidad ${calidad}</b><span>${d.width && d.height ? `${d.width} × ${d.height} px` : "Imagen cargada"}${calidad === "baja" ? " · Podría pixelarse al imprimir grande." : ""}</span></div>`;
        document.getElementById("calidadImagen").className = `calidad-imagen ${calidad}`;
    }

    function sincronizarControlesForma(objeto) {
        document.getElementById("rellenoForma").value = colorHexValido(objeto.fill) ? objeto.fill : "#8a2be2";
        document.getElementById("bordeForma").value = colorHexValido(objeto.stroke) ? objeto.stroke : "#111111";
        document.getElementById("grosorBordeForma").value = objeto.strokeWidth || 0;
    }

    function colorHexValido(valor) { return /^#[0-9a-f]{6}$/i.test(String(valor || "")); }

    function aplicarPresetImagen(preset) {
        const objeto = obtenerObjetoActivo();
        if (!esImagenUsuario(objeto)) return;
        objeto.dataAjustes = {...{preset: "normal", brillo: 0, contraste: 0, saturacion: 0}, ...(objeto.dataAjustes || {}), preset};
        aplicarFiltrosFabric(objeto);
        sincronizarControlesImagen(objeto);
        registrarHistorialAhora();
    }

    function actualizarFiltrosImagen() {
        const objeto = obtenerObjetoActivo();
        if (!esImagenUsuario(objeto)) return;
        objeto.dataAjustes = {
            ...{preset: "normal"}, ...(objeto.dataAjustes || {}),
            brillo: Number(document.getElementById("brilloImagen").value),
            contraste: Number(document.getElementById("contrasteImagen").value),
            saturacion: Number(document.getElementById("saturacionImagen").value)
        };
        aplicarFiltrosFabric(objeto);
        actualizarOutputsFiltros(objeto.dataAjustes);
        programarHistorial();
    }

    function actualizarOutputsFiltros(ajustes) {
        document.getElementById("valorBrilloImagen").value = Number(ajustes.brillo || 0).toFixed(2);
        document.getElementById("valorContrasteImagen").value = Number(ajustes.contraste || 0).toFixed(2);
        document.getElementById("valorSaturacionImagen").value = Number(ajustes.saturacion || 0).toFixed(2);
    }

    function aplicarFiltrosFabric(objeto) {
        const ajustes = objeto.dataAjustes || {};
        const filtros = [];
        if (ajustes.preset === "bn") filtros.push(new fabric.Image.filters.Grayscale());
        if (ajustes.preset === "sepia") filtros.push(new fabric.Image.filters.Sepia());
        if (Number(ajustes.brillo)) filtros.push(new fabric.Image.filters.Brightness({brightness: Number(ajustes.brillo)}));
        if (Number(ajustes.contraste)) filtros.push(new fabric.Image.filters.Contrast({contrast: Number(ajustes.contraste)}));
        if (Number(ajustes.saturacion)) filtros.push(new fabric.Image.filters.Saturation({saturation: Number(ajustes.saturacion)}));
        objeto.filters = filtros;
        objeto.applyFilters();
        canvas.requestRenderAll();
    }

    function voltearImagen(propiedad) {
        const objeto = obtenerObjetoActivo();
        if (!esImagenUsuario(objeto)) return;
        objeto.set(propiedad, !objeto[propiedad]);
        objeto.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function actualizarFormaSeleccionada() {
        const objeto = obtenerObjetoActivo();
        if (!esForma(objeto)) return;
        const grosor = Number(document.getElementById("grosorBordeForma").value || 0);
        objeto.set({
            fill: document.getElementById("rellenoForma").value,
            stroke: grosor > 0 ? document.getElementById("bordeForma").value : null,
            strokeWidth: grosor
        });
        canvas.requestRenderAll();
        programarHistorial();
    }

    function eliminarSeleccionado() {
        const objetos = canvas.getActiveObjects();
        const eliminables = objetos.filter(objeto => objeto.dataTipo !== "producto-base");
        if (!eliminables.length && objetos.length) return alert("La prenda base no se elimina. Puedes restablecerla o bloquearla.");
        eliminables.forEach(objeto => canvas.remove(objeto));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function duplicarSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        objeto.clone(clon => {
            clon.set({left: (objeto.left || 0) + 18, top: (objeto.top || 0) + 18, dataBloqueado: false});
            aplicarEstadoBloqueo(clon);
            canvas.add(clon);
            canvas.setActiveObject(clon);
            canvas.requestRenderAll();
            registrarHistorialAhora();
        }, PROPIEDADES_SERIALIZABLES);
    }


    function copiarSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        objeto.clone(clon => { portapapelesObjeto = clon; }, PROPIEDADES_SERIALIZABLES);
    }

    function pegarSeleccionado() {
        if (!portapapelesObjeto) return;
        portapapelesObjeto.clone(clon => {
            clon.set({left: (portapapelesObjeto.left || 0) + 18, top: (portapapelesObjeto.top || 0) + 18, dataBloqueado: false});
            aplicarEstadoBloqueo(clon);
            canvas.add(clon);
            canvas.setActiveObject(clon);
            portapapelesObjeto = clon;
            canvas.requestRenderAll();
            registrarHistorialAhora();
        }, PROPIEDADES_SERIALIZABLES);
    }

    function centrarSeleccionado(eje) {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        if (eje === "horizontal") objeto.set("left", ZONA_IMPRESION.left + ZONA_IMPRESION.width / 2);
        else objeto.set("top", ZONA_IMPRESION.top + ZONA_IMPRESION.height / 2);
        objeto.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
        actualizarAvisoZona();
    }

    function encajarEnZona() {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        const ancho = objeto.getScaledWidth();
        const alto = objeto.getScaledHeight();
        const factor = Math.min((ZONA_IMPRESION.width * 0.9) / ancho, (ZONA_IMPRESION.height * 0.9) / alto, 1.5);
        objeto.scaleX *= factor;
        objeto.scaleY *= factor;
        objeto.set({left: ZONA_IMPRESION.left + ZONA_IMPRESION.width / 2, top: ZONA_IMPRESION.top + ZONA_IMPRESION.height / 2, originX: "center", originY: "center"});
        objeto.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
        actualizarAvisoZona();
    }

    function moverCapa(direccion) {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        direccion === "adelante" ? canvas.bringForward(objeto) : canvas.sendBackwards(objeto);
        const base = obtenerProductoBase();
        if (base) canvas.sendToBack(base);
        canvas.requestRenderAll();
        registrarHistorialAhora();
        renderizarCapas();
    }

    function actualizarTransformacion() {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        objeto.set({
            opacity: Number(document.getElementById("opacidadObjeto").value) / 100,
            angle: Number(document.getElementById("rotacionObjeto").value)
        });
        objeto.setCoords();
        canvas.requestRenderAll();
        sincronizarTransformacionSeleccionado();
        programarHistorial();
        actualizarAvisoZona();
    }

    function alternarBloqueoObjeto() {
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") return;
        objeto.dataBloqueado = document.getElementById("bloquearObjeto").checked;
        aplicarEstadoBloqueo(objeto);
        canvas.requestRenderAll();
        registrarHistorialAhora();
        renderizarCapas();
    }

    function aplicarEstadoBloqueo(objeto) {
        if (!objeto || objeto.dataTipo === "producto-base") return;
        const bloqueado = Boolean(objeto.dataBloqueado);
        objeto.set({
            lockMovementX: bloqueado, lockMovementY: bloqueado,
            lockScalingX: bloqueado, lockScalingY: bloqueado,
            lockRotation: bloqueado, hasControls: !bloqueado,
            hoverCursor: bloqueado ? "not-allowed" : "move"
        });
    }

    function renderizarCapas() {
        const objetos = canvas.getObjects().filter(o => o.dataTipo !== "producto-base").slice().reverse();
        if (!objetos.length) {
            listaCapas.innerHTML = '<p class="capas-vacias">Aún no agregaste elementos.</p>';
            return;
        }
        const activo = obtenerObjetoActivo();
        listaCapas.innerHTML = objetos.map((objeto, indiceVisual) => {
            const indiceReal = canvas.getObjects().indexOf(objeto);
            const tipo = esTexto(objeto) ? "Texto" : esImagenUsuario(objeto) ? "Imagen" : "Forma";
            const nombre = objeto.dataNombre || (esTexto(objeto) ? (objeto.text || "Texto") : tipo);
            const icono = esTexto(objeto) ? "fa-font" : esImagenUsuario(objeto) ? "fa-image" : "fa-shapes";
            return `<div class="capa-item${activo === objeto ? " activa" : ""}" data-indice="${indiceReal}">
                <button type="button" class="capa-seleccionar" data-accion="seleccionar"><i class="fa-solid ${icono}"></i><span><b>${escapar(String(nombre).slice(0, 26))}</b><small>${tipo}</small></span></button>
                <button type="button" data-accion="visibilidad" title="Mostrar u ocultar"><i class="fa-solid ${objeto.visible === false ? "fa-eye-slash" : "fa-eye"}"></i></button>
                <button type="button" data-accion="bloqueo" title="Bloquear o desbloquear"><i class="fa-solid ${objeto.dataBloqueado ? "fa-lock" : "fa-lock-open"}"></i></button>
            </div>`;
        }).join("");
    }

    function manejarClickCapa(evento) {
        const boton = evento.target.closest("button[data-accion]");
        const item = evento.target.closest(".capa-item");
        if (!boton || !item) return;
        const objeto = canvas.getObjects()[Number(item.dataset.indice)];
        if (!objeto) return;
        const accion = boton.dataset.accion;
        if (accion === "seleccionar") {
            if (objeto.visible === false) objeto.visible = true;
            canvas.setActiveObject(objeto);
        } else if (accion === "visibilidad") {
            objeto.visible = objeto.visible === false;
            if (objeto.visible === false && canvas.getActiveObject() === objeto) canvas.discardActiveObject();
        } else if (accion === "bloqueo") {
            objeto.dataBloqueado = !objeto.dataBloqueado;
            aplicarEstadoBloqueo(objeto);
        }
        canvas.requestRenderAll();
        renderizarCapas();
        sincronizarControlesObjeto();
        registrarHistorialAhora();
    }

    function actualizarAvisoZona() {
        const aviso = document.getElementById("avisoFueraZona");
        const objeto = obtenerObjetoActivo();
        if (!objeto || objeto.dataTipo === "producto-base") {
            aviso.hidden = true;
            return;
        }
        const rect = objeto.getBoundingRect(true, true);
        const fuera = rect.left < ZONA_IMPRESION.left || rect.top < ZONA_IMPRESION.top || rect.left + rect.width > ZONA_IMPRESION.left + ZONA_IMPRESION.width || rect.top + rect.height > ZONA_IMPRESION.top + ZONA_IMPRESION.height;
        aviso.hidden = !fuera;
    }

    function programarHistorial() {
        if (cargandoEstado) return;
        clearTimeout(temporizadorHistorial);
        temporizadorHistorial = setTimeout(registrarHistorialAhora, 160);
    }

    function registrarHistorialAhora() {
        if (cargandoEstado) return;
        const json = JSON.stringify(canvas.toJSON(PROPIEDADES_SERIALIZABLES));
        const historial = historiales[ladoActual];
        const indice = indicesHistorial[ladoActual];
        if (historial[indice] !== json) {
            historial.splice(indice + 1);
            historial.push(json);
            if (historial.length > 35) historial.shift();
            indicesHistorial[ladoActual] = historial.length - 1;
        }
        estados[ladoActual] = json;
        actualizarResumenDiseno();
        renderizarCapas();
        programarBorrador();
    }

    async function aplicarHistorial(indice) {
        const historial = historiales[ladoActual];
        if (indice < 0 || indice >= historial.length) return;
        indicesHistorial[ladoActual] = indice;
        estados[ladoActual] = historial[indice];
        await cargarLado(ladoActual);
        programarBorrador();
    }

    function deshacer() { aplicarHistorial(indicesHistorial[ladoActual] - 1); }
    function rehacer() { aplicarHistorial(indicesHistorial[ladoActual] + 1); }

    function limpiarLado() {
        if (!confirm(`¿Limpiar todos los elementos del ${ladoActual}?`)) return;
        canvas.getObjects().filter(objeto => objeto.dataTipo !== "producto-base").forEach(objeto => canvas.remove(objeto));
        canvas.discardActiveObject();
        canvas.renderAll();
        registrarHistorialAhora();
    }

    async function nuevoDiseno() {
        if (tieneElementosUsuario() && !confirm("¿Empezar un diseño nuevo? Se eliminarán los elementos del borrador actual.")) return;
        await borrarBorrador();
        reiniciarEstadosEditor();
        ladoActual = "frente";
        await cargarLado("frente", true);
        document.getElementById("notasPedido").value = "";
        document.getElementById("contadorNotas").textContent = "0/800";
        mostrarEstado("Nuevo diseño listo.", false, true);
    }

    function alternarGuias() {
        const zona = document.getElementById("zonaImpresion");
        zona.hidden = !zona.hidden;
        document.getElementById("btnGuias").classList.toggle("activo", !zona.hidden);
    }

    async function alternarPantallaCompleta() {
        const seccion = document.getElementById("lienzoSeccion");
        try {
            if (!document.fullscreenElement) await seccion.requestFullscreen();
            else await document.exitFullscreen();
        } catch { /* navegador sin soporte */ }
    }

    function actualizarBotonPantallaCompleta() {
        document.getElementById("btnPantallaCompleta").innerHTML = document.fullscreenElement ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
    }

    function configurarArrastrarSoltar() {
        const shell = document.getElementById("canvasShell");
        const overlay = document.getElementById("dropOverlay");
        ["dragenter", "dragover"].forEach(tipo => shell.addEventListener(tipo, evento => {
            evento.preventDefault();
            overlay.hidden = false;
        }));
        ["dragleave", "drop"].forEach(tipo => shell.addEventListener(tipo, evento => {
            evento.preventDefault();
            if (tipo === "dragleave" && evento.relatedTarget && shell.contains(evento.relatedTarget)) return;
            overlay.hidden = true;
        }));
        shell.addEventListener("drop", async evento => {
            const archivo = Array.from(evento.dataTransfer?.files || []).find(f => f.type.startsWith("image/"));
            if (archivo) await procesarArchivoImagen(archivo);
        });
    }

    function configurarAtajosTeclado() {
        document.addEventListener("keydown", evento => {
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (["input", "textarea", "select"].includes(tag) || document.activeElement?.isContentEditable) return;
            const ctrl = evento.ctrlKey || evento.metaKey;
            if (ctrl && evento.key.toLowerCase() === "z") { evento.preventDefault(); evento.shiftKey ? rehacer() : deshacer(); return; }
            if (ctrl && evento.key.toLowerCase() === "y") { evento.preventDefault(); rehacer(); return; }
            if (ctrl && evento.key.toLowerCase() === "d") { evento.preventDefault(); duplicarSeleccionado(); return; }
            if (ctrl && evento.key.toLowerCase() === "c") { evento.preventDefault(); copiarSeleccionado(); return; }
            if (ctrl && evento.key.toLowerCase() === "v") { evento.preventDefault(); pegarSeleccionado(); return; }
            if (["Delete", "Backspace"].includes(evento.key)) { evento.preventDefault(); eliminarSeleccionado(); return; }
            if (evento.key === "Escape") { canvas.discardActiveObject(); canvas.requestRenderAll(); return; }
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(evento.key)) {
                const objeto = obtenerObjetoActivo();
                if (!objeto || objeto.dataTipo === "producto-base" || objeto.dataBloqueado) return;
                evento.preventDefault();
                const salto = evento.shiftKey ? 10 : 1;
                if (evento.key === "ArrowUp") objeto.top -= salto;
                if (evento.key === "ArrowDown") objeto.top += salto;
                if (evento.key === "ArrowLeft") objeto.left -= salto;
                if (evento.key === "ArrowRight") objeto.left += salto;
                objeto.setCoords();
                canvas.requestRenderAll();
                programarHistorial();
                actualizarAvisoZona();
            }
        });
    }

    function actualizarResumen() {
        const usaTalla = productoActual && productoUsaTalla(productoActual?.categoria, productoActual?.nombre);
        const imagenResumen = document.getElementById("imagenResumen");
        const lienzoLibre = document.getElementById("lienzoLibreResumen");
        document.getElementById("nombreResumen").textContent = productoActual?.nombre || "Lienzo libre";
        const imagen = productoActual ? (galeriaProducto[baseImagenIndicePorLado.frente] || obtenerUrlImagen(productoActual.imagen)) : null;
        if (imagen) {
            imagenResumen.hidden = false;
            imagenResumen.src = imagen;
            lienzoLibre.hidden = true;
        } else {
            imagenResumen.hidden = true;
            lienzoLibre.hidden = false;
        }
        const partes = [productoActual ? colorProducto.value : `Fondo ${colorProducto.value}`];
        if (usaTalla) partes.push(`Talla ${tallaProducto.value}`);
        partes.push(`${cantidadProducto.value} ${Number(cantidadProducto.value) === 1 ? "unidad" : "unidades"}`);
        document.getElementById("varianteResumen").textContent = partes.join(" · ");
    }

    function actualizarResumenDiseno() {
        const frente = contarObjetosLado("frente");
        const espalda = contarObjetosLado("espalda");
        const emptyHint = document.getElementById("canvasEmptyHint");
        if (emptyHint) emptyHint.hidden = Boolean(productoActual) || contarObjetosLado(ladoActual) > 0;
        document.getElementById("contadorFrente").textContent = frente;
        document.getElementById("contadorEspalda").textContent = espalda;
        document.getElementById("estadoFrenteResumen").textContent = `${frente} ${frente === 1 ? "elemento" : "elementos"}`;
        document.getElementById("estadoEspaldaResumen").textContent = `${espalda} ${espalda === 1 ? "elemento" : "elementos"}`;
        document.getElementById("resumenCaras").textContent = frente && espalda ? "Frente y espalda" : frente ? "Solo frente" : espalda ? "Solo espalda" : "Sin elementos";

        const calidades = obtenerCalidadesImagenes();
        const calidadEl = document.getElementById("estadoCalidadResumen");
        if (!calidades.length) calidadEl.textContent = "Sin imágenes";
        else if (calidades.includes("baja")) calidadEl.textContent = "Revisar resolución";
        else if (calidades.includes("media")) calidadEl.textContent = "Resolución media";
        else calidadEl.textContent = "Buena resolución";
    }

    function contarObjetosLado(lado) {
        if (lado === ladoActual && !cargandoEstado) return canvas.getObjects().filter(o => o.dataTipo !== "producto-base").length;
        return contarObjetos(estados[lado]);
    }

    function contarObjetos(json) {
        if (!json) return 0;
        try { return (JSON.parse(json).objects || []).filter(objeto => objeto.dataTipo !== "producto-base").length; }
        catch { return 0; }
    }

    function obtenerCalidadesImagenes() {
        guardarEstadoActual();
        const resultado = [];
        ["frente", "espalda"].forEach(lado => {
            try {
                (JSON.parse(estados[lado] || "{}").objects || []).forEach(o => {
                    if (o.dataTipo === "imagen-usuario" && o.dataCalidad) resultado.push(o.dataCalidad);
                });
            } catch { /* ignorar */ }
        });
        return resultado;
    }

    function tieneElementosUsuario() {
        guardarEstadoActual();
        return contarObjetos(estados.frente) + contarObjetos(estados.espalda) > 0;
    }

    async function abrirVistaPrevia() {
        guardarEstadoActual();
        const boton = document.getElementById("btnVistaPrevia");
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        try {
            previewActual.frente = await exportarLadoDataUrl("frente");
            previewActual.espalda = await exportarLadoDataUrl("espalda");
            document.getElementById("previewFrente").src = previewActual.frente;
            document.getElementById("previewEspalda").src = previewActual.espalda;
            document.getElementById("modalPreview").hidden = false;
            document.body.classList.add("modal-abierto");
        } catch (error) {
            console.error(error);
            mostrarEstado("No pudimos generar la vista previa. Revisa que las imágenes del producto estén disponibles.", true);
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    }

    function cerrarVistaPrevia() {
        document.getElementById("modalPreview").hidden = true;
        document.body.classList.remove("modal-abierto");
    }

    function descargarPreview(lado) {
        const dataUrl = previewActual[lado];
        if (!dataUrl) return;
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `pixben-${lado}-${Date.now()}.png`;
        a.click();
    }

    async function exportarLadoDataUrl(lado) {
        const ladoPrevio = ladoActual;
        guardarEstadoActual();
        if (lado !== ladoActual) {
            ladoActual = lado;
            await cargarLado(lado);
        }
        canvas.discardActiveObject();
        canvas.renderAll();
        const dataUrl = canvas.toDataURL({format: "png", quality: 1, multiplier: 1.5});
        if (ladoPrevio !== ladoActual) {
            ladoActual = ladoPrevio;
            actualizarBotonesLado();
            await cargarLado(ladoPrevio);
        }
        return dataUrl;
    }

    async function exportarLadoBlob(lado) {
        const dataUrl = await exportarLadoDataUrl(lado);
        return fetch(dataUrl).then(respuesta => respuesta.blob());
    }

    async function enviarSolicitud() {
        cerrarVistaPrevia();
        if (!usuario?.id) {
            alert("Debes iniciar sesión para enviar una solicitud personalizada. Tu diseño queda guardado como borrador.");
            await guardarBorradorAhora();
            window.location.href = "login.html";
            return;
        }
        guardarEstadoActual();
        const tieneFrente = contarObjetos(estados.frente) > 0;
        const tieneEspalda = contarObjetos(estados.espalda) > 0;
        if (!tieneFrente && !tieneEspalda) return mostrarEstado("Agrega una imagen, texto o forma antes de enviar tu diseño.", true);
        if (productoActual && variantesColor.length && obtenerStockColorProducto(productoActual, colorProducto.value) <= 0) return mostrarEstado("El color seleccionado ya no tiene stock. Elige otra variante.", true);

        botonSolicitar.disabled = true;
        botonSolicitar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando diseño...';
        mostrarEstado("Generando vistas previas para el diseñador...", false);

        try {
            const frenteBlob = tieneFrente ? await exportarLadoBlob("frente") : null;
            const espaldaBlob = tieneEspalda ? await exportarLadoBlob("espalda") : null;
            const datos = {
                ...crearReferenciaUsuario(usuario),
                productoId: productoActual?.id || null,
                productoNombre: productoActual?.nombre || "Diseño libre",
                categoria: productoActual?.categoria || "PERSONALIZADO_LIBRE",
                color: colorProducto.value,
                talla: productoActual && productoUsaTalla(productoActual.categoria, productoActual.nombre) ? tallaProducto.value : "POR_DEFINIR",
                cantidad: Number(cantidadProducto.value),
                notas: document.getElementById("notasPedido").value.trim()
            };

            const formData = new FormData();
            formData.append("datos", JSON.stringify(datos));
            if (frenteBlob) formData.append("frente", frenteBlob, "frente.png");
            if (espaldaBlob) formData.append("espalda", espaldaBlob, "espalda.png");

            const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados`, {method: "POST", body: formData});
            if (!respuesta.ok) throw new Error(await obtenerMensajeError(respuesta));
            const solicitud = await respuesta.json();

            const respuestaCarrito = await fetchConSesion(`${API_URL}/carrito`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    productoId: productoActual?.id || null,
                    ...crearReferenciaUsuario(usuario),
                    cantidad: Number(cantidadProducto.value),
                    talla: datos.talla,
                    color: datos.color,
                    personalizado: true,
                    pedidoPersonalizadoId: solicitud.id
                })
            });
            if (!respuestaCarrito.ok) throw new Error("La solicitud se guardó, pero no pudo agregarse al carrito");

            await borrarBorrador();
            mostrarEstado("Diseño enviado. Te avisaremos cuando PixBen termine la cotización.", false, true);
            setTimeout(() => { window.location.href = "carrito de compras.html"; }, 1300);
        } catch (error) {
            console.error(error);
            mostrarEstado(error.message || "No se pudo enviar la solicitud", true);
        } finally {
            botonSolicitar.disabled = false;
            botonSolicitar.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar diseño para cotizar';
        }
    }

    function programarBorrador() {
        if (cargandoEstado) return;
        clearTimeout(temporizadorBorrador);
        estadoBorrador.classList.add("guardando");
        estadoBorrador.querySelector("span").textContent = "Guardando";
        temporizadorBorrador = setTimeout(guardarBorradorAhora, 850);
    }

    async function guardarBorradorAhora() {
        try {
            guardarEstadoActual();
            const payload = {
                version: 2,
                actualizado: Date.now(),
                productoId: productoActual?.id || null,
                color: colorProducto.value,
                colorFondo: colorFondoLienzo.value,
                talla: tallaProducto.value,
                cantidad: cantidadProducto.value,
                notas: document.getElementById("notasPedido").value,
                ladoActual,
                estados: {...estados},
                baseImagenIndicePorLado: {...baseImagenIndicePorLado},
                vistaManualPorLado: {...vistaManualPorLado}
            };
            const db = await abrirDBBorrador();
            await new Promise((resolve, reject) => {
                const tx = db.transaction("borradores", "readwrite");
                tx.objectStore("borradores").put(payload, "actual");
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
            estadoBorrador.classList.remove("guardando", "error");
            estadoBorrador.classList.add("guardado");
            estadoBorrador.querySelector("span").textContent = "Guardado";
        } catch (error) {
            console.warn("No se pudo guardar el borrador", error);
            estadoBorrador.classList.remove("guardando", "guardado");
            estadoBorrador.classList.add("error");
            estadoBorrador.querySelector("span").textContent = "Sin guardar";
        }
    }

    function abrirDBBorrador() {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open("PixBenStudio", 1);
            solicitud.onupgradeneeded = () => {
                if (!solicitud.result.objectStoreNames.contains("borradores")) solicitud.result.createObjectStore("borradores");
            };
            solicitud.onsuccess = () => resolve(solicitud.result);
            solicitud.onerror = () => reject(solicitud.error);
        });
    }

    async function leerBorrador() {
        try {
            const db = await abrirDBBorrador();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction("borradores", "readonly");
                const req = tx.objectStore("borradores").get("actual");
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        } catch { return null; }
    }

    async function borrarBorrador() {
        try {
            const db = await abrirDBBorrador();
            await new Promise((resolve, reject) => {
                const tx = db.transaction("borradores", "readwrite");
                tx.objectStore("borradores").delete("actual");
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
            estadoBorrador.className = "estado-borrador";
            estadoBorrador.querySelector("span").textContent = "Listo";
        } catch { /* no bloquear al usuario */ }
    }

    async function restaurarBorrador() {
        const draft = await leerBorrador();
        if (!draft?.estados || Date.now() - Number(draft.actualizado || 0) > 1000 * 60 * 60 * 24 * 30) return false;
        if (draft.productoId && !productos.some(p => String(p.id) === String(draft.productoId))) return false;

        productoSelect.value = draft.productoId ? String(draft.productoId) : "";
        productoActual = productos.find(p => String(p.id) === String(draft.productoId)) || null;
        reiniciarEstadosEditor();
        await prepararProductoActual();

        baseImagenIndicePorLado.frente = Number(draft.baseImagenIndicePorLado?.frente || 0);
        baseImagenIndicePorLado.espalda = Number(draft.baseImagenIndicePorLado?.espalda || 0);
        vistaManualPorLado.frente = Boolean(draft.vistaManualPorLado?.frente);
        vistaManualPorLado.espalda = Boolean(draft.vistaManualPorLado?.espalda);
        colorProducto.value = draft.color || colorProducto.value;
        colorFondoLienzo.value = draft.colorFondo || "#ffffff";
        marcarColorSeleccionado(colorProducto.value);
        if (Array.from(tallaProducto.options).some(o => o.value === draft.talla)) tallaProducto.value = draft.talla;
        cantidadProducto.value = draft.cantidad || "1";
        document.getElementById("notasPedido").value = draft.notas || "";
        document.getElementById("contadorNotas").textContent = `${document.getElementById("notasPedido").value.length}/800`;

        estados.frente = draft.estados.frente || null;
        estados.espalda = draft.estados.espalda || null;
        ["frente", "espalda"].forEach(lado => {
            historiales[lado] = estados[lado] ? [estados[lado]] : [];
            indicesHistorial[lado] = estados[lado] ? 0 : -1;
        });
        ladoActual = draft.ladoActual === "espalda" ? "espalda" : "frente";
        actualizarBotonesLado();
        await cargarLado(ladoActual, true);
        actualizarStockPersonalizable();
        actualizarResumen();
        actualizarResumenDiseno();
        estadoBorrador.classList.add("guardado");
        estadoBorrador.querySelector("span").textContent = "Restaurado";
        mostrarEstado("Recuperamos tu último borrador automáticamente.", false, true);
        return true;
    }

    function configurarAtajosEstadoBotones() {
        /* reservado para futuras combinaciones de teclado */
    }

    async function obtenerMensajeError(respuesta) {
        try {
            const json = await respuesta.json();
            return json.message || json.error || "No se pudo procesar la solicitud";
        } catch {
            return await respuesta.text() || "No se pudo procesar la solicitud";
        }
    }

    function mostrarEstado(mensaje, error = false, ok = false) {
        estadoSolicitud.textContent = mensaje;
        estadoSolicitud.className = `estado-solicitud ${error ? "error" : ok ? "ok" : ""}`;
    }

    function escapar(valor) {
        return String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    }
})();
