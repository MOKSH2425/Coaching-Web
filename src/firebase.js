import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- NEW IMPORT

const firebaseConfig = {
  apiKey: "AIzaSyAxvxML3vmPoAUWK55zKs4Rz5pnHpAv-fo",
  authDomain: "digitalforgex-app.firebaseapp.com",
  projectId: "digitalforgex-app",
  storageBucket: "digitalforgex-app.firebasestorage.app",
  messagingSenderId: "664215322390",
  appId: "1:664215322390:web:fd4d1a23ad16b07e0b1a37"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // <-- NEW INIT

export { db, auth }; // <-- EXPORT AUTH