import { auth, provider, db } from "./firebase.js";

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

/* ELEMENTOS */

const login = document.getElementById("login");
const mensaje = document.getElementById("mensaje");
const tituloPagina = document.getElementById("tituloPagina");

const topbar = document.getElementById("topbar");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("overlay");

const userPhotoTop = document.getElementById("userPhotoTop");
const userEmailTop = document.getElementById("userEmailTop");

/* MENUS */

const menuDashboard = document.getElementById("menuDashboard");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");
const menuLogout = document.getElementById("menuLogout");

/* ================================
SIDEBAR
================================ */

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

overlay.onclick=()=>{

cerrarSidebar();

};

/* ================================
ACTIVAR MENUS
================================ */

function activarMenu(menu,nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

tituloPagina.innerHTML=nombre;

cerrarSidebar();

}

/* ================================
LOGIN
================================ */

login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

/* validar whitelist */

const q=query(
collection(db,"whitelist"),
where("email","==",email),
where("enabled","==",true)
);

const querySnapshot = await getDocs(q);

if(!querySnapshot.empty){

/* ocultar login */

login.style.display="none";

/* mostrar topbar */

topbar.style.display="flex";

/* dashboard */

tituloPagina.innerHTML="Dashboard";

/* datos usuario */

userPhotoTop.src=user.photoURL;
userEmailTop.innerText=email;

/* activar menu dashboard */

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

/* ================================
LOGOUT
================================ */

menuLogout.onclick=async()=>{

await signOut(auth);

/* ocultar barra */

topbar.style.display="none";

/* mostrar login */

login.style.display="block";

/* reset titulo */

tituloPagina.innerHTML="INVENTO";

/* mensaje */

mensaje.innerHTML="Sesión cerrada";

/* cerrar sidebar */

cerrarSidebar();

/* limpiar usuario */

userPhotoTop.src="";
userEmailTop.innerHTML="";

/* desactivar menus */

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

};

/* ================================
MENUS
================================ */

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