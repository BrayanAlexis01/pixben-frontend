/* Extraído de index.html. Mantener el orden de carga indicado en el HTML. */

(function () {
                const STORAGE_KEY = "pixben_privacy_choice_v1";
                const COOKIE_NAME = "pixben_privacy_choice";

                function leerDecision() {
                    try {
                        const guardada = localStorage.getItem(STORAGE_KEY);
                        if (guardada) {
                            return guardada;
                        }
                    } catch (error) {
                        console.warn("No se pudo leer localStorage:", error);
                    }

                    const prefijo = COOKIE_NAME + "=";
                    const cookie = document.cookie
                            .split(";")
                            .map(valor => valor.trim())
                            .find(valor => valor.startsWith(prefijo));

                    return cookie ? decodeURIComponent(cookie.substring(prefijo.length)) : null;
                }

                function guardarDecision(decision) {
                    try {
                        localStorage.setItem(STORAGE_KEY, decision);
                    } catch (error) {
                        console.warn("No se pudo guardar en localStorage:", error);
                    }

                    const esSeguro = location.protocol === "https:" ? "; Secure" : "";
                    document.cookie = COOKIE_NAME + "=" + encodeURIComponent(decision)
                            + "; Max-Age=15552000; Path=/; SameSite=Lax" + esSeguro;
                }

                document.addEventListener("DOMContentLoaded", function () {
                    const aviso = document.getElementById("privacyNotice");
                    const aceptar = document.getElementById("privacyAccept");
                    const rechazar = document.getElementById("privacyReject");

                    if (!aviso || !aceptar || !rechazar) {
                        return;
                    }

                    // El aviso parte oculto. Si un bloqueador lo elimina, nunca se bloquea la página.
                    if (!leerDecision()) {
                        aviso.hidden = false;
                        aviso.classList.add("is-visible");
                    }

                    function cerrar(decision) {
                        guardarDecision(decision);
                        aviso.classList.remove("is-visible");
                        aviso.hidden = true;
                    }

                    aceptar.addEventListener("click", function () {
                        cerrar("accepted");
                    });

                    rechazar.addEventListener("click", function () {
                        cerrar("rejected");
                    });
                });
            })();
