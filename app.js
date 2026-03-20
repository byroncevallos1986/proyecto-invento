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

const login = document.getElementById("login");
const mensaje = document.getElementById("mensaje");
const tituloPagina = document.getElementById("tituloPagina");

const topbar = document.getElementById("topbar");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("overlay");

const userPhotoTop = document.getElementById("userPhotoTop");
const userEmailTop = document.getElementById("userEmailTop");

const formNuevoUsuario = document.getElementById("formNuevoUsuario");

const inputNombres = document.getElementById("inputNombres");
const inputApellidos = document.getElementById("inputApellidos");
const inputEmail = document.getElementById("inputEmail");

const btnIngresarUsuario = document.getElementById("btnIngresarUsuario");

const menuDashboard = document.getElementById("menuDashboard");
const menuAdministracion = document.getElementById("menuAdministracion");
const submenuAdministracion = document.getElementById("submenuAdministracion");

const menuNuevoUsuario = document.getElementById("menuNuevoUsuario");
const menuActualizarUsuario = document.getElementById("menuActualizarUsuario");

const menuCategorias = document.getElementById("menuCategorias");
const menuProductos = document.getElementById("menuProductos");
const menuMovimientos = document.getElementById("menuMovimientos");
const menuLogout = document.getElementById("menuLogout");

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

function activarMenu(menu,nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

tituloPagina.innerHTML=nombre;

/* OCULTAR FORMULARIOS */
formNuevoUsuario.style.display="none";

cerrarSidebar();
}

menuAdministracion.onclick=()=>{
submenuAdministracion.classList.toggle("active");
};

menuNuevoUsuario.onclick=()=>{
tituloPagina.innerHTML="Nuevo Usuario";
formNuevoUsuario.style.display="block";
cerrarSidebar();
};

menuActualizarUsuario.onclick=()=>{
tituloPagina.innerHTML="Actualizar Usuario";
formNuevoUsuario.style.display="none";
cerrarSidebar();
};

/* ========================= */
/* LOGIN */
/* ========================= */
login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);

const user = result.user;
const email = user.email;

/* 🔴 LIMPIAR MENSAJES */
mensaje.innerHTML = "";

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

mensaje.innerHTML="Error login: "+error.message;

}

};

/* ========================= */
/* LOGOUT */
/* ========================= */
menuLogout.onclick=async()=>{

await signOut(auth);

topbar.style.display="none";
formNuevoUsuario.style.display="none";

login.style.display="block";

tituloPagina.innerHTML="INVENTO";
mensaje.innerHTML="Sesión cerrada";

cerrarSidebar();

userPhotoTop.src="";
userEmailTop.innerHTML="";

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

submenuAdministracion.classList.remove("active");

};

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

/* ========================= */
/* CREAR USUARIO */
/* ========================= */
btnIngresarUsuario.onclick = async () => {

try{

const nombres = inputNombres.value.trim();
const apellidos = inputApellidos.value.trim();
const email = inputEmail.value.trim();

const errorNombres = document.getElementById("errorNombres");
const errorApellidos = document.getElementById("errorApellidos");
const errorEmail = document.getElementById("errorEmail");

const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;

/* VALIDACIÓN NOMBRES */
if(nombres === "" || !regex.test(nombres)){
errorNombres.style.display="block";
}else{
errorNombres.style.display="none";
}

/* VALIDACIÓN APELLIDOS */
if(apellidos === "" || !regex.test(apellidos)){
errorApellidos.style.display="block";
}else{
errorApellidos.style.display="none";
}

/* VALIDACIÓN EMAIL */
const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

let emailValido = true;

if(email === "" || !regexEmail.test(email)){
errorEmail.style.display="block";
emailValido = false;
}else{

const q = query(
collection(db,"whitelist"),
where("email","==",email)
);

const querySnapshot = await getDocs(q);

if(!querySnapshot.empty){
errorEmail.style.display="block";
emailValido = false;
}else{
errorEmail.style.display="none";
}

}

if(
nombres === "" || !regex.test(nombres) ||
apellidos === "" || !regex.test(apellidos) ||
!emailValido
){
return;
}

const docId = email.replace("@gmail.com","");

await setDoc(
doc(db,"whitelist",docId),
{
nombres:nombres,
apellidos:apellidos,
email:email,
permisos:"operador",
enabled:true
}
);

alert("Usuario creado correctamente");

inputNombres.value="";
inputApellidos.value="";
inputEmail.value="";

}catch(error){

console.error(error);
alert("Error al crear usuario");

}

};