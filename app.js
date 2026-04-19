import { auth, provider, db } from "./firebase.js";

import {
signInWithPopup,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
collection,
getDocs,
doc,
setDoc,
updateDoc,
query,
where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ELEMENTOS */
const login = document.getElementById("login");
const tituloPagina = document.getElementById("tituloPagina");

const topbar = document.getElementById("topbar");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("overlay");

const userPhotoTop = document.getElementById("userPhotoTop");
const userEmailTop = document.getElementById("userEmailTop");

const tablaUsuarios = document.getElementById("tablaUsuarios");
const tbodyUsuarios = document.getElementById("tbodyUsuarios");

const menuAdministracion = document.getElementById("menuAdministracion");
const menuLogout = document.getElementById("menuLogout");

/* MODALES */
const modalNuevoUsuario = document.getElementById("modalNuevoUsuario");
const modalEditar = document.getElementById("modalEditar");

const btnAbrirModalNuevo = document.getElementById("btnAbrirModalNuevo");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const btnCrearUsuarioModal = document.getElementById("btnCrearUsuarioModal");

const modalNombres = document.getElementById("modalNombres");
const modalApellidos = document.getElementById("modalApellidos");
const modalEmail = document.getElementById("modalEmail");

/* EDITAR */
const editId = document.getElementById("editId");
const editNombres = document.getElementById("editNombres");
const editApellidos = document.getElementById("editApellidos");
const editEmail = document.getElementById("editEmail");
const editPermisos = document.getElementById("editPermisos");
const editEstado = document.getElementById("editEstado");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");

/* SIDEBAR */
menuToggle.onclick=()=>{
sidebar.classList.toggle("active");
overlay.classList.toggle("active");
};

overlay.onclick=()=>{
sidebar.classList.remove("active");
overlay.classList.remove("active");
};

/* ADMINISTRACIÓN (SIN SUBMENÚ) */
menuAdministracion.onclick=async ()=>{
tituloPagina.innerHTML="Administración de Usuarios";
tablaUsuarios.style.display="table";
btnAbrirModalNuevo.style.display="block";

/* NUEVO: cerrar sidebar */
sidebar.classList.remove("active");
overlay.classList.remove("active");

await cargarUsuarios();
};

/* MODAL */
btnAbrirModalNuevo.onclick=()=> modalNuevoUsuario.style.display="flex";
btnCancelarModal.onclick=()=> modalNuevoUsuario.style.display="none";

/* CREAR */
btnCrearUsuarioModal.onclick = async ()=>{

const nombres = modalNombres.value.trim();
const apellidos = modalApellidos.value.trim();
const email = modalEmail.value.trim();

const snapshot = await getDocs(collection(db,"whitelist"));

let max = 0;
snapshot.forEach(docu=>{
const num = parseInt(docu.id.replace("user",""));
if(num > max) max = num;
});

const nuevoId = "user" + String(max + 1).padStart(4,"0");

const fechaActual = new Date();

await setDoc(doc(db,"whitelist",nuevoId),{
nombres,
apellidos,
email,
permisos:"operador",
enabled:true,
creacion:fechaActual,
fechaActualizacion:fechaActual,
fechaInactivacion:fechaActual
});

alert("Usuario creado");

modalNuevoUsuario.style.display="none";

await cargarUsuarios();
};

/* CARGAR */
async function cargarUsuarios(){

tbodyUsuarios.innerHTML="";

const snapshot = await getDocs(collection(db,"whitelist"));

snapshot.forEach(docu=>{
const data = docu.data();

const fila = `
<tr>
<td>${data.nombres}</td>
<td>${data.apellidos}</td>
<td>${data.email}</td>
<td>${data.permisos}</td>
<td>${data.enabled ? "Activo" : "Inactivo"}</td>
<td>
<button onclick="editarUsuario('${docu.id}','${data.nombres}','${data.apellidos}','${data.email}','${data.permisos}','${data.enabled}')">✏️</button>
</td>
</tr>
`;

tbodyUsuarios.innerHTML += fila;

});
}

/* EDITAR */
window.editarUsuario = (id,nombres,apellidos,email,permisos,enabled)=>{
editId.value=id;
editNombres.value=nombres;
editApellidos.value=apellidos;
editEmail.value=email;
editPermisos.value=permisos;
editEstado.checked = enabled;
modalEditar.style.display="flex";
};

/* GUARDAR */
btnGuardarCambios.onclick = async ()=>{

await updateDoc(doc(db,"whitelist",editId.value),{
nombres: editNombres.value,
apellidos: editApellidos.value,
email: editEmail.value,
permisos: editPermisos.value,
enabled: editEstado.checked,
fechaActualizacion: new Date()
});

modalEditar.style.display="none";
alert("Usuario actualizado");
await cargarUsuarios();
};

/* LOGIN */
login.onclick = async ()=>{
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
}
};

/* LOGOUT */
menuLogout.onclick=async()=>{
await signOut(auth);
location.reload();
};