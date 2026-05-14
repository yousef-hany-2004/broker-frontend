import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "../utils/tokenManager";

const HUB_URL = "https://broker-system-api.runasp.net/hubs/notifications";

let connection = null;
let retryCount = 0;
const handlers = new Set();

const registerHandlers = () => {
  handlers.forEach((callback) => {
    connection.on("ReceiveNotification", callback);
  });
};

export const startNotificationConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getAccessToken(),
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) =>
        Math.min(Math.pow(2, retryContext.previousRetryCount) * 1000, 30000),
    })
    .build();

  connection.onreconnecting(() => {
    console.log("Notifications: reconnecting...");
  });

  connection.onreconnected(() => {
    console.log("Notifications: reconnected.");
    retryCount = 0;
    registerHandlers();
  });

  connection.onclose((error) => {
    if (error) {
      const isUnauthorized =
        error?.message?.includes("401") ||
        error?.message?.includes("Unauthorized");
      if (isUnauthorized) {
        connection = null;
        retryCount = 0;
        return;
      }
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      retryCount++;
      setTimeout(() => startNotificationConnection(), delay);
    }
  });

  try {
    await connection.start();
    console.log("Notifications: connected ✓");
    retryCount = 0;
    registerHandlers();
  } catch (err) {
    const isUnauthorized =
      err?.message?.includes("401") || err?.message?.includes("Unauthorized");
    if (isUnauthorized) {
      connection = null;
      retryCount = 0;
      setTimeout(() => startNotificationConnection(), 3000);
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    retryCount++;
    setTimeout(() => startNotificationConnection(), delay);
  }
};

export const onNotificationReceived = (callback) => {
  handlers.add(callback);
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    connection.on("ReceiveNotification", callback);
  }
};

export const offNotificationReceived = (callback) => {
  if (callback) {
    handlers.delete(callback);
    connection?.off("ReceiveNotification", callback);
  } else {
    handlers.clear();
    connection?.off("ReceiveNotification");
  }
};

export const stopNotificationConnection = async () => {
  if (!connection) return;
  handlers.clear();
  await connection.stop();
  connection = null;
  retryCount = 0;
  console.log("Notifications: disconnected");
};
