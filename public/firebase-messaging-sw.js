/* global importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAOJAlV2s54m6RzDLjBpwAYi3COkq033b8",
  authDomain: "myapp-notifications-5b65b.firebaseapp.com",
  projectId: "myapp-notifications-5b65b",
  storageBucket: "myapp-notifications-5b65b.firebasestorage.app",
  messagingSenderId: "609866680263",
  appId: "1:609866680263:web:ce87e470639245e7abfbe2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/vite.svg",
  });
});
