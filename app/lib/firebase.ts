import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validação no console para detectar falta de .env.local
if (typeof window !== "undefined") {
  console.log("🔥 Verificando Projeto Firebase:", firebaseConfig.projectId || "❌ ATENÇÃO: PROJECT_ID NÃO ENCONTRADO!");
}

// Inicializa o app do Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta o banco Firestore padrão
export const db = getFirestore(app);