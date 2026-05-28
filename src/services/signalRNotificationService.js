import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "../utils/tokenManager";

const HUB_URL = "https://broker-system-api.runasp.net/hubs/notifications";

let connection = null;
let retryCount = 0;
const handlers = new Set();
const connectionStateHandlers = new Set();

const notifyConnectionState = (state) => {
  connectionStateHandlers.forEach((callback) => callback(state));
};

const registerHandlers = () => {
  handlers.forEach((callback) => {
    connection.on("ReceiveNotification", callback);
  });
  registerMessageHandlers();
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
    notifyConnectionState("reconnecting");
  });

  connection.onreconnected(() => {
    console.log("Notifications: reconnected.");
    retryCount = 0;
    notifyConnectionState("connected");
    registerHandlers();
  });

  connection.onclose((error) => {
    console.log("Notifications: disconnected");
    notifyConnectionState("disconnected");
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
    notifyConnectionState("disconnected");
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

export const onConnectionStateChange = (callback) => {
  connectionStateHandlers.add(callback);
  if (connection) {
    const state = connection.state === signalR.HubConnectionState.Connected ? "connected" : "disconnected";
    callback(state);
  }
};

export const offConnectionStateChange = (callback) => {
  if (callback) {
    connectionStateHandlers.delete(callback);
  } else {
    connectionStateHandlers.clear();
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


// Chat message listeners
const messageHandlers = new Set();

export const onNewMessage = (callback) => {
  messageHandlers.add(callback);
  if (connection) {
    connection.off("ReceiveMessage", callback);
    connection.on("ReceiveMessage", callback);
  }
};

export const offNewMessage = (callback) => {
  if (callback) {
    messageHandlers.delete(callback);
    connection?.off("ReceiveMessage", callback);
  } else {
    messageHandlers.clear();
    connection?.off("ReceiveMessage");
  }
};

const registerMessageHandlers = () => {
  messageHandlers.forEach((callback) => {
    connection.on("ReceiveMessage", callback);
  });
   typingHandlers.forEach((callback) => {
    connection.on("UserTyping", callback);
  });
};

export const stopNotificationConnection = async () => {
  if (!connection) return;
  handlers.clear();
  await connection.stop();
  connection = null;
  retryCount = 0;
  console.log("Notifications: disconnected");
};


// Typing indicator
const typingHandlers = new Set();

export const onTypingIndicator = (callback) => {
  typingHandlers.add(callback);
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    connection.on("UserTyping", callback);
  }
};

export const offTypingIndicator = (callback) => {
  if (callback) {
    typingHandlers.delete(callback);
    connection?.off("UserTyping", callback);
  } else {
    typingHandlers.clear();
    connection?.off("UserTyping");
  }
};

export const sendTypingIndicator = async (bookingId) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.invoke("SendTypingIndicator", bookingId);
    } catch {
      // silently fail
    }
  }
};