//import { db } from "./firebase.js";

//import {
//collection,
//addDoc
//} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ✅ MISMA VERSIÓN

//export async function registrarAuditLog(log) {
//    try {
//        await addDoc(collection(db, "audit_logs"), log);
//        console.log("Audit log guardado");
//    } catch (error) {
//        console.error("Error audit log:", error);
//    }
//}

import { db } from "./firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("🔥 auditLog cargado");
console.log("🔥 DB IMPORTADA:", db);

export async function registrarAuditLog(log) {
  try {
    console.log("🔥 Ejecutando audit log...");

    await addDoc(collection(db, "audit_logs"), log);

    console.log("✅ Audit log guardado");
  } catch (error) {
    console.error("❌ Error audit log:", error);
  }
}
