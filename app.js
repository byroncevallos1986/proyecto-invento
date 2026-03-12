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

const login = document.getElementById("login");
const menuLogout = document.getElementById("menuLogout");
const mensaje = document.getElementById("mensaje");
const tituloPagina = document.getElementById("tituloPagina");

/* SIDEBAR */
const sidebar = document.getElementById("sidebar");

const userPhoto = document.getElementById("userPhoto");
const userEmail = document.getElementById("userEmail");

/* MENUS */
const menuDashboard = document.getElementById("menuDashboard");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");


/* =======================================================
FUNCION GLOBAL PARA ACTIVAR MENUS
======================================================= */

function activarMenu(menu, nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

/* mostrar nombre en panel central */
tituloPagina.innerHTML = nombre;

}


/* =======================================================
LOGIN GOOGLE
======================================================= */

login.onclick = async () => {

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

userPhoto.src = user.photoURL;
userEmail.innerHTML = email;

const q = query(
collection(db, "whitelist"),
where("email", "==", email),
where("enabled", "==", true)
);

const querySnapshot = await getDocs(q);

if (!querySnapshot.empty) {

mensaje.innerHTML = "ACCESO PERMITIDO: " + email;

/* limpiar pantalla principal */
login.style.display = "none";
mensaje.innerHTML = "";
tituloPagina.innerHTML = "Dashboard";

/* MOSTRAR SIDEBAR */
sidebar.style.display = "flex";

} else {

mensaje.innerHTML = "ACCESO DENEGADO";

/* OCULTAR SIDEBAR */
sidebar.style.display = "none";

await signOut(auth);

}

};


/* =======================================================
LOGOUT
======================================================= */

menuLogout.onclick = async () => {

await signOut(auth);

mensaje.innerHTML = "Sesión cerrada";

/* OCULTAR SIDEBAR */
sidebar.style.display = "none";

login.style.display = "block";

};


/* =======================================================
EVENTOS DE MENUS
======================================================= */

menuDashboard.onclick = () => {
activarMenu(menuDashboard,"Dashboard");
};

menuCategorias.onclick = () => {
activarMenu(menuCategorias,"Categorías");
};

menuProductos.onclick = () => {
activarMenu(menuProductos,"Productos");
};

menuMovimientos.onclick = () => {
activarMenu(menuMovimientos,"Movimientos");
};