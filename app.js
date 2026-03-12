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

/* NUEVO */
const sidebar = document.getElementById("sidebar");

const userPhoto = document.getElementById("userPhoto");
const userEmail = document.getElementById("userEmail");

const menuDashboard = document.getElementById("menuDashboard");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");

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

function activarMenu(menu){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

/* mostrar nombre en panel central */
tituloPagina.innerHTML = nombre;

}

if (!querySnapshot.empty) {

mensaje.innerHTML =
"ACCESO PERMITIDO: " + email;

/* limpiar pantalla principal */
login.style.display = "none";
mensaje.innerHTML = "";
tituloPagina.innerHTML = "Dashboard";

/* MOSTRAR SIDEBAR */
sidebar.style.display = "flex";

} else {

mensaje.innerHTML =
"ACCESO DENEGADO";

/* OCULTAR SIDEBAR */
sidebar.style.display = "none";

await signOut(auth);

}

};


menuLogout.onclick = async () => {

await signOut(auth);

mensaje.innerHTML = "Sesión cerrada";

/* OCULTAR SIDEBAR */
sidebar.style.display = "none";

};

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