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
  const ahora = new Date();

  return new Date(
    ahora.toLocaleString("en-US", {
      timeZone: "America/Guayaquil"
    })
  );
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

        /* 📝 Registrar auditlog */
        const auditId = `audit_${Date.now()}_${doc.id}`;

        await db.collection("auditlogs").doc(auditId).set({
          accion: "AUTO_DISABLE_USER",
          usuario: data.email,
          detalle: `Usuario inactivado automáticamente después de ${DIAS_INACTIVO} días sin login`,
          fecha: admin.firestore.Timestamp.fromDate(fechaActual)
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