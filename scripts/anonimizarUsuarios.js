const admin = require("firebase-admin");
const { DIAS_ANOM } = require("../config/lifecycleConfig");

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
Formato igual utilizado en app.js
=====================================
*/
function obtenerFechaEcuador() {

  const ahora = new Date();

  const formatter = new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }
  );

  const parts = formatter.formatToParts(ahora);

  const get = (type) =>
    parts.find(p => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}-05:00`;
}

/*
=====================================
🔥 GENERAR TIMESTAMP
=====================================
Formato:
yyyymmddhhmmss
=====================================
*/
function generarTimestamp() {

  const ahora = new Date();

  const formatter = new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Guayaquil",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }
  );

  const parts = formatter.formatToParts(ahora);

  const get = (type) =>
    parts.find(p => p.type === type).value;

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

/*
=====================================
🔥 GENERAR STRING ALEATORIO
=====================================
*/
function generarRandom(length = 8) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {

    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

/*
=====================================
🔥 ANONIMIZAR USUARIOS
=====================================

CASOS:

1. Usuarios inactivos
2. Usuarios enviados desde
   hardDeleteUsuarios.js
3. Usuarios con más de DIAS_ANOM

=====================================
*/
async function anonimizarUsuarios() {

  try {

    console.log("Iniciando anonimización...");

    /*
    =====================================
    🔥 USUARIO RECIBIDO DESDE WORKFLOW
    =====================================
    */
    const usuarioId = process.env.USUARIO_ID;

    let snapshot = null;

    /*
    =====================================
    🔥 SI VIENE USUARIO ESPECÍFICO
    =====================================
    */
    if (usuarioId) {

      console.log(
        `Buscando usuario específico: ${usuarioId}`
      );

      const doc = await db
        .collection("whitelist")
        .doc(usuarioId)
        .get();

      if (!doc.exists) {

        console.log(
          `Usuario no encontrado: ${usuarioId}`
        );

        return;
      }

      snapshot = {
        docs: [doc]
      };

    } else {

      /*
      =====================================
      🔥 PROCESO AUTOMÁTICO GENERAL
      =====================================
      */

      snapshot = await db
        .collection("whitelist")
        .where("anonimizado", "==", false)
        .get();
    }

    const ahora = new Date();

    /*
    =====================================
    🔥 RECORRER USUARIOS
    =====================================
    */

    for (const docu of snapshot.docs) {

      const data = docu.data();

      /*
      =====================================
      🔥 VALIDAR FECHA INACTIVACIÓN
      =====================================
      */

      if (!data.fechaInactivacion) {

        console.log(
          `Usuario ${docu.id} sin fechaInactivacion`
        );

        /*
        Si viene desde workflow,
        continuar igualmente.
        */
        if (!usuarioId) {
          continue;
        }
      }

      /*
      =====================================
      🔥 SOPORTE STRING Y TIMESTAMP
      =====================================
      */

      let fechaInactiva = null;

      if (
        data.fechaInactivacion &&
        typeof data.fechaInactivacion.toDate ===
          "function"
      ) {

        fechaInactiva =
          data.fechaInactivacion.toDate();

      } else if (data.fechaInactivacion) {

        fechaInactiva =
          new Date(data.fechaInactivacion);
      }

      /*
      =====================================
      🔥 CALCULAR DIFERENCIA DÍAS
      =====================================
      */

      let diferenciaDias = DIAS_ANOM;

      if (fechaInactiva) {

        diferenciaDias =
          (ahora - fechaInactiva) /
          (1000 * 60 * 60 * 24);
      }

      console.log(`Usuario: ${docu.id}`);

      console.log(
        `Fecha Inactivación: ${fechaInactiva}`
      );

      console.log(
        `Diferencia días: ${diferenciaDias}`
      );

      /*
      =====================================
      🔥 VALIDAR DÍAS
      =====================================
      */

      if (
        diferenciaDias >= DIAS_ANOM ||
        usuarioId
      ) {

        console.log(
          `Anonimizando usuario: ${docu.id}`
        );

        /*
        =====================================
        🔥 DATOS ANTES
        =====================================
        */

        const datosAntes = { ...data };

        /*
        =====================================
        🔥 FECHA ANONIMIZACIÓN
        =====================================
        */

        const fechaAnonimizacionTimestamp =
          admin.firestore.Timestamp.now();

        /*
        =====================================
        🔥 DATOS DESPUÉS
        =====================================
        */

        const datosDespues = {
          ...data,
          anonimizado: true,
          fechaAnonimizacion:
            fechaAnonimizacionTimestamp,
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        };

        /*
        =====================================
        🔥 UPDATE USUARIO
        =====================================
        */

        await docu.ref.update({
          anonimizado: true,
          fechaAnonimizacion:
            fechaAnonimizacionTimestamp,
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        });

        console.log(
          `Usuario anonimizado: ${docu.id}`
        );

        /*
        =====================================
        🔥 AUDIT LOG
        =====================================
        */

        const docId =
          `${generarTimestamp()}_${generarRandom(8)}`;

        await db
          .collection("audit_logs")
          .doc(docId)
          .set({

            timestamp:
              obtenerFechaEcuador(),

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

    /*
    =====================================
    🔥 AUDIT LOG ERROR
    =====================================
    */

    const docId =
      `${generarTimestamp()}_${generarRandom(8)}`;

    await db
      .collection("audit_logs")
      .doc(docId)
      .set({

        timestamp:
          obtenerFechaEcuador(),

        accion: "ANONYMIZE_USER",

        modulo: "Administracion",

        descripcion:
          "Error en anonimización automática",

        actor: "SYSTEM",

        origenCambio: "automatico",

        resultado: "ERROR",

        detalleError: error.message
      });
  }
}

anonimizarUsuarios();