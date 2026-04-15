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
setDoc,
updateDoc
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

const formNuevoUsuario = document.getElementById("formNuevoUsuario");

const tablaUsuarios = document.getElementById("tablaUsuarios");
const tbodyUsuarios = document.getElementById("tbodyUsuarios");

const inputNombres = document.getElementById("inputNombres");
const inputApellidos = document.getElementById("inputApellidos");
const inputEmail = document.getElementById("inputEmail");

const btnIngresarUsuario = document.getElementById("btnIngresarUsuario");

const menuAdministracion = document.getElementById("menuAdministracion");
const submenuAdministracion = document.getElementById("submenuAdministracion");

const menuNuevoUsuario = document.getElementById("menuNuevoUsuario");
const menuActualizarUsuario = document.getElementById("menuActualizarUsuario");

const menuLogout = document.getElementById("menuLogout");

/* MODAL */
const modalEditar = document.getElementById("modalEditar");
const editId = document.getElementById("editId");
const editNombres = document.getElementById("editNombres");
const editApellidos = document.getElementById("editApellidos");
const editEmail = document.getElementById("editEmail");
const editPermisos = document.getElementById("editPermisos");
const editEstado = document.getElementById("editEstado");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");

/* SIDEBAR */
function abrirSidebar(){
sidebar.classList.add("active");
overlay.classList.add("active");
}

function cerrarSidebar(){
sidebar.classList.remove("active");
overlay.classList.remove("active");
}

menuToggle.onclick=()=>{
sidebar.classList.contains("active") ? cerrarSidebar() : abrirSidebar();
};

overlay.onclick=()=>cerrarSidebar();

/* MENÚ */
menuAdministracion.onclick=()=>{
submenuAdministracion.classList.toggle("active");
};

menuNuevoUsuario.onclick=()=>{
tituloPagina.innerHTML="Nuevo Usuario";
formNuevoUsuario.style.display="block";
tablaUsuarios.style.display="none";
cerrarSidebar();
};

menuActualizarUsuario.onclick=async ()=>{
tituloPagina.innerHTML="Administración de Usuarios";
formNuevoUsuario.style.display="none";
tablaUsuarios.style.display="table";

await cargarUsuarios();

cerrarSidebar();
};

/* ========================= */
/* CARGAR USUARIOS */
/* ========================= */
async function cargarUsuarios(){

tbodyUsuarios.innerHTML="";

const snapshot = await getDocs(collection(db,"whitelist"));

snapshot.forEach(docu=>{

const data = docu.data();

const estado = data.enabled ? 
'<span class="estado-activo">Activo</span>' :
'<span class="estado-inactivo">Inactivo</span>';

const fila = `
<tr>
<td>${data.nombres}</td>
<td>${data.apellidos}</td>
<td>${data.email}</td>
<td>${data.permisos}</td>
<td>${estado}</td>
<td>
<button onclick="editarUsuario('${docu.id}','${data.nombres}','${data.apellidos}','${data.email}','${data.permisos}','${data.enabled}')">
✏️
</button>
</td>
</tr>
`;

tbodyUsuarios.innerHTML += fila;

});

}

/* ========================= */
/* EDITAR USUARIO */
/* ========================= */
window.editarUsuario = (id,nombres,apellidos,email,permisos,enabled)=>{

editId.value = id;
editNombres.value = nombres;
editApellidos.value = apellidos;
editEmail.value = email;
editPermisos.value = permisos;
editEstado.value = enabled;

modalEditar.style.display="flex";

};

/* GUARDAR CAMBIOS */
btnGuardarCambios.onclick = async ()=>{

const id = editId.value;

await updateDoc(doc(db,"whitelist",id),{
nombres: editNombres.value.trim(),
apellidos: editApellidos.value.trim(),
email: editEmail.value.trim(),
permisos: editPermisos.value.trim(),
enabled: editEstado.value === "true"
});

modalEditar.style.display="none";

alert("Usuario actualizado");

await cargarUsuarios();

};

/* ========================= */
/* LOGIN */
/* ========================= */
login.onclick = async () => {

try{

const result = await signInWithPopup(auth, provider);
const user = result.user;

const q=query(
collection(db,"whitelist"),
where("email","==",user.email),
where("enabled","==",true)
);

const querySnapshot = await getDocs(q);

if(!querySnapshot.empty){

login.style.display="none";
topbar.style.display="flex";

userPhotoTop.src=user.photoURL;
userEmailTop.innerText=user.email;

tituloPagina.innerHTML="Dashboard";

}else{
mensaje.innerHTML="ACCESO DENEGADO";
await signOut(auth);
}

}catch(error){
mensaje.innerHTML="Error login: "+error.message;
}

};

/* LOGOUT */
menuLogout.onclick=async()=>{

await signOut(auth);

topbar.style.display="none";
formNuevoUsuario.style.display="none";
tablaUsuarios.style.display="none";

login.style.display="block";

tituloPagina.innerHTML="INVENTO";
mensaje.innerHTML="Sesión cerrada";

};

/* ========================= */
/* CREAR USUARIO */
/* ========================= */
btnIngresarUsuario.onclick = async () => {

const nombres = inputNombres.value.trim();
const apellidos = inputApellidos.value.trim();
const email = inputEmail.value.trim();

const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

if(!regex.test(nombres) || !regex.test(apellidos) || !regexEmail.test(email)){
alert("Datos inválidos");
return;
}

const snapshot = await getDocs(collection(db,"whitelist"));

let max = 0;
snapshot.forEach(docu=>{
const num = parseInt(docu.id.replace("user",""));
if(num > max) max = num;
});

const nuevoId = "user" + String(max + 1).padStart(4,"0");

await setDoc(doc(db,"whitelist",nuevoId),{
nombres,
apellidos,
email,
permisos:"operador",
enabled:true,
creacion:new Date()
});

alert("Usuario creado");

inputNombres.value="";
inputApellidos.value="";
inputEmail.value="";
};