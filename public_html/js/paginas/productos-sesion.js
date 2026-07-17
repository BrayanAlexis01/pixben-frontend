/* Extraído de htmls/productos.html. Mantener el orden de carga indicado en el HTML. */

const usuario = obtenerUsuarioSesion();

            if (usuario) {

                document.getElementById("nombreUsuario").textContent = obtenerNombreVisible(usuario);

                document.getElementById("btnLogin").style.display = "none";
                document.getElementById("btnRegistro").style.display = "none";

            } else {

                document.getElementById("btnPerfil").style.display = "none";
                document.getElementById("btnPedidos").style.display = "none";
                document.getElementById("btnHistorial").style.display = "none";
                document.getElementById("btnFavoritos").style.display = "none";
                document.getElementById("btnAdmin").style.display = "none";
                document.getElementById("btnCerrarSesion").style.display = "none";

            }

            if (!usuario || usuario.rol !== "admin") {
                document.getElementById("btnAdmin").style.display = "none";
            }

            function toggleMenuUsuario() {

                const menu =
                        document.getElementById("menuUsuario");

                if (menu.style.display === "block") {

                    menu.style.display = "none";

                } else {

                    menu.style.display = "block";
                }
            }

            async function cerrarSesion() {
    await cerrarSesionPixben(window.location.href);
}
