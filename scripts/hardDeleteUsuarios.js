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

/* 🔥 FECHA ECUADOR */
function obtenerFechaEcuador() {

  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Guayaquil"
    })
  );
}

async function hardDeleteUsuarios() {

  try {

    console.log("====================================");
    console.log("INICIO HARD DELETE USUARIOS");
    console.log("====================================");

    const fechaActual = obtenerFechaEcuador();

    const fechaLimite = new Date(fechaActual);

    fechaLimite.setDate(
      fechaLimite.getDate() - DIAS_HARD_DELETE
    );

    console.log("Fecha actual:", fechaActual);
    console.log("Fecha límite:", fechaLimite);

    // =========================================
    // BUSCAR USUARIOS ELIMINADOS
    // =========================================

    const usuariosSnapshot = await db
      .collection("whitelist")
      .where("eliminado", "==", true)
      .where("fechaEliminacion", "<=", fechaLimite)
      .get();

    if (usuariosSnapshot.empty) {

      console.log(
        "No existen usuarios para hard-delete"
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

      let fechaEliminacion = null;

      // 🔥 Timestamp Firestore
      if (
        usuario.fechaEliminacion &&
        typeof usuario.fechaEliminacion.toDate === "function"
      ) {

        fechaEliminacion =
          usuario.fechaEliminacion.toDate();

      }

      // 🔥 String
      else if (
        typeof usuario.fechaEliminacion === "string"
      ) {

        fechaEliminacion =
          new Date(usuario.fechaEliminacion);
      }

      // 🔥 Date
      else if (
        usuario.fechaEliminacion instanceof Date
      ) {

        fechaEliminacion =
          usuario.fechaEliminacion;
      }

      console.log(
        "fechaEliminacion:",
        fechaEliminacion
      );

      console.log(
        "fechaLimite:",
        fechaLimite
      );

      // =========================================
      // VALIDAR FECHA
      // =========================================

      if (!fechaEliminacion) {

        console.log(
          `Usuario ${doc.id} sin fechaEliminacion válida`
        );

        continue;
      }

      if (fechaEliminacion <= fechaLimite) {

        console.log(
          `Eliminando usuario definitivamente: ${doc.id}`
        );

        // =========================================
        // ELIMINAR AUDIT LOGS
        // =========================================

        const auditLogsSnapshot = await db
          .collection("audit_logs")
          .where("uid", "==", doc.id)
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

      } else {

        console.log(
          `Usuario aún dentro del período de espera: ${doc.id}`
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