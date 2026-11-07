/* Interfaz de pedidos: no modifica datos, pagos, cotizaciones ni peticiones al backend. */
(function () {
    "use strict";
    const lista = document.getElementById("listaPedidos");
    const resumen = document.getElementById("resumenPedidosCuenta");
    const herramientas = document.getElementById("filtrosPedidos");
    const buscador = document.getElementById("buscarPedido");
    const resultados = document.getElementById("cantidadResultados");
    if (!lista || !resumen || !herramientas || !buscador || !resultados) return;

    const finales = new Set(["ENTREGADO", "ENTREGADA", "COMPLETADO", "COMPLETADA", "FINALIZADO", "FINALIZADA"]);
    const cancelados = new Set(["CANCELADO", "CANCELADA", "RECHAZADO", "RECHAZADA", "ANULADO", "ANULADA"]);
    const cotizaciones = new Set(["PENDIENTE_COTIZACION", "PENDIENTE_PAGO_DISENO", "EN_REVISION", "COTIZADO"]);
    let registros = [];
    let filtroActual = "todos";
    let busquedaActual = "";

    function seguro(valor) {
        return escaparPedidos(valor);
    }

    function estadoDe(pedido) {
        return String(pedido.estado || "PENDIENTE").trim().toUpperCase().replace(/\s+/g, "_");
    }

    function faseDe(registro) {
        const estado = estadoDe(registro.pedido);
        if (finales.has(estado)) return "finalizados";
        if (cancelados.has(estado)) return "cancelados";
        if (registro.personalizado && cotizaciones.has(estado)) return "cotizaciones";
        return "proceso";
    }

    function textoEstado(registro) {
        const estado = estadoDe(registro.pedido);
        const nombres = {
            PENDIENTE_COTIZACION: "Pendiente de cotización",
            PENDIENTE_PAGO_DISENO: "Pendiente de adelanto",
            EN_REVISION: "En revisión",
            COTIZADO: "Cotizado",
            APROBADO: "Diseño aprobado",
            EN_PRODUCCION: "En producción",
            LISTO: "Listo para entrega",
            ENVIADO: "Enviado"
        };
        return nombres[estado] || estadoBonito(estado);
    }

    function etapaActual(registro) {
        const p = registro.pedido;
        const estado = estadoDe(p);
        if (finales.has(estado)) return 3;
        if (registro.personalizado) {
            if (estado === "ENVIADO") return 3;
            if (["APROBADO", "EN_PRODUCCION", "LISTO"].includes(estado)) return 2;
            if (["EN_REVISION", "COTIZADO"].includes(estado)) return 1;
            return 0;
        }
        const envio = String(p.estadoEnvio || "").toUpperCase();
        const pago = String(p.estadoPago || "").toUpperCase();
        if (["ENVIADO", "EN_TRANSITO", "EN_CAMINO", "ENTREGADO"].includes(envio)) return 3;
        if (["EN_PREPARACION", "PREPARANDO", "EN_PROCESO", "LISTO", "DESPACHADO"].includes(estado)) return 2;
        if (["PAGADO", "VERIFICADO", "CONFIRMADO", "APROBADO"].includes(pago) ||
            ["PAGADO", "CONFIRMADO", "APROBADO"].includes(estado)) return 1;
        return 0;
    }

    function seguimiento(registro) {
        if (faseDe(registro) === "cancelados") return "";
        const pasos = registro.personalizado
            ? ["Solicitud", "Cotización", "Producción", "Entrega"]
            : ["Pedido", "Pago", "Preparación", "Envío"];
        const etapa = etapaActual(registro);
        return '<div class="pb-order-tracker" aria-label="Etapa del pedido: ' + seguro(pasos[etapa]) + '">' +
            pasos.map(function (paso, indice) {
                return '<div class="pb-order-step ' + (indice < etapa ? "is-complete" : indice === etapa ? "is-current" : "") + '">' +
                    '<span class="pb-order-step-bar" aria-hidden="true"></span><small>' + seguro(paso) + '</small></div>';
            }).join("") + '</div>';
    }

    function fechaRegistro(registro) {
        return registro.personalizado
            ? (registro.pedido.fechaCreacion || registro.pedido.fecha)
            : (registro.pedido.fecha || registro.pedido.fechaCreacion);
    }

    function normalizarFecha(fecha) {
        const numero = new Date(fecha || "").getTime();
        return Number.isFinite(numero) ? numero : 0;
    }

    function dinero(valor) {
        const numero = Number(valor);
        return valor == null || !Number.isFinite(numero) ? null : "S/ " + numero.toFixed(2);
    }

    function imagenPedido(registro) {
        const p = registro.pedido;
        const imagen = registro.personalizado ? (p.imagenFrente || p.imagenEspalda) : "";
        if (!imagen) {
            return '<div class="pb-order-preview" aria-hidden="true"><i class="fa-solid ' +
                (registro.personalizado ? "fa-shirt" : "fa-box") + '"></i></div>';
        }
        return '<div class="pb-order-preview"><img src="' + seguro(imagen) +
            '" alt="Vista previa del producto personalizado" loading="lazy" decoding="async">' +
            '<span class="pb-order-watermark" aria-hidden="true">PIXBEN · VISTA PREVIA</span></div>';
    }

    function detallePersonalizado(p) {
        const asistido = String(p.tipoServicio || "").toUpperCase() === "DISENO_ASISTIDO";
        const adelanto = dinero(p.tarifaDiseno == null ? 15 : p.tarifaDiseno);
        let html = '<p><b>Producto:</b> ' + seguro(p.productoNombre || "Personalizado") + '</p>' +
            '<p><b>Color y talla:</b> ' + seguro(p.color || "Por confirmar") +
            ' · ' + seguro(p.talla || "Unidad") + '</p>' +
            '<p><b>Cantidad:</b> ' + seguro(p.cantidad || 1) + '</p>';
        if (asistido) {
            html += '<p><b>Adelanto del diseño:</b> ' + seguro(adelanto || "Por confirmar") +
                ' · ' + seguro(estadoBonito(p.estadoPagoDiseno || "POR_VERIFICAR")) + '</p>' +
                '<p><b>Revisiones incluidas:</b> ' + seguro(p.revisionesIncluidas == null ? 2 : p.revisionesIncluidas) + '</p>';
        }
        if (p.mensajeAdmin) html += '<p><b>Respuesta de PixBen:</b> ' + seguro(p.mensajeAdmin) + '</p>';
        if (p.imagenFrente || p.imagenEspalda) {
            html += '<div class="pb-order-images">';
            if (p.imagenFrente) html += '<figure><img loading="lazy" src="' + seguro(p.imagenFrente) + '" alt="Diseño frontal"><figcaption>Frente</figcaption></figure>';
            if (p.imagenEspalda) html += '<figure><img loading="lazy" src="' + seguro(p.imagenEspalda) + '" alt="Diseño posterior"><figcaption>Espalda</figcaption></figure>';
            html += '</div>';
        }
        return html;
    }

    function detalleCompra(p) {
        const subtotal = dinero(p.subtotal == null ? p.total : p.subtotal) || "Por confirmar";
        return '<p><b>Forma de pago:</b> ' + seguro(estadoBonito(p.metodoPago || "Sin método")) +
            ' · ' + seguro(estadoBonito(p.estadoPago || "Por verificar")) + '</p>' +
            '<p><b>Entrega:</b> ' + seguro(estadoBonito(p.metodoEnvio || "Por coordinar")) +
            ' · ' + seguro(estadoBonito(p.estadoEnvio || "Pendiente coordinación")) + '</p>' +
            '<p><b>Destino:</b> ' + seguro(p.destinoEnvio || "Por coordinar") + '</p>' +
            '<p><b>Subtotal:</b> ' + seguro(subtotal) + '</p>' +
            '<p><b>Envío:</b> Pago directo al transportista</p>' +
            renderizarItemsPedido(p);
    }

    function tarjeta(registro) {
        const p = registro.pedido;
        const fase = faseDe(registro);
        const asistido = registro.personalizado &&
            String(p.tipoServicio || "").toUpperCase() === "DISENO_ASISTIDO";
        const tipo = registro.personalizado ? (asistido ? "Diseño asistido" : "Personalizado") :
            (p.invitado ? "Compra de invitado" : "Compra");
        const titulo = registro.personalizado ?
            (p.productoNombre || (asistido ? "Solicitud al diseñador" : "Diseño personalizado")) :
            codigoVisible(p);
        const detalleBreve = registro.personalizado ?
            [p.color || "Color por confirmar", p.talla || "Unidad", (Number(p.cantidad) || 1) + " unidad(es)"].join(" · ") :
            ((Array.isArray(p.items) ? p.items.length : 0) + " producto(s) en tu compra");
        const descripcion = registro.personalizado ?
            (p.mensajeAdmin || "Recibimos tu solicitud. Te avisaremos cuando el equipo la revise.") :
            ("Código de seguimiento: " + codigoVisible(p));
        const precio = registro.personalizado ? dinero(p.precio) :
            dinero(p.subtotal == null ? p.total : p.subtotal);
        const precioTexto = precio || (registro.personalizado ? "Pendiente de cotización" : "Por confirmar");
        const etiquetaPrecio = asistido ? "Saldo restante" : registro.personalizado ? "Precio del diseño" : "Subtotal de compra";
        const estadoClase = fase === "finalizados" ? "is-done" :
            fase === "proceso" ? "is-process" : fase === "cancelados" ? "is-cancelled" : "is-quote";
        const detalles = registro.personalizado ? detallePersonalizado(p) : detalleCompra(p);
        return '<article class="pb-order-card">' +
            '<div class="pb-order-head"><div class="pb-order-head-copy">' +
            '<span class="pb-order-type ' + (registro.personalizado ? "" : "is-normal") + '">' +
            '<i class="fa-solid ' + (registro.personalizado ? "fa-wand-magic-sparkles" : "fa-bag-shopping") +
            '" aria-hidden="true"></i>' + seguro(tipo) + '</span>' +
            '<h2>' + seguro(titulo) + '</h2>' +
            '<p class="pb-order-date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ' +
            seguro(fechaBonita(fechaRegistro(registro))) + '</p></div>' +
            '<span class="pb-order-status ' + estadoClase + '">' + seguro(textoEstado(registro)) + '</span></div>' +
            '<div class="pb-order-main">' + imagenPedido(registro) +
            '<div class="pb-order-description"><strong>' + seguro(detalleBreve) + '</strong>' +
            '<p class="pb-order-note">' + seguro(descripcion) + '</p></div></div>' +
            seguimiento(registro) +
            '<div class="pb-order-bottom"><div class="pb-order-price"><span>' + seguro(etiquetaPrecio) +
            '</span><strong>' + seguro(precioTexto) + '</strong></div>' +
            '<span class="pb-order-hint">' + (fase === "cotizaciones" ? "Esperando actualización de PixBen" :
            fase === "finalizados" ? "Pedido finalizado" : fase === "cancelados" ? "Pedido sin continuar" :
            "Consulta el avance aquí") + '</span></div>' +
            '<details class="pb-order-details"><summary>Ver detalles del pedido <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>' +
            '<div class="pb-order-detail-content">' + detalles + '</div></details></article>';
    }

    function coincideBusqueda(registro) {
        if (!busquedaActual) return true;
        const p = registro.pedido;
        const nombresItems = Array.isArray(p.items) ? p.items.map(function (i) { return i.nombre || ""; }).join(" ") : "";
        const texto = [codigoVisible(p), p.productoNombre, p.color, p.talla, p.estado, p.mensajeAdmin, nombresItems]
            .filter(Boolean).join(" ").toLocaleLowerCase("es-PE");
        return texto.includes(busquedaActual);
    }

    function refrescar() {
        const candidatos = registros.filter(function (r) {
            return (filtroActual === "todos" || faseDe(r) === filtroActual) && coincideBusqueda(r);
        });
        const totales = {
            total: registros.length,
            pendientes: registros.filter(function (r) {
                return !["finalizados", "cancelados"].includes(faseDe(r));
            }).length,
            completados: registros.filter(function (r) { return faseDe(r) === "finalizados"; }).length
        };
        document.getElementById("pbTotalPedidos").textContent = totales.total;
        document.getElementById("pbPedidosPendientes").textContent = totales.pendientes;
        document.getElementById("pbPedidosCompletados").textContent = totales.completados;
        herramientas.querySelectorAll("[data-pb-filtro]").forEach(function (boton) {
            boton.setAttribute("aria-pressed", String(boton.dataset.pbFiltro === filtroActual));
        });
        resultados.textContent = candidatos.length === 1 ? "1 pedido encontrado" : candidatos.length + " pedidos encontrados";
        lista.classList.add("pb-order-results");
        lista.classList.toggle("is-single", candidatos.length === 1);
        if (!candidatos.length) {
            const vacio = registros.length ? "No hay pedidos que coincidan con tu búsqueda o filtro." :
                "Tus compras y solicitudes personalizadas aparecerán aquí.";
            lista.innerHTML = '<div class="pb-orders-empty"><i class="fa-solid fa-box-open" aria-hidden="true"></i>' +
                '<h2>' + (registros.length ? "No encontramos coincidencias" : "Todavía no tienes pedidos") + '</h2>' +
                '<p>' + vacio + '</p>' +
                (registros.length ? '<button class="pb-orders-reset" type="button" data-pb-restablecer>Mostrar todos</button>' : '') +
                '</div>';
            return;
        }
        lista.innerHTML = candidatos.map(tarjeta).join("");
    }

    function actualizar(normales, personalizados, opciones) {
        const modoInvitado = opciones && opciones.modo === "invitado";
        registros = [];
        (Array.isArray(normales) ? normales : []).forEach(function (p) {
            if (p && typeof p === "object") registros.push({pedido: p, personalizado: false});
        });
        (Array.isArray(personalizados) ? personalizados : []).forEach(function (p) {
            if (p && typeof p === "object") registros.push({pedido: p, personalizado: true});
        });
        registros.sort(function (a, b) {
            return normalizarFecha(fechaRegistro(b)) - normalizarFecha(fechaRegistro(a));
        });
        resumen.hidden = modoInvitado && registros.length === 0;
        herramientas.hidden = modoInvitado && registros.length === 0;
        resultados.hidden = modoInvitado && registros.length === 0;
        refrescar();
    }

    herramientas.addEventListener("click", function (evento) {
        const boton = evento.target.closest("[data-pb-filtro]");
        if (!boton) return;
        filtroActual = boton.dataset.pbFiltro;
        refrescar();
    });
    buscador.addEventListener("input", function () {
        busquedaActual = buscador.value.trim().toLocaleLowerCase("es-PE");
        refrescar();
    });
    lista.addEventListener("click", function (evento) {
        if (!evento.target.closest("[data-pb-restablecer]")) return;
        filtroActual = "todos";
        busquedaActual = "";
        buscador.value = "";
        refrescar();
    });

    window.PixBenPedidosPremium = {actualizar: actualizar};
})();