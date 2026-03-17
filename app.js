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

login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);

const user = result.user;

const email = user.email;

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

btnIngresarUsuario.onclick = async () => {

try{

const nombres = inputNombres.value.trim();
const apellidos = inputApellidos.value.trim();
const email = inputEmail.value.trim();

const errorNombres = document.getElementById("errorNombres");

/* VALIDACIÓN NOMBRES */

const regexNombres = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;

if(nombres === "" || !regexNombres.test(nombres)){

errorNombres.style.display="block";
return;

}else{

errorNombres.style.display="none";

}

/* VALIDACIÓN CAMPOS VACÍOS (resto) */

if(apellidos==="" || email===""){
alert("Debe completar todos los campos");
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