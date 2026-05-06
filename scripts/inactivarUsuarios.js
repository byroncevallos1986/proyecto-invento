const admin = require("firebase-admin");
const { DIAS_INACTIVO } = require("../config/lifecycleConfig");

/* 🔐 Credenciales desde GitHub Secret */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* 🔥 FECHA ACTUAL */
function obtenerFechaActual() {
  return new Date();
}

/* 🔥 FORMATO TIMESTAMP ECUADOR STRING
   Ejemplo:
   2026-05-06T14:36:43-05:00
*/
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

  const get = (type) =>
    parts.find((p) => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}-05:00`;
}

/* 🔥 FORMATO ID AUDIT LOG
   Ejemplo:
   20260505180746_wcdf9scq
*/
function generarAuditLogId() {
  /* 🕒 Obtener fecha Ecuador */
  const fechaEcuador = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Guayaquil"
    })
  );

  const yyyy = fechaEcuador.getFullYear();

  const MM = String(
    fechaEcuador.getMonth() + 1
  ).padStart(2, "0");

  const dd = String(
    fechaEcuador.getDate()
  ).padStart(2, "0");

  const hh = String(
    fechaEcuador.getHours()
  ).padStart(2, "0");

  const mm = String(
    fechaEcuador.getMinutes()
  ).padStart(2, "0");

  const ss = String(
    fechaEcuador.getSeconds()
  ).padStart(2, "0");

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

    /* 🕒 Fecha y hora actual */
    const fechaActual = obtenerFechaActual();

    console.log("Fecha actual:", fechaActual);

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

        const fechaInactivacion =
          admin.firestore.Timestamp.fromDate(fechaActual);

        /* 🔒 Deshabilitar usuario */
        await db.collection("whitelist").doc(doc.id).update({
          enabled: false,

          fechaInactivacion: fechaInactivacion,

          fechaActualizacion:
            admin.firestore.Timestamp.fromDate(fechaActual)
        });

        /* 📝 Registrar audit log */
        const auditId = generarAuditLogId();

        /* 🔥 DATOS ANTES */
        const datosAntes = {
          anonimizado: data.anonimizado || false,
          apellidos: data.apellidos || "",
          eliminado: data.eliminado || false,
          email: data.email || "",
          enabled: true,
          fechaActualizacion:
            data.fechaActualizacion || null,
          fechaAnonimizacion:
            data.fechaAnonimizacion || null,
          fechaCreacion:
            data.fechaCreacion || null,
          fechaEliminacion:
            data.fechaEliminacion || null,
          fechaInactivacion:
            data.fechaInactivacion || null,
          fechaUltimoLogin:
            data.fechaUltimoLogin || null,
          nombres: data.nombres || "",
          permisos: data.permisos || "operador"
        };

        /* 🔥 DATOS DESPUÉS */
        const datosDespues = {
          anonimizado: data.anonimizado || false,
          apellidos: data.apellidos || "",
          eliminado: data.eliminado || false,
          email: data.email || "",
          enabled: false,
          fechaActualizacion: fechaInactivacion,
          fechaAnonimizacion:
            data.fechaAnonimizacion || null,
          fechaCreacion:
            data.fechaCreacion || null,
          fechaEliminacion:
            data.fechaEliminacion || null,
          fechaInactivacion: fechaInactivacion,
          fechaUltimoLogin:
            data.fechaUltimoLogin || null,
          nombres: data.nombres || "",
          permisos: data.permisos || "operador"
        };

        await db.collection("audit_logs").doc(auditId).set({
          accion: "AUTOM_DISABLE_USER",

          actor: {
            email: "github-actions@system.local",
            permisos: "system",
            uid: "github-actions"
          },

          cambios: {
            antes: datosAntes,
            despues: datosDespues
          },

          descripcion: "Desactivación de usuario",

          modulo: "Administracion",

          origenCambio: "automatico",

          recurso: {
            email: data.email,
            id: data.uid || doc.id,
            tipo: "usuario"
          },

          resultado: "SUCCESS",

          timestamp: obtenerFechaEcuador()
        });

        console.log(
          `Usuario ${data.email} inactivado correctamente`
        );
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