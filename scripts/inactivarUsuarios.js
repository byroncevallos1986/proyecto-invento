const admin = require("firebase-admin");
const { DIAS_INACTIVO } = require("../config/lifecycleConfig");

/* 🔐 Credenciales desde GitHub Secret */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* 🔥 FUNCIÓN FECHA ECUADOR */
function obtenerFechaEcuador() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Guayaquil"
    })
  );
}

/* 🔥 FORMATO ID AUDIT LOG
   Ejemplo:
   20260505173024_CQ9o9fZS
*/
function generarAuditLogId() {
  const fecha = obtenerFechaEcuador();

  const yyyy = fecha.getFullYear();
  const MM = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");

  const hh = String(fecha.getHours()).padStart(2, "0");
  const mm = String(fecha.getMinutes()).padStart(2, "0");
  const ss = String(fecha.getSeconds()).padStart(2, "0");

  const random = Math.random()
    .toString(36)
    .substring(2, 10);

  return `${yyyy}${MM}${dd}${hh}${mm}${ss}_${random}`;
}

async function inactivarUsuarios() {
  try {
    console.log("========================================");
    console.log("INICIO PROCESO INACTIVACIÓN AUTOMÁTICA");
    console.log("========================================");

    /* 🕒 Fecha y hora Ecuador */
    const fechaActual = obtenerFechaEcuador();

    console.log("Fecha actual Ecuador:", fechaActual);

    /* 🔍 Obtener usuarios habilitados */
    const snapshot = await db
      .collection("whitelist")
      .where("enabled", "==", true)
      .get();

    if (snapshot.empty) {
      console.log("No existen usuarios activos.");
      return;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();

      const fechaUltimoLogin = data.fechaUltimoLogin;

      if (!fechaUltimoLogin) {
        console.log(`Usuario ${data.email} no tiene fechaUltimoLogin`);
        continue;
      }

      /* 🔥 Convertir Timestamp Firestore → Date */
      const fechaLogin = fechaUltimoLogin.toDate();

      const diferenciaMs = fechaActual - fechaLogin;

      const diferenciaDias = Math.floor(
        diferenciaMs / (1000 * 60 * 60 * 24)
      );

      console.log("----------------------------------------");
      console.log("Usuario:", data.email);
      console.log("Último login:", fechaLogin);
      console.log("Días sin login:", diferenciaDias);

      /* 🚨 Validar inactividad */
      if (diferenciaDias >= DIAS_INACTIVO) {
        console.log(`Inactivando usuario ${data.email}`);

        /* 🔒 Deshabilitar usuario */
        await db.collection("whitelist").doc(doc.id).update({
          enabled: false,

          /* 🕒 Timestamp Ecuador */
          fechaInactivacion: admin.firestore.Timestamp.fromDate(
            fechaActual
          ),

          fechaActualizacion: admin.firestore.Timestamp.fromDate(
            fechaActual
          )
        });

        /* 📝 Registrar audit log */
        const auditId = generarAuditLogId();

        await db.collection("audit_logs").doc(auditId).set({
          accion: "AUTO_DISABLE_USER",

          actor: {
            email: "github-actions@system.local",
            permisos: "system",
            uid: "github-actions"
          },

          cambios: {
            antes: {
              enabled: true
            },

            despues: {
              enabled: false,
              fechaInactivacion: admin.firestore.Timestamp.fromDate(
                fechaActual
              )
            }
          },

          detalle: `Usuario inactivado automáticamente después de ${DIAS_INACTIVO} días sin login`,

          usuarioObjetivo: {
            email: data.email,
            uid: data.uid || doc.id
          },

          fecha: admin.firestore.Timestamp.fromDate(
            fechaActual
          )
        });

        console.log(`Usuario ${data.email} inactivado correctamente`);
      }
    }

    console.log("========================================");
    console.log("FIN PROCESO INACTIVACIÓN");
    console.log("========================================");

  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

inactivarUsuarios();