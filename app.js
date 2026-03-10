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

/* NUEVO */
const sidebar = document.getElementById("sidebar");
const menuHome = document.getElementById("menuHome");
const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");

login.onclick = async () => {

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

const q = query(
collection(db, "whitelist"),
where("email", "==", email),
where("enabled", "==", true)
);

const querySnapshot = await getDocs(q);

if (!querySnapshot.empty) {

mensaje.innerHTML =
"ACCESO PERMITIDO: " + email;

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