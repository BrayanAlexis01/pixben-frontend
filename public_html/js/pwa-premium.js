"use strict";

(() => {
    const CONFIG = {
        swUrl: "/service-worker.js",
        icono: "/imagensponsor/favicon-192.png",
        badge: "/imagensponsor/favicon-192.png",
        tiempoSplashMinimo: 900,
        tiempoSplashMaximo: 2200
    };

    let eventoInstalacion = null;
    let recargandoPorActualizacion = false;
    let registroServiceWorker = null;

    const esStandalone = () =>
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

    function cuandoDOMListo(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, {once: true});
        } else {
            callback();
        }
    }

    function obtenerCapa() {
        let capa = document.getElementById("pixbenPwaLayer");
        if (!capa) {
            capa = document.createElement("div");
            capa.id = "pixbenPwaLayer";
            capa.className = "pixben-pwa-layer";
            capa.setAttribute("aria-live", "polite");
            document.body.appendChild(capa);
        }
        return capa;
    }

    function cerrarElemento(elemento) {
        if (!elemento || elemento.classList.contains("is-leaving")) return;
        elemento.classList.add("is-leaving");
        window.setTimeout(() => elemento.remove(), 280);
    }

    function mostrarAviso({
        id = `pixben-aviso-${Date.now()}`,
        tipo = "info",
        icono = "✦",
        titulo,
        mensaje,
        accionTexto = "",
        alAccionar = null,
        duracion = 0
    }) {
        cuandoDOMListo(() => {
            const capa = obtenerCapa();
            const anterior = document.getElementById(id);
            if (anterior) anterior.remove();

            const aviso = document.createElement("section");
            aviso.id = id;
            aviso.className = `pixben-pwa-toast is-${tipo}`;
            aviso.setAttribute("role", "status");

            const bloqueIcono = document.createElement("div");
            bloqueIcono.className = "pixben-pwa-icon";
            bloqueIcono.setAttribute("aria-hidden", "true");
            bloqueIcono.textContent = icono;

            const copia = document.createElement("div");
            copia.className = "pixben-pwa-copy";
            const fuerte = document.createElement("strong");
            fuerte.textContent = titulo || "PixBen";
            const texto = document.createElement("span");
            texto.textContent = mensaje || "";
            copia.append(fuerte, texto);

            const acciones = document.createElement("div");
            acciones.className = "pixben-pwa-actions";

            if (accionTexto && typeof alAccionar === "function") {
                const accion = document.createElement("button");
                accion.type = "button";
                accion.className = "pixben-pwa-button";
                accion.textContent = accionTexto;
                accion.addEventListener("click", () => alAccionar(aviso));
                acciones.appendChild(accion);
            }

            const cerrar = document.createElement("button");
            cerrar.type = "button";
            cerrar.className = "pixben-pwa-close";
            cerrar.setAttribute("aria-label", "Cerrar aviso");
            cerrar.textContent = "×";
            cerrar.addEventListener("click", () => cerrarElemento(aviso));
            acciones.appendChild(cerrar);

            aviso.append(bloqueIcono, copia, acciones);
            capa.prepend(aviso);

            if (duracion > 0) {
                window.setTimeout(() => cerrarElemento(aviso), duracion);
            }
        });
    }

    function mostrarSplash() {
        if (!esStandalone()) return;
        if (sessionStorage.getItem("pixbenSplashVisto") === "1") return;

        sessionStorage.setItem("pixbenSplashVisto", "1");
        const inicio = performance.now();

        cuandoDOMListo(() => {
            document.documentElement.classList.add("pwa-standalone");
            document.body.classList.add("pixben-splash-activo");

            const splash = document.createElement("div");
            splash.id = "pixbenAppSplash";
            splash.className = "pixben-app-splash";
            splash.setAttribute("role", "status");
            splash.setAttribute("aria-label", "Iniciando PixBen");
            splash.innerHTML = `
                <div class="pixben-splash-card">
                    <div class="pixben-splash-logo-wrap">
                        <img class="pixben-splash-logo" src="${CONFIG.icono}" alt="">
                    </div>
                    <h1>PixBen</h1>
                    <p>Diseña algo que sea solo tuyo.</p>
                    <div class="pixben-splash-progress" aria-hidden="true"></div>
                </div>`;
            document.body.prepend(splash);

            const quitar = () => {
                const transcurrido = performance.now() - inicio;
                const espera = Math.max(0, CONFIG.tiempoSplashMinimo - transcurrido);
                window.setTimeout(() => {
                    splash.classList.add("is-closing");
                    document.body.classList.remove("pixben-splash-activo");
                    window.setTimeout(() => splash.remove(), 400);
                }, espera);
            };

            if (document.readyState === "complete") {
                quitar();
            } else {
                window.addEventListener("load", quitar, {once: true});
                window.setTimeout(quitar, CONFIG.tiempoSplashMaximo);
            }
        });
    }

    function quitarBotonInstalar() {
        document.getElementById("pixbenInstallChip")?.remove();
    }

    function mostrarBotonInstalar() {
        cuandoDOMListo(() => {
            if (esStandalone() || document.getElementById("pixbenInstallChip")) return;

            const boton = document.createElement("button");
            boton.id = "pixbenInstallChip";
            boton.type = "button";
            boton.className = "pixben-install-chip";
            boton.innerHTML = `<img src="${CONFIG.icono}" alt=""><span>Instalar PixBen</span>`;
            boton.addEventListener("click", async () => {
                if (eventoInstalacion) {
                    eventoInstalacion.prompt();
                    await eventoInstalacion.userChoice;
                    eventoInstalacion = null;
                    quitarBotonInstalar();
                    return;
                }

                if (esIOS()) {
                    mostrarAviso({
                        id: "pixben-ios-install",
                        icono: "↗",
                        titulo: "Instalar en iPhone o iPad",
                        mensaje: "Toca Compartir y luego “Agregar a pantalla de inicio”.",
                        duracion: 9000
                    });
                }
            });
            obtenerCapa().appendChild(boton);
        });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        eventoInstalacion = event;
        mostrarBotonInstalar();
    });

    window.addEventListener("appinstalled", () => {
        eventoInstalacion = null;
        quitarBotonInstalar();
        mostrarAviso({
            id: "pixben-instalada",
            tipo: "online",
            icono: "✓",
            titulo: "PixBen instalada",
            mensaje: "Ya puedes abrirla desde la pantalla de inicio.",
            duracion: 5500
        });
    });

    function avisarActualizacion(registro) {
        if (!registro?.waiting) return;
        mostrarAviso({
            id: "pixben-update",
            icono: "↻",
            titulo: "Nueva versión disponible",
            mensaje: "Actualiza para usar las últimas mejoras de PixBen.",
            accionTexto: "Actualizar",
            alAccionar: () => registro.waiting.postMessage({tipo: "SKIP_WAITING"})
        });
    }

    async function registrarServiceWorker() {
        if (!("serviceWorker" in navigator)) return null;
        if (location.protocol !== "https:" && location.hostname !== "localhost") return null;

        try {
            const registro = await navigator.serviceWorker.register(CONFIG.swUrl, {
                scope: "/",
                updateViaCache: "none"
            });
            registroServiceWorker = registro;
            avisarActualizacion(registro);

            registro.addEventListener("updatefound", () => {
                const nuevo = registro.installing;
                if (!nuevo) return;
                nuevo.addEventListener("statechange", () => {
                    if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
                        avisarActualizacion(registro);
                    }
                });
            });

            window.setInterval(() => registro.update().catch(() => {}), 60 * 60 * 1000);
            return registro;
        } catch (error) {
            console.warn("No se pudo registrar la experiencia PWA", error);
            return null;
        }
    }

    navigator.serviceWorker?.addEventListener("controllerchange", () => {
        if (recargandoPorActualizacion) return;
        recargandoPorActualizacion = true;
        window.location.reload();
    });

    function informarConexion() {
        if (navigator.onLine) {
            mostrarAviso({
                id: "pixben-conexion",
                tipo: "online",
                icono: "✓",
                titulo: "Conexión recuperada",
                mensaje: "PixBen volvió a estar en línea.",
                duracion: 4200
            });
        } else {
            mostrarAviso({
                id: "pixben-conexion",
                tipo: "offline",
                icono: "⌁",
                titulo: "Estás sin conexión",
                mensaje: "Puedes seguir viendo las páginas que ya se guardaron.",
                duracion: 0
            });
        }
    }

    window.addEventListener("online", informarConexion);
    window.addEventListener("offline", informarConexion);


    function obtenerApiUrl() {
        try {
            return typeof API_URL !== "undefined" ? String(API_URL).replace(/\/$/, "") : "";
        } catch {
            return "";
        }
    }

    function urlBase64AUint8Array(valor) {
        const padding = "=".repeat((4 - valor.length % 4) % 4);
        const base64 = (valor + padding).replaceAll("-", "+").replaceAll("_", "/");
        const raw = atob(base64);
        return Uint8Array.from([...raw].map(caracter => caracter.charCodeAt(0)));
    }

    async function obtenerRegistroServiceWorker() {
        return registroServiceWorker || await navigator.serviceWorker.ready;
    }

    async function registrarSuscripcionEnBackend(suscripcion) {
        const apiUrl = obtenerApiUrl();
        if (!apiUrl || !suscripcion?.endpoint) return false;

        try {
            if (typeof obtenerUsuarioSesion !== "function" ||
                    typeof tieneSesionValida !== "function" ||
                    typeof fetchConSesion !== "function") return false;

            const usuario = obtenerUsuarioSesion();
            if (!tieneSesionValida(usuario)) return false;

            const respuesta = await fetchConSesion(`${apiUrl}/notificaciones/suscribir`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({endpoint: suscripcion.endpoint})
            });
            return respuesta.ok;
        } catch (error) {
            console.warn("No se pudo sincronizar la suscripción Push", error);
            return false;
        }
    }

    async function crearOSincronizarSuscripcionPush() {
        const apiUrl = obtenerApiUrl();
        if (!apiUrl || !("PushManager" in window)) return false;

        const respuestaClave = await fetch(`${apiUrl}/notificaciones/clave-publica`);
        if (!respuestaClave.ok) throw new Error("No se pudo obtener la clave de notificaciones");
        const configuracion = await respuestaClave.json();
        if (!configuracion.enabled || !configuracion.publicKey) {
            mostrarAviso({
                id: "pixben-push-pendiente",
                tipo: "offline",
                icono: "!",
                titulo: "Configuración pendiente",
                mensaje: "Falta configurar las claves de notificación en el servidor de PixBen.",
                duracion: 7500
            });
            return false;
        }

        const registro = await obtenerRegistroServiceWorker();
        let suscripcion = await registro.pushManager.getSubscription();
        if (!suscripcion) {
            suscripcion = await registro.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64AUint8Array(configuracion.publicKey)
            });
        }
        return registrarSuscripcionEnBackend(suscripcion);
    }

    async function desuscribirNotificacionesCuenta() {
        try {
            const apiUrl = obtenerApiUrl();
            if (!apiUrl || typeof fetchConSesion !== "function") return;
            const registro = await obtenerRegistroServiceWorker();
            const suscripcion = await registro.pushManager.getSubscription();
            if (!suscripcion?.endpoint) return;

            await fetchConSesion(`${apiUrl}/notificaciones/suscribir`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({endpoint: suscripcion.endpoint})
            });
        } catch (error) {
            console.warn("No se pudo desvincular la suscripción Push", error);
        }
    }

    async function sincronizarSuscripcionExistente() {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        try {
            const registro = await obtenerRegistroServiceWorker();
            const suscripcion = await registro.pushManager.getSubscription();
            if (suscripcion) await registrarSuscripcionEnBackend(suscripcion);
        } catch (error) {
            console.warn("No se pudo comprobar la suscripción Push", error);
        }
    }

    async function solicitarNotificaciones() {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            mostrarAviso({
                id: "pixben-notificaciones-no",
                tipo: "offline",
                icono: "!",
                titulo: "Avisos no disponibles",
                mensaje: "Este navegador no admite notificaciones de la aplicación.",
                duracion: 6500
            });
            return false;
        }

        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
            mostrarAviso({
                id: "pixben-notificaciones-denegadas",
                tipo: "offline",
                icono: "!",
                titulo: "Avisos desactivados",
                mensaje: "Puedes habilitarlos más adelante desde la configuración del navegador.",
                duracion: 6500
            });
            return false;
        }

        try {
            const pushActivo = await crearOSincronizarSuscripcionPush();
            await mostrarNotificacion(
                "Avisos activados",
                pushActivo
                    ? "PixBen te avisará cuando cambie el estado de tu pedido."
                    : "Los avisos locales están activos; revisa la configuración del servidor para recibirlos con la app cerrada.",
                "/htmls/mis-pedidos.html"
            );
            document.getElementById("pixbenNotificationCard")?.remove();
            return true;
        } catch (error) {
            console.error(error);
            mostrarAviso({
                id: "pixben-push-error",
                tipo: "offline",
                icono: "!",
                titulo: "No se pudo activar Push",
                mensaje: error.message || "Revisa la conexión e inténtalo nuevamente.",
                duracion: 7000
            });
            return false;
        }
    }

    async function mostrarNotificacion(titulo, cuerpo, url = "/") {
        if (!("Notification" in window) || Notification.permission !== "granted") return false;
        const registro = registroServiceWorker || await navigator.serviceWorker.ready;
        await registro.showNotification(titulo, {
            body: cuerpo,
            icon: CONFIG.icono,
            badge: CONFIG.badge,
            tag: `pixben-${url}`,
            renotify: true,
            data: {url},
            vibrate: [120, 70, 120]
        });
        return true;
    }

    function insertarActivadorNotificaciones() {
        const esPedidos = /\/htmls\/mis-pedidos\.html$/i.test(location.pathname);
        if (!esPedidos || !("Notification" in window) || Notification.permission !== "default") return;

        cuandoDOMListo(() => {
            if (document.getElementById("pixbenNotificationCard")) return;
            const encabezado = document.querySelector(".encabezado-pedidos");
            if (!encabezado) return;

            const tarjeta = document.createElement("section");
            tarjeta.id = "pixbenNotificationCard";
            tarjeta.className = "pixben-notification-card";
            tarjeta.innerHTML = `
                <div>
                    <strong>Recibe avisos de tus pedidos</strong>
                    <p>Recibe una notificación aunque no tengas abierta la página de pedidos.</p>
                </div>`;
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "pixben-notification-button";
            boton.textContent = "Activar avisos";
            boton.addEventListener("click", solicitarNotificaciones);
            tarjeta.appendChild(boton);
            encabezado.insertAdjacentElement("afterend", tarjeta);
        });
    }

    document.documentElement.classList.add(esStandalone() ? "pwa-standalone" : "pwa-browser");
    mostrarSplash();
    insertarActivadorNotificaciones();
    registrarServiceWorker().then(() => {
        window.setTimeout(sincronizarSuscripcionExistente, 1800);
    });

    if (esIOS() && !esStandalone()) {
        window.setTimeout(() => {
            if (!sessionStorage.getItem("pixbenIosInstallMostrado")) {
                sessionStorage.setItem("pixbenIosInstallMostrado", "1");
                mostrarBotonInstalar();
            }
        }, 4500);
    }

    window.PixBenPWA = Object.freeze({
        esInstalada: esStandalone,
        solicitarNotificaciones,
        mostrarNotificacion,
        mostrarAviso,
        crearOSincronizarSuscripcionPush,
        desuscribirNotificacionesCuenta
    });
})();
