/* =====================================================
IMPORTACIÓN DE CONFIGURACIÓN FIREBASE
===================================================== */

import { auth, provider, db } from "./firebase.js";

/* =====================================================
IMPORTACIÓN DE MÉTODOS DE AUTENTICACIÓN
===================================================== */

import {
signInWithPopup,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =====================================================
IMPORTACIÓN DE FIRESTORE
===================================================== */

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
MENÚS DEL SIDEBAR
===================================================== */

const menuDashboard = document.getElementById("menuDashboard");
const menuAdministracion = document.getElementById("menuAdministracion");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");
const menuLogout = document.getElementById("menuLogout");

/* =====================================================
FUNCIONES SIDEBAR
===================================================== */

/* abre el menú lateral */

function abrirSidebar(){

sidebar.classList.add("active");
overlay.classList.add("active");

}

/* cierra el menú lateral */

function cerrarSidebar(){

sidebar.classList.remove("active");
overlay.classList.remove("active");

}

/* botón hamburguesa */

menuToggle.onclick=()=>{

if(sidebar.classList.contains("active")){
cerrarSidebar();
}else{
abrirSidebar();
}

};

/* clic en overlay */

overlay.onclick=()=>{

cerrarSidebar();

};

/* =====================================================
ACTIVAR MENÚ
===================================================== */

function activarMenu(menu,nombre){

/* remover selección de todos */

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

/* activar menú seleccionado */

menu.classList.add("active");

/* cambiar título de página */

tituloPagina.innerHTML=nombre;

/* cerrar sidebar */

cerrarSidebar();

}

/* =====================================================
LOGIN CON GOOGLE
===================================================== */

login.onclick = async () => {

try{

/* abrir login google */

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

/* =====================================================
VALIDACIÓN WHITELIST
===================================================== */

const q=query(
collection(db,"whitelist"),
where("email","==",email),
where("enabled","==",true)
);

const querySnapshot = await getDocs(q);

/* si usuario está autorizado */

if(!querySnapshot.empty){

/* ocultar botón login */

login.style.display="none";

/* mostrar topbar */

topbar.style.display="flex";

/* mostrar dashboard */

tituloPagina.innerHTML="Dashboard";

/* mostrar datos usuario */

userPhotoTop.src=user.photoURL;
userEmailTop.innerText=email;

/* activar menú dashboard */

activarMenu(menuDashboard,"Dashboard");

}else{

mensaje.innerHTML="ACCESO DENEGADO";

await signOut(auth);

}

}catch(error){

/* si usuario cancela login */

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

/* cerrar sesión */

await signOut(auth);

/* ocultar barra superior */

topbar.style.display="none";

/* mostrar login */

login.style.display="block";

/* reset título */

tituloPagina.innerHTML="INVENTO";

/* mensaje */

mensaje.innerHTML="Sesión cerrada";

/* cerrar sidebar */

cerrarSidebar();

/* limpiar datos usuario */

userPhotoTop.src="";
userEmailTop.innerHTML="";

/* desactivar todos los menús */

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

menuAdministracion.onclick=()=>{
activarMenu(menuAdministracion,"Administración");
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