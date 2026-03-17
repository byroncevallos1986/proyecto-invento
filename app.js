import { auth, provider, db } from "./firebase.js";

import {
signInWithPopup,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
collection,
query,
where,
getDocs,
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ===== ELEMENTOS ===== */

const inputNombres = document.getElementById("inputNombres");
const inputApellidos = document.getElementById("inputApellidos");
const inputEmail = document.getElementById("inputEmail");

const errorNombres = document.getElementById("errorNombres");
const errorApellidos = document.getElementById("errorApellidos");
const errorEmail = document.getElementById("errorEmail");

const btnIngresarUsuario = document.getElementById("btnIngresarUsuario");

/* ===== VALIDACIONES ===== */

// Regex: solo letras + acentos + espacios (sin doble espacio)
const regexTexto = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+( [A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/;

// Regex email gmail
const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

/* ===== FUNCIÓN VALIDAR ===== */

async function validarFormulario(){

let valido = true;

/* limpiar errores */
errorNombres.style.display="none";
errorApellidos.style.display="none";
errorEmail.style.display="none";

/* ===== NOMBRES ===== */

const nombres = inputNombres.value.trim();

if(!regexTexto.test(nombres)){
errorNombres.style.display="block";
valido=false;
}

/* ===== APELLIDOS ===== */

const apellidos = inputApellidos.value.trim();

if(!regexTexto.test(apellidos)){
errorApellidos.style.display="block";
valido=false;
}

/* ===== EMAIL ===== */

const email = inputEmail.value.trim();

if(!regexEmail.test(email)){
errorEmail.style.display="block";
valido=false;
}else{

/* validar duplicado en firestore */

const q = query(
collection(db,"whitelist"),
where("email","==",email)
);

const result = await getDocs(q);

if(!result.empty){
errorEmail.style.display="block";
valido=false;
}

}

return valido;

}

/* ===== CREAR USUARIO ===== */

btnIngresarUsuario.onclick = async () => {

const esValido = await validarFormulario();

if(!esValido) return;

try{

const nombres = inputNombres.value.trim();
const apellidos = inputApellidos.value.trim();
const email = inputEmail.value.trim();

const docId = email.replace("@gmail.com","");

await setDoc(
doc(db,"whitelist",docId),
{
nombres,
apellidos,
email,
permisos:"operador",
enabled:true
}
);

alert("Usuario creado correctamente");

/* limpiar */
inputNombres.value="";
inputApellidos.value="";
inputEmail.value="";

}catch(error){

console.error(error);
alert("Error al crear usuario");

}

};