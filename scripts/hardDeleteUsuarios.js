const admin = require("firebase-admin");
const {
  DIAS_HARD_DELETE
} = require("../config/lifecycleConfig");

// 🔐 Credenciales desde GitHub Secrets
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

    // 🔎 Buscar usuarios eliminados
    const usuariosSnapshot = await db
      .collection("usuarios")
      .where("eliminado", "==", true)
      .get();

    if (usuariosSnapshot.empty) {

      console.log(
        "No existen usuarios soft-delete"
      );

      return;
    }

    for (const doc of usuariosSnapshot.docs) {

      const usuario = doc.data();

      const fechaEliminacion =
        usuario.fechaEliminacion?.toDate
          ? usuario.fechaEliminacion.toDate()
          : null;

      if (!fechaEliminacion) {

        console.log(
          `Usuario ${doc.id} sin fechaEliminacion`
        );

        continue;
      }

      // ⏳ Validar antigüedad
      if (fechaEliminacion <= fechaLimite) {

        console.log(
          `Eliminando usuario: ${doc.id}`
        );

        // ====================================
        // ELIMINAR AUDIT LOGS
        // ====================================

        const auditLogsSnapshot = await db
          .collection("audit_logs")
          .where("uid", "==", doc.id)
          .get();

        if (!auditLogsSnapshot.empty) {

          const batch = db.batch();

          auditLogsSnapshot.docs.forEach((auditDoc) => {
            batch.delete(auditDoc.ref);
          });

          await batch.commit();

          console.log(
            `Audit logs eliminados: ${auditLogsSnapshot.size}`
          );

        } else {

          console.log(
            "No existen audit logs relacionados"
          );
        }

        // ====================================
        // ELIMINAR USUARIO
        // ====================================

        await db
          .collection("usuarios")
          .doc(doc.id)
          .delete();

        console.log(
          `Usuario eliminado definitivamente: ${doc.id}`
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
      "Error en hard delete:",
      error
    );

    process.exit(1);
  }
}

hardDeleteUsuarios();