"use strict";

(async function registrarVisitaPrivada() {
    try {
        const ruta = `${window.location.pathname}${window.location.search}`;
        const usuario = obtenerUsuarioSesion();
        const llaveSesion = `pixben-visita:${usuario?.id || "anonimo"}:${ruta}`;
        if (sessionStorage.getItem(llaveSesion)) return;
        sessionStorage.setItem(llaveSesion, "1");

        let visitanteId = localStorage.getItem("pixbenVisitanteAnonimo");
        if (!visitanteId) {
            visitanteId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
            localStorage.setItem("pixbenVisitanteAnonimo", visitanteId);
        }

        await fetchConSesionOpcional(`${API_URL}/visitas`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            keepalive: true,
            body: JSON.stringify({
                visitanteId,
                usuarioId: usuario?.id || null,
                correo: usuario?.correo || null,
                ruta
            })
        });
    } catch (error) {
        console.debug("Analítica no disponible", error);
    }
})();
