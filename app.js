/* =====================================================
IMPORTACIÓN DE CONFIGURACIÓN FIREBASE
===================================================== */

import { auth, provider, db } from "./firebase.js";

/* =====================================================
IMPORTACIÓN DE MÉTODOS FIREBASE
===================================================== */

import {
signInWithPopup,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================================================
ELEMENTOS HTML
===================================================== */

const login = document.getElementById("login");
const mensaje = document.getElementById("mensaje");
const tituloPagina = document.getElementById("tituloPagina");

const topbar = document.getElementById("topbar");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("overlay");

const userPhotoTop = document.getElementById("userPhotoTop");
const userEmailTop = document.getElementById("userEmailTop");

/* =====================================================
MENÚS
===================================================== */

const menuDashboard = document.getElementById("menuDashboard");
const menuAdministracion = document.getElementById("menuAdministracion");
const submenuAdministracion = document.getElementById("submenuAdministracion");

const menuNuevoUsuario = document.getElementById("menuNuevoUsuario");
const menuActualizarUsuario = document.getElementById("menuActualizarUsuario");

const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");
const menuLogout = document.getElementById("menuLogout");

/* =====================================================
FUNCIONES SIDEBAR
===================================================== */

function abrirSidebar(){
sidebar.classList.add("active");
overlay.classList.add("active");
}

function cerrarSidebar(){
sidebar.classList.remove("active");
overlay.classList.remove("active");
}

menuToggle.onclick=()=>{

if(sidebar.classList.contains("active")){
cerrarSidebar();
}else{
abrirSidebar();
}

};

overlay.onclick=()=>{ cerrarSidebar(); };

/* =====================================================
ACTIVAR MENÚ
===================================================== */

function activarMenu(menu,nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

tituloPagina.innerHTML=nombre;

cerrarSidebar();

}

/* =====================================================
ABRIR SUBMENÚ ADMINISTRACIÓN
===================================================== */

menuAdministracion.onclick=()=>{

submenuAdministracion.classList.toggle("active");

};

/* =====================================================
SUBMENÚ NUEVO USUARIO
===================================================== */

menuNuevoUsuario.onclick=()=>{

tituloPagina.innerHTML="Nuevo Usuario";

cerrarSidebar();

};

/* =====================================================
SUBMENÚ ACTUALIZAR USUARIO
===================================================== */

menuActualizarUsuario.onclick=()=>{

tituloPagina.innerHTML="Actualizar Usuario";

cerrarSidebar();

};

/* =====================================================
LOGIN GOOGLE
===================================================== */

login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

/* VALIDACIÓN WHITELIST */

const q=query(
collection(db,"whitelist"),
where("email","==",email),
where("enabled","==",true)
);

const querySnapshot = await getDocs(q);

if(!querySnapshot.empty){

login.style.display="none";

topbar.style.display="flex";

tituloPagina.innerHTML="Dashboard";

userPhotoTop.src=user.photoURL;
userEmailTop.innerText=email;

activarMenu(menuDashboard,"Dashboard");

}else{

mensaje.innerHTML="ACCESO DENEGADO";

await signOut(auth);

}

}catch(error){

if(error.code==="auth/popup-closed-by-user"){

mensaje.innerHTML="Login cancelado";

}else{

mensaje.innerHTML="Error login: "+error.message;

}

}

};

/* =====================================================
LOGOUT
===================================================== */

menuLogout.onclick=async()=>{

await signOut(auth);

topbar.style.display="none";

login.style.display="block";

tituloPagina.innerHTML="INVENTO";

mensaje.innerHTML="Sesión cerrada";

cerrarSidebar();

userPhotoTop.src="";
userEmailTop.innerHTML="";

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

};

/* =====================================================
EVENTOS MENÚS
===================================================== */

menuDashboard.onclick=()=>{
activarMenu(menuDashboard,"Dashboard");
};

menuCategorias.onclick=()=>{
activarMenu(menuCategorias,"Categorías");
};

menuProductos.onclick=()=>{
activarMenu(menuProductos,"Productos");
};

menuMovimientos.onclick=()=>{
activarMenu(menuMovimientos,"Movimientos");
};