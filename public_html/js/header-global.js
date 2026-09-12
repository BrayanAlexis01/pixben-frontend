(function(){
    "use strict";
    function iniciar(){
        const menu=document.getElementById("menuUsuario");
        if(!menu) return;
        const usuario=typeof obtenerUsuarioSesion==="function"?obtenerUsuarioSesion():null;
        const mostrar=(id,visible=true)=>{const el=document.getElementById(id);if(!el)return;el.classList.toggle("sesion-oculto",!visible);el.setAttribute("aria-hidden",visible?"false":"true");};
        const nombre=document.getElementById("nombreUsuarioHeader");
        if(usuario){
            if(nombre) nombre.textContent=typeof obtenerNombreVisible==="function"?obtenerNombreVisible(usuario):(usuario.nombre||usuario.alias||"");
            mostrar("btnLogin",false); mostrar("btnRegistro",false);
            mostrar("btnPerfil",true); mostrar("btnPedidos",true); mostrar("btnHistorial",true); mostrar("btnFavoritos",true); mostrar("btnCerrarSesion",true);
        }else{
            if(nombre) nombre.textContent="";
            mostrar("btnLogin",true); mostrar("btnRegistro",true); mostrar("btnPerfil",false); mostrar("btnHistorial",false); mostrar("btnFavoritos",false); mostrar("btnCerrarSesion",false);
            const pedidos=document.getElementById("btnPedidos"); if(pedidos) pedidos.textContent="Consultar pedido";
        }
        mostrar("btnAdmin",Boolean(usuario&&usuario.rol==="admin"));
        window.toggleMenuUsuario=function(){
            const abierto=menu.classList.toggle("abierto");
            const boton=document.getElementById("btnUsuarioMenu");
            if(boton) boton.setAttribute("aria-expanded",String(abierto));
        };
        window.cerrarSesion=async function(){
            if(typeof cerrarSesionPixben==="function") await cerrarSesionPixben(window.location.href);
        };
        document.addEventListener("click",e=>{
            if(!e.target.closest(".usuario-menu")){
                menu.classList.remove("abierto");
                document.getElementById("btnUsuarioMenu")?.setAttribute("aria-expanded","false");
            }
        });
        document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.classList.remove("abierto");document.getElementById("btnUsuarioMenu")?.setAttribute("aria-expanded","false");}});
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar);else iniciar();
})();
