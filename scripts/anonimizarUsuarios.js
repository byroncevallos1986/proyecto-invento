const admin = require("firebase-admin");
const { DIAS_ANOM } = require("../config/lifecycleConfig");

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

/* 🔹 GENERAR TIMESTAMP ECUADOR (yyyymmddhhmmss) */
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

/* 🔹 GENERAR STRING ALEATORIO */
function generarRandom(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

async function anonimizarUsuarios() {

  try {

    console.log("Iniciando anonimización...");

    const snapshot = await db
      .collection("whitelist")
      .where("enabled", "==", false)
      .where("anonimizado", "==", false)
      .get();

    const ahora = new Date();

    for (const docu of snapshot.docs) {

      const data = docu.data();

      if (!data.fechaInactivacion) {
        console.log(`Usuario ${docu.id} sin fechaInactivacion`);
        continue;
      }

      /* 🔥 SOPORTE STRING Y TIMESTAMP */
      let fechaInactiva = null;

      if (
        data.fechaInactivacion &&
        typeof data.fechaInactivacion.toDate === "function"
      ) {

        /* Timestamp Firestore */
        fechaInactiva = data.fechaInactivacion.toDate();

      } else {

        /* String antiguo */
        fechaInactiva = new Date(data.fechaInactivacion);
      }

      const diferenciaDias =
        (ahora - fechaInactiva) / (1000 * 60 * 60 * 24);

      console.log(`Usuario: ${docu.id}`);
      console.log(`Fecha Inactivación: ${fechaInactiva}`);
      console.log(`Diferencia días: ${diferenciaDias}`);

      if (diferenciaDias >= DIAS_ANOM) {

        console.log(`Anonimizando usuario: ${docu.id}`);

        /* 🔥 DATOS ANTES */
        const datosAntes = { ...data };

        /* 🔥 FECHA ANONIMIZACION TIMESTAMP */
        const fechaAnonimizacionTimestamp =
          admin.firestore.Timestamp.now();

        /* 🔥 DATOS DESPUÉS */
        const datosDespues = {
          ...data,
          anonimizado: true,
          fechaAnonimizacion: fechaAnonimizacionTimestamp,
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        };

        /* 🔥 UPDATE USUARIO */
        await docu.ref.update({
          anonimizado: true,
          fechaAnonimizacion: fechaAnonimizacionTimestamp,
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        });

        console.log(`Usuario anonimizado: ${docu.id}`);

        /* 🔥 AUDIT LOG (CON ID PERSONALIZADO) */
        const docId =
          `${generarTimestamp()}_${generarRandom(8)}`;

        await db
          .collection("audit_logs")
          .doc(docId)
          .set({

            timestamp: obtenerFechaEcuador(),

            accion: "ANONYMIZE_USER",

            modulo: "Administracion",

            descripcion:
              `Anonimización automática por inactividad (${DIAS_ANOM} días)`,

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

    /* 🔥 AUDIT LOG ERROR (CON ID PERSONALIZADO) */
    const docId =
      `${generarTimestamp()}_${generarRandom(8)}`;

    await db
      .collection("audit_logs")
      .doc(docId)
      .set({

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