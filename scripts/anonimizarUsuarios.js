const admin = require("firebase-admin");

// Leer credenciales desde GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Obtener fecha en zona Ecuador
function obtenerFechaEcuador() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "America/Guayaquil"
  });
}

async function anonimizarUsuarios() {
  try {
    console.log("Iniciando proceso de anonimización...");

    const snapshot = await db.collection("usuarios")
      .where("enabled", "==", false)
      .where("anonimizado", "==", false)
      .get();

    const ahora = new Date();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      if (!data.fechaInactivacion) continue;

      const fechaInactiva = new Date(data.fechaInactivacion);
      const diferenciaDias = (ahora - fechaInactiva) / (1000 * 60 * 60 * 24);

      if (diferenciaDias >= 15) {

        console.log(`Anonimizando usuario: ${doc.id}`);

        await doc.ref.update({
          anonimizado: true,
          fechaAnonimizacion: obtenerFechaEcuador(),

          // Recomendado por normativa
          nombres: "ANONIMIZADO",
          apellidos: "ANONIMIZADO",
          email: null
        });
      }
    }

    console.log("Proceso finalizado correctamente.");
  } catch (error) {
    console.error("Error en anonimización:", error);
  }
}

anonimizarUsuarios();
