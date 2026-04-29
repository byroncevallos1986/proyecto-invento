const admin = require("firebase-admin");
const { DIAS_SOFT_DELETE } = require("../config/lifecycleConfig");

// 🔐 Credenciales desde GitHub Secret
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* 🔥 FUNCIÓN FECHA ECUADOR (ISO) */
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

/* 🔥 TIMESTAMP PARA ID (yyyymmddhhmmss) */
function generarTimestamp() {
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

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

/* 🔥 RANDOM PARA ID */
function generarRandom(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* 🔥 GENERAR ID AUDIT LOG */
function generarAuditLogId() {
  return `${generarTimestamp()}_${generarRandom(8)}`;
}

async function ejecutarSoftDelete() {

  const ahora = new Date();

  const fechaLimite = new Date(
    ahora.getTime() - DIAS_SOFT_DELETE * 24 * 60 * 60 * 1000
  );

  console.log("Fecha límite:", fechaLimite);

  const snapshot = await db.collection("whitelist")
    .where("anonimizado", "==", true)
    .where("eliminado", "==", false)
    .where("fechaAnonimizacion", "<=", fechaLimite)
    .get();

  console.log("Usuarios a procesar:", snapshot.size);

  for (const docItem of snapshot.docs) {

    const userId = docItem.id;

    try {

      // 🔹 SOFT DELETE
      await docItem.ref.update({
        eliminado: true,
        fechaEliminacion: obtenerFechaEcuador()
      });

      // 🔹 AUDIT LOG SUCCESS
      const auditId = generarAuditLogId();

      await db.collection("audit_logs").doc(auditId).set({
        timestamp: obtenerFechaEcuador(),
        accion: "SOFT_DELETE_USER",
        modulo: "Automatizacion",
        descripcion: `Soft delete automático por antigüedad (${DIAS_SOFT_DELETE} días)`,
        actor: "github_actions",
        recurso: {
          tipo: "usuario",
          id: userId
        },
        origenCambio: "automatico",
        resultado: "SUCCESS"
      });

      console.log(`Usuario ${userId} eliminado lógicamente`);

    } catch (error) {

      console.error("Error con usuario:", userId, error);

      // 🔹 AUDIT LOG ERROR
      const auditIdError = generarAuditLogId();

      await db.collection("audit_logs").doc(auditIdError).set({
        timestamp: obtenerFechaEcuador(),
        accion: "SOFT_DELETE_USER",
        modulo: "Automatizacion",
        descripcion: "Error en soft delete",
        actor: "github_actions",
        recurso: {
          tipo: "usuario",
          id: userId
        },
        origenCambio: "automatico",
        resultado: "ERROR",
        error: error.message
      });
    }
  }
}

ejecutarSoftDelete();
