import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function registrarAuditLog(log) {
    try {
        await addDoc(collection(db, "audit_logs"), log);
        console.log("Audit log guardado");
    } catch (error) {
        console.error("Error audit log:", error);
    }
}