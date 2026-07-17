"use strict";

const DOMINIOS_CLIENTE = ["gmail.com", "hotmail.com", "outlook.com", "live.com"];
const REGEX_CORREO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const REGEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

async function registrar() {
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmarPassword")?.value ?? password;
    const boton = document.getElementById("btnRegistrar");

    if (!nombre || !apellido || !correo || !password || !confirmar) {
        alert("Completa todos los campos");
        return;
    }
    if (!REGEX_CORREO.test(correo)) {
        alert("Ingresa un correo electrónico válido");
        return;
    }
    const dominio = correo.split("@")[1];
    if (!DOMINIOS_CLIENTE.includes(dominio)) {
        alert("Para registrarte usa un correo Gmail, Hotmail, Outlook o Live");
        return;
    }
    if (!REGEX_PASSWORD.test(password)) {
        alert("La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo");
        return;
    }
    if (password !== confirmar) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        boton.disabled = true;
        boton.textContent = "Creando cuenta...";
        const respuesta = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({nombre, apellido, correo, password})
        });
        if (!respuesta.ok) throw new Error(await obtenerMensajeRespuesta(respuesta, "No se pudo registrar la cuenta"));
        guardarUsuarioSesion(await respuesta.json());
        alert("Cuenta creada correctamente");
        window.location.href = "perfil.html";
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        boton.disabled = false;
        boton.textContent = "Registrarme";
    }
}
