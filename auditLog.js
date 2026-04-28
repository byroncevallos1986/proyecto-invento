import { db } from "./firebase.js";

import {
collection,
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ✅ MISMA VERSIÓN

// 🔹 Generar timestamp en formato yyyymmddhhmmss
function generarTimestamp() {
    const ahora = new Date();

    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, "0");
    const dd = String(ahora.getDate()).padStart(2, "0");
    const hh = String(ahora.getHours()).padStart(2, "0");
    const min = String(ahora.getMinutes()).padStart(2, "0");
    const ss = String(ahora.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

// 🔹 Generar string aleatorio
function generarRandom(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function registrarAuditLog(log) {
    try {
        const timestamp = generarTimestamp();
        const random = generarRandom(8);

        const docId = `${timestamp}_${random}`;

        await setDoc(doc(collection(db, "audit_logs"), docId), log);

        //console.log("Audit log guardado con ID:", docId);
    } catch (error) {
        console.error("Error audit log:", error);
    }
}