const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* 🔥 FECHA ECUADOR (FORMATO IGUAL QUE app.js) */
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

async function anonimizarUsuarios() {
  try {
    console.log("Iniciando anonimización...");

    const snapshot = await db.collection("whitelist")
      .where("enabled", "==", false)
      .where("anonimizado", "==", false)
      .get();

    const ahora = new Date();

    for (const docu of snapshot.docs) {

      const data = docu.data();

      if (!data.fechaInactivacion) continue;

      const fechaInactiva = new Date(data.fechaInactivacion);
      const diferenciaDias = (ahora - fechaInactiva) / (1000 * 60 * 60 * 24);

      if (diferenciaDias >= 15) {

        console.log(`Anonimizando usuario: ${docu.id}`);

        /* 🔥 DATOS ANTES */
        const datosAntes = { ...data };

        /* 🔥 DATOS DESPUÉS */
        const datosDespues = {
          ...data,
          anonimizado: true,
          fechaAnonimizacion: obtenerFechaEcuador(),
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        };

        /* 🔥 UPDATE USUARIO */
        await docu.ref.update({
          anonimizado: true,
          fechaAnonimizacion: datosDespues.fechaAnonimizacion,
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        });

        /* 🔥 AUDIT LOG */
        await db.collection("audit_logs").add({
          timestamp: obtenerFechaEcuador(),
          accion: "ANONYMIZE_USER",
          modulo: "Administracion",
          descripcion: "Anonimización automática por inactividad (15 días)",
          actor: "SYSTEM",

          recurso: {
            tipo: "usuario",
            id: docu.id
          },

          cambios: {
            antes: datosAntes,
            despues: datosDespues
          },

          origenCambio: "automatico",
          resultado: "SUCCESS"
        });
      }
    }

    console.log("Proceso finalizado.");
  } catch (error) {

    console.error("Error:", error);

    /* 🔥 LOG ERROR GLOBAL */
    await db.collection("audit_logs").add({
      timestamp: obtenerFechaEcuador(),
      accion: "ANONYMIZE_USER",
      modulo: "Administracion",
      descripcion: "Error en anonimización automática",
      actor: "SYSTEM",
      origenCambio: "automatico",
      resultado: "ERROR",
      detalleError: error.message
    });
  }
}

anonimizarUsuarios();
