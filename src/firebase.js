import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAOJAlV2s54m6RzDLjBpwAYi3COkq033b8",
  authDomain: "myapp-notifications-5b65b.firebaseapp.com",
  projectId: "myapp-notifications-5b65b",
  storageBucket: "myapp-notifications-5b65b.firebasestorage.app",
  messagingSenderId: "609866680263",
  appId: "1:609866680263:web:ce87e470639245e7abfbe2",
  measurementId: "G-T68Y83G1H4",
};

const app = initializeApp(firebaseConfig);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .catch((err) => console.error("Service worker registration failed:", err));
}

export const messaging = getMessaging(app);
