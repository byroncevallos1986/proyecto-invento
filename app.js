import { auth, provider, db } from "./firebase.js";
import { registrarAuditLog } from "./auditLog.js";

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

/* 🔥 FUNCIÓN FECHA ECUADOR CORRECTA */
function obtenerFechaEcuador() {
  const ahora = new Date();

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(ahora);
  const get = (type) => parts.find(p => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}-05:00`;
}

/* USUARIO ACTUAL */
let usuarioActual = null;

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

/* ADMINISTRACIÓN */
menuAdministracion.onclick=async ()=>{
tituloPagina.innerHTML="Administración de Usuarios";
tablaUsuarios.style.display="table";
btnAbrirModalNuevo.style.display="block";

sidebar.classList.remove("active");
overlay.classList.remove("active");

await cargarUsuarios();
};

/* MODAL */
btnAbrirModalNuevo.onclick=()=> modalNuevoUsuario.style.display="flex";
btnCancelarModal.onclick=()=> modalNuevoUsuario.style.display="none";

/* CREAR USUARIO */
btnCrearUsuarioModal.onclick = async ()=>{

const nombres = modalNombres.value.trim();
const apellidos = modalApellidos.value.trim();
const email = modalEmail.value.trim();

try{

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
fechaCreacion:fechaActual,
fechaActualizacion:fechaActual,
fechaInactivacion: null,

/* 🔥 NUEVOS CAMPOS */
anonimizado: false,
fechaAnonimizacion: null
});

/* AUDIT LOG */
await registrarAuditLog({
timestamp: obtenerFechaEcuador(),
accion: "CREATE_USER",
modulo: "Administracion",
descripcion: "Creación de nuevo usuario",
actor: usuarioActual,
recurso: { tipo: "usuario", id: nuevoId, email },
cambios: {
despues: { nombres, apellidos, email, permisos:"operador", enabled:true }
},
origenCambio: "manual",
resultado: "SUCCESS"
});

alert("Usuario creado");
modalNuevoUsuario.style.display="none";
await cargarUsuarios();

}catch(error){

await registrarAuditLog({
timestamp: obtenerFechaEcuador(),
accion: "CREATE_USER",
modulo: "Administracion",
descripcion: "Error al crear usuario",
actor: usuarioActual,
recurso: { tipo: "usuario", id: null, email },
origenCambio: "manual",
resultado: "ERROR"
});

console.error(error);
alert("Error al crear usuario");
}
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

try{

const snapshot = await getDocs(
query(collection(db,"whitelist"), where("__name__","==",editId.value))
);

let datosAntes = null;
snapshot.forEach(docu=> datosAntes = docu.data());

const datosDespues = {
nombres: editNombres.value,
apellidos: editApellidos.value,
email: editEmail.value,
permisos: editPermisos.value,
enabled: editEstado.checked
};

/* 🔥 NUEVA LÓGICA fechaInactivacion */
let fechaInactivacionValor = datosAntes.fechaInactivacion || null;

if (datosAntes.enabled === true && datosDespues.enabled === false) {
  fechaInactivacionValor = obtenerFechaEcuador();
}

if (datosAntes.enabled === false && datosDespues.enabled === true) {
  fechaInactivacionValor = null;
}

await updateDoc(doc(db,"whitelist",editId.value),{
...datosDespues,
fechaActualizacion: new Date(),
fechaInactivacion: fechaInactivacionValor
});

let accion = "UPDATE_USER";
let descripcion = "Actualización de datos de usuario";

if(datosAntes.enabled !== datosDespues.enabled){
accion = datosDespues.enabled ? "ENABLE_USER" : "DISABLE_USER";
descripcion = datosDespues.enabled ? "Activación de usuario" : "Desactivación de usuario";
}

await registrarAuditLog({
timestamp: obtenerFechaEcuador(),
accion,
modulo: "Administracion",
descripcion,
actor: usuarioActual,
recurso: {
tipo: "usuario",
id: editId.value,
email: datosDespues.email
},
cambios: {
antes: datosAntes,
despues: datosDespues
},
origenCambio: "manual",
resultado: "SUCCESS"
});

modalEditar.style.display="none";
alert("Usuario actualizado");
await cargarUsuarios();

}catch(error){

await registrarAuditLog({
timestamp: obtenerFechaEcuador(),
accion: "UPDATE_USER",
modulo: "Administracion",
descripcion: "Error al actualizar usuario",
actor: usuarioActual,
recurso: { tipo: "usuario", id: editId.value },
origenCambio: "manual",
resultado: "ERROR"
});

console.error(error);
alert("Error al actualizar usuario");
}
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

const userData = querySnapshot.docs[0].data();

usuarioActual = {
uid: querySnapshot.docs[0].id,
email: user.email,
permisos: userData.permisos
};

login.style.display="none";
topbar.style.display="flex";

userPhotoTop.src=user.photoURL;
userEmailTop.innerText=user.email;

menuAdministracion.style.display =
userData.permisos === "operador" ? "none" : "block";

}
};

/* LOGOUT */
menuLogout.onclick=async()=>{
await signOut(auth);
location.reload();
};