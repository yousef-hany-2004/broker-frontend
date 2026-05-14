import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../utils/tokenManager";

const DEVICE_ID_KEY = "deviceId";
const CLIENT_ID = "162ebb94-cc91-459e-8108-ca16be52e940";
const REFRESH_TOKEN_KEY = "refreshToken";

let refreshPromise = null;

// ---- Device ID ----
const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// ---- Axios Instance ----
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Id": CLIENT_ID,
  },
});

// ---- Request Interceptor ----
axiosInstance.interceptors.request.use((config) => {
  config.headers["X-Device-Id"] = getDeviceId();
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// ---- Response Interceptor ----
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh-token") &&
      !originalRequest.url.includes("/sign-in")
    ) {
      originalRequest._retry = true;

      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefreshToken) {
        clearAccessToken();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // ✅ If refresh already in progress — wait for it, don't start another
      if (refreshPromise) {
        return refreshPromise
          .then((accessToken) => {
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ✅ Start refresh — only one runs at a time
      refreshPromise = axiosInstance
        .post("/api/v1/Authentication/refresh-token", {
          refreshToken: storedRefreshToken,
        })
        .then((response) => {
          const { accessToken, refreshToken } = response.data.data;
          setAccessToken(accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          axiosInstance.defaults.headers["Authorization"] =
            `Bearer ${accessToken}`;
          return accessToken;
        })
        .catch((err) => {
          clearAccessToken();
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return Promise.reject(err);
        })
        .finally(() => {
          refreshPromise = null;
        });

      return refreshPromise.then((accessToken) => {
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      });
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
