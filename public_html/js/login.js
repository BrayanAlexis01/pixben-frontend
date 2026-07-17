"use strict";

async function iniciarSesion() {
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;
    const boton = document.getElementById("btnIniciarSesion");

    if (!correo || !password) {
        alert("Completa el correo y la contraseña");
        return;
    }

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Ingresando...";
        }
        const respuesta = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({correo, password})
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status === 401
                    ? "Correo o contraseña incorrectos"
                    : await obtenerMensajeRespuesta(respuesta, "No se pudo iniciar sesión"));
        }

        const usuario = guardarUsuarioSesion(await respuesta.json());
        if (!usuario) throw new Error("La respuesta de inicio de sesión no es válida");

        alert(`Bienvenido ${obtenerNombreVisible(usuario)}`);
        window.location.href = usuario.rol === "admin" ? "admin.html" : "../index.html";
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "Ingresar";
        }
    }
}
