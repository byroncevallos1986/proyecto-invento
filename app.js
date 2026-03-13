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

/* SIDEBAR */

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("overlay");

/* USER */

const userPhoto = document.getElementById("userPhoto");
const userEmail = document.getElementById("userEmail");

const userPhotoTop = document.getElementById("userPhotoTop");
const userEmailTop = document.getElementById("userEmailTop");

/* MENUS */

const menuDashboard = document.getElementById("menuDashboard");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");
const menuLogout = document.getElementById("menuLogout");

/* =======================================================
FUNCIONES SIDEBAR
======================================================= */

function abrirSidebar(){

sidebar.classList.add("active");
overlay.classList.add("active");

}

function cerrarSidebar(){

sidebar.classList.remove("active");
overlay.classList.remove("active");

}

/* TOGGLE */

menuToggle.onclick = () => {

if(sidebar.classList.contains("active")){
cerrarSidebar();
}else{
abrirSidebar();
}

};

/* CERRAR AL HACER CLICK FUERA */

overlay.onclick = () => {

cerrarSidebar();

};

/* =======================================================
ACTIVAR MENUS
======================================================= */

function activarMenu(menu,nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

tituloPagina.innerHTML = nombre;

cerrarSidebar();

}

/* =======================================================
LOGIN GOOGLE
======================================================= */

login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

/* mostrar datos usuario */

userPhoto.src = user.photoURL;
userEmail.innerHTML = email;

userPhotoTop.src = user.photoURL;
userEmailTop.innerHTML = email;

/* validar whitelist */

const q = query(
collection(db,"whitelist"),
where("email","==",email),
where("enabled","==",true)
);

const querySnapshot = await getDocs(q);

if(!querySnapshot.empty){

login.style.display="none";

tituloPagina.innerHTML="Dashboard";

}else{

mensaje.innerHTML="ACCESO DENEGADO";

await signOut(auth);

}

}catch(error){

mensaje.innerHTML="Error login: "+error.message;

}

};

/* =======================================================
LOGOUT
======================================================= */

menuLogout.onclick = async () => {

await signOut(auth);

login.style.display="block";

tituloPagina.innerHTML="INVENTO";

mensaje.innerHTML="Sesión cerrada";

cerrarSidebar();

/* limpiar datos usuario */

userPhoto.src="";
userEmail.innerHTML="";

userPhotoTop.src="";
userEmailTop.innerHTML="";

};

/* =======================================================
EVENTOS MENUS
======================================================= */

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