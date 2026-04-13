/* ========================= */
/* NUEVO BLOQUE TABLA USUARIOS */
/* ========================= */

const tablaUsuariosContainer = document.getElementById("tablaUsuariosContainer");
const tablaUsuariosBody = document.getElementById("tablaUsuariosBody");

/* ========================= */
/* FUNCIÓN: CARGAR USUARIOS */
/* ========================= */
async function cargarUsuarios(){

try{

/* LIMPIAR TABLA */
tablaUsuariosBody.innerHTML = "";

/* CONSULTA FIRESTORE */
const snapshot = await getDocs(collection(db,"whitelist"));

snapshot.forEach(docu=>{

const data = docu.data();

/* CREAR FILA */
const tr = document.createElement("tr");

/* COLUMNAS */
tr.innerHTML = `
<td>${data.nombres}</td>
<td>${data.apellidos}</td>
<td>${data.email}</td>
<td>${data.permisos}</td>
<td>${data.enabled ? "Activo" : "Inactivo"}</td>
<td>⚙️</td>
`;

tablaUsuariosBody.appendChild(tr);

});

}catch(error){

console.error("Error cargando usuarios:", error);

}

}

/* ========================= */
/* MENÚ ACTUALIZAR USUARIO */
/* ========================= */
menuActualizarUsuario.onclick=async()=>{

tituloPagina.innerHTML="Actualizar Usuario";

/* OCULTAR FORM */
formNuevoUsuario.style.display="none";

/* MOSTRAR TABLA */
tablaUsuariosContainer.style.display="block";

/* CARGAR DATOS */
await cargarUsuarios();

cerrarSidebar();

};

/* ========================= */
/* AJUSTE GLOBAL DE MENÚ */
/* ========================= */
function activarMenu(menu,nombre){

document.querySelectorAll(".menu").forEach(m=>{
m.classList.remove("active");
});

menu.classList.add("active");

tituloPagina.innerHTML=nombre;

/* OCULTAR ELEMENTOS */
formNuevoUsuario.style.display="none";
tablaUsuariosContainer.style.display="none";

cerrarSidebar();
}

/* ========================= */
/* NUEVO USUARIO */
/* ========================= */
menuNuevoUsuario.onclick=()=>{

tituloPagina.innerHTML="Nuevo Usuario";

formNuevoUsuario.style.display="block";

/* OCULTAR TABLA */
tablaUsuariosContainer.style.display="none";

cerrarSidebar();
};