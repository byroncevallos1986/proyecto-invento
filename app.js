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
const logout = document.getElementById("logout");
const mensaje = document.getElementById("mensaje");


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

} else {

mensaje.innerHTML =
"ACCESO DENEGADO";

await signOut(auth);

}

};


logout.onclick = async () => {

await signOut(auth);

mensaje.innerHTML = "Sesión cerrada";

};