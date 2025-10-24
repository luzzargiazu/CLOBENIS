import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// 👇 PEGA AQUÍ TU CONFIGURACIÓN (la que copiaste)
const firebaseConfig = {
  apiKey: "AIzaSyA9ncyal_vgDFBB9NqC8ef3H0v__BQuNeg",
  authDomain: "globenis-22573.firebaseapp.com",
  projectId: "globenis-22573",
  storageBucket: "globenis-22573.firebasestorage.app",
  messagingSenderId: "1027262938755",
  appId: "1:1027262938755:web:75ae3f31735495d91825b6",
  measurementId: "G-DKGXN8BRCN"
}

// Inicializa Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Exporta los servicios
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;