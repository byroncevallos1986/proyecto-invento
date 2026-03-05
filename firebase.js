import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth, GoogleAuthProvider }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDvZtnqzZMs1Ip2UZYBH8PB6ydG4bqrGF0",
    authDomain: "proyecto-invento.firebaseapp.com",
    projectId: "proyecto-invento",
    storageBucket: "proyecto-invento.firebasestorage.app",
    messagingSenderId: "581142197889",
    appId: "1:581142197889:web:d923812625e0b90cf53f80"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);