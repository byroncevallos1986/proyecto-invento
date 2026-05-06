const admin = require("firebase-admin");

const {
  DIAS_HARD_DELETE
} = require("../config/lifecycleConfig");

// 🔐 Credenciales desde GitHub Secret
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/*
=====================================
🔥 FECHA ECUADOR
=====================================
Obtiene la fecha actual utilizando
la zona horaria de Ecuador.
=====================================
*/
function obtenerFechaEcuador() {

  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Guayaquil"
    })
  );
}

/*
=====================================
🔥 CONVERTIR FECHAS
=====================================
Convierte cualquier formato de fecha
(Timestamp, String o Date)
a objeto Date.
=====================================
*/
function convertirFecha(fecha) {

  // 🔥 Timestamp Firestore
  if (
    fecha &&
    typeof fecha.toDate === "function"
  ) {

    return fecha.toDate();
  }

  // 🔥 String
  if (typeof fecha === "string") {

    return new Date(fecha);
  }

  // 🔥 Date
  if (fecha instanceof Date) {

    return fecha;
  }

  return null;
}

/*
=====================================
🔥 EJECUTAR WORKFLOW GITHUB ACTIONS
=====================================
Ejecuta el workflow de anonimización
cuando el usuario sí utilizó
la plataforma.
=====================================
*/
async function ejecutarWorkflowAnonimizacion(usuarioId) {

  try {

    console.log(
      `Ejecutando workflow Anonimizar Usuarios para: ${usuarioId}`
    );

    // =========================================
    // CONFIGURACIÓN GITHUB
    // =========================================

    const GITHUB_TOKEN = process.env.GHP_TOKEN;

    const GITHUB_OWNER = process.env.GHP_OWNER;

    const GITHUB_REPO = process.env.GHP_REPO;

    const WORKFLOW_FILE =
      process.env.GHP_ANON_WORKFLOW ||
      "anonimizacion.yml";

    // =========================================
    // VALIDAR VARIABLES
    // =========================================

    if (
      !GITHUB_TOKEN ||
      !GITHUB_OWNER ||
      !GITHUB_REPO
    ) {

      console.log(
        "Variables GitHub Actions no configuradas"
      );

      return;
    }

    // =========================================
    // EJECUTAR WORKFLOW
    // =========================================

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            usuarioId
          }
        })
      }
    );

    if (response.ok) {

      console.log(
        "Workflow Anonimizar Usuarios ejecutado correctamente"
      );

    } else {

      const errorText = await response.text();

      console.log(
        "Error ejecutando workflow GitHub Actions:"
      );

      console.log(errorText);
    }

  } catch (error) {

    console.log(
      "Error ejecutando workflow de anonimización:"
    );

    console.log(error.message);
  }
}

/*
=====================================
🔥 ELIMINAR AUDIT LOGS
=====================================
Elimina todos los audit logs
relacionados al usuario.

Se valida el campo:
recurso.id
=====================================
*/
async function eliminarAuditLogs(usuarioId) {

  try {

    const auditLogsSnapshot = await db
      .collection("audit_logs")
      .where("recurso.id", "==", usuarioId)
      .get();

    if (!auditLogsSnapshot.empty) {

      console.log(
        `Audit logs encontrados: ${auditLogsSnapshot.size}`
      );

      const batch = db.batch();

      auditLogsSnapshot.docs.forEach((auditDoc) => {

        batch.delete(auditDoc.ref);
      });

      await batch.commit();

      console.log(
        "Audit logs eliminados correctamente"
      );

    } else {

      console.log(
        "No existen audit logs relacionados"
      );
    }

  } catch (error) {

    console.log(
      "Error eliminando audit logs:"
    );

    console.log(error.message);
  }
}

/*
=====================================
🔥 ELIMINAR USUARIO DEFINITIVAMENTE
=====================================
Elimina:
- Firebase Authentication
- Firestore
- Audit Logs
=====================================
*/
async function eliminarUsuarioDefinitivamente(doc) {

  console.log(
    `Eliminando usuario definitivamente: ${doc.id}`
  );

  // =========================================
  // ELIMINAR AUDIT LOGS
  // =========================================

  await eliminarAuditLogs(doc.id);

  // =========================================
  // ELIMINAR FIREBASE AUTH
  // =========================================

  try {

    await admin.auth().deleteUser(doc.id);

    console.log(
      "Usuario eliminado de Firebase Authentication"
    );

  } catch (authError) {

    console.log(
      "No se pudo eliminar usuario de Firebase Auth:"
    );

    console.log(authError.message);
  }

  // =========================================
  // ELIMINAR DOCUMENTO FIRESTORE
  // =========================================

  await db
    .collection("whitelist")
    .doc(doc.id)
    .delete();

  console.log(
    `Usuario eliminado de Firestore: ${doc.id}`
  );
}

/*
=====================================
🔥 HARD DELETE USUARIOS
=====================================
CASOS:

1. Usuario con Soft-delete:
   - Se elimina después de
     DIAS_HARD_DELETE.

2. Usuario con 30 días:
   - Si fechaCreacion == fechaUltimoLogin
     → eliminar definitivamente.

   - Si fechaCreacion != fechaUltimoLogin
     → ejecutar Workflow
       Anonimizar Usuarios.
=====================================
*/
async function hardDeleteUsuarios() {

  try {

    console.log("====================================");
    console.log("INICIO HARD DELETE USUARIOS");
    console.log("====================================");

    const fechaActual = obtenerFechaEcuador();

    // =========================================
    // FECHA LÍMITE SOFT DELETE
    // =========================================

    const fechaLimiteSoftDelete = new Date(fechaActual);

    fechaLimiteSoftDelete.setDate(
      fechaLimiteSoftDelete.getDate() - DIAS_HARD_DELETE
    );

    // =========================================
    // FECHA LÍMITE 30 DÍAS
    // =========================================

    const fechaLimite30Dias = new Date(fechaActual);

    fechaLimite30Dias.setDate(
      fechaLimite30Dias.getDate() - 30
    );

    console.log("Fecha actual:", fechaActual);

    console.log(
      "Fecha límite Soft-delete:",
      fechaLimiteSoftDelete
    );

    console.log(
      "Fecha límite 30 días:",
      fechaLimite30Dias
    );

    // =========================================
    // BUSCAR TODOS LOS USUARIOS
    // =========================================

    const usuariosSnapshot = await db
      .collection("whitelist")
      .get();

    if (usuariosSnapshot.empty) {

      console.log(
        "No existen usuarios para procesar"
      );

      return;
    }

    console.log(
      `Usuarios encontrados: ${usuariosSnapshot.size}`
    );

    // =========================================
    // RECORRER USUARIOS
    // =========================================

    for (const doc of usuariosSnapshot.docs) {

      const usuario = doc.data();

      console.log("------------------------------------");
      console.log("Procesando usuario:", doc.id);

      // =========================================
      // CONVERTIR FECHAS
      // =========================================

      const fechaCreacion = convertirFecha(
        usuario.fechaCreacion
      );

      const fechaUltimoLogin = convertirFecha(
        usuario.fechaUltimoLogin
      );

      const fechaEliminacion = convertirFecha(
        usuario.fechaEliminacion
      );

      console.log(
        "fechaCreacion:",
        fechaCreacion
      );

      console.log(
        "fechaUltimoLogin:",
        fechaUltimoLogin
      );

      console.log(
        "fechaEliminacion:",
        fechaEliminacion
      );

      // =========================================
      // VALIDAR SOFT DELETE
      // =========================================

      if (
        usuario.eliminado === true &&
        fechaEliminacion &&
        fechaEliminacion <= fechaLimiteSoftDelete
      ) {

        console.log(
          "Usuario cumple condición de hard-delete posterior a soft-delete"
        );

        await eliminarUsuarioDefinitivamente(doc);

        continue;
      }

      // =========================================
      // VALIDAR USUARIOS CON 30 DÍAS
      // =========================================

      if (
        fechaCreacion &&
        fechaCreacion <= fechaLimite30Dias
      ) {

        console.log(
          "Usuario con más de 30 días detectado"
        );

        // =========================================
        // VALIDAR SI NUNCA UTILIZÓ EL SISTEMA
        // fechaCreacion == fechaUltimoLogin
        // =========================================

        const nuncaUsoSistema =
          fechaUltimoLogin &&
          fechaCreacion.getTime() ===
          fechaUltimoLogin.getTime();

        if (nuncaUsoSistema) {

          console.log(
            "Usuario nunca utilizó el sistema"
          );

          await eliminarUsuarioDefinitivamente(doc);

        } else {

          console.log(
            "Usuario sí utilizó el sistema"
          );

          console.log(
            "Se ejecutará Workflow Anonimizar Usuarios"
          );

          await ejecutarWorkflowAnonimizacion(doc.id);
        }

      } else {

        console.log(
          `Usuario aún no cumple condiciones: ${doc.id}`
        );
      }
    }

    console.log("====================================");
    console.log("FIN HARD DELETE");
    console.log("====================================");

  } catch (error) {

    console.error(
      "ERROR HARD DELETE:",
      error
    );

    process.exit(1);
  }
}

hardDeleteUsuarios();