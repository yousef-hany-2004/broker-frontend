import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import axiosInstance from "./axiosInstance";

const VAPID_KEY =
  "BFcIpr07qGAp63H-zYow46r4-Vpd-X8RInSJdXHKPTqaROrzQI5JFTKPpgDRAX52dfja0cXWUiSHjIvGXqeS5f0";

const FCM_TOKEN_KEY = "fcmToken";

export async function registerDeviceForNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    const savedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (savedToken === token) return;

    await axiosInstance.post("/api/v1/Notifications/register-device", {
      token,
      provider: 1,
      deviceName: navigator.userAgent,
    });

    localStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to register device for notifications:", error);
  }
}

export async function unregisterDeviceForNotifications() {
  try {
    await axiosInstance.post("/api/v1/Notifications/unregister-device", {});
    localStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to unregister device:", error);
  }
}

export function listenToForegroundMessages(callback) {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export async function getNotifications(params) {
  const response = await axiosInstance.get("/api/v1/Notifications", { params });
  return response.data;
}

export async function getUnreadCount() {
  const response = await axiosInstance.get(
    "/api/v1/Notifications/unread-count",
  );
  return response.data;
}

export async function markAsRead(id) {
  const response = await axiosInstance.patch(
    `/api/v1/Notifications/${id}/read`,
  );
  if (response.status === 204 || response.status === 200)
    return { succeeded: true };
  return response.data;
}

export async function markAllAsRead() {
  const response = await axiosInstance.patch("/api/v1/Notifications/read-all");
  if (response.status === 204 || response.status === 200)
    return { succeeded: true };
  return response.data;
}
