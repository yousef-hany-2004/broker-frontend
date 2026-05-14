import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { refreshTokenRequest } from "../services/authService";
import { setAccessToken, clearAccessToken } from "../utils/tokenManager";
import { AuthContext } from "./authContextValue";
import { getMyProfile } from "../services/profileService";
import {
  registerDeviceForNotifications,
  unregisterDeviceForNotifications,
} from "../services/notificationService";

const REFRESH_TOKEN_KEY = "refreshToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    await unregisterDeviceForNotifications();
    clearAccessToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On app start — check if user was already logged in
  useEffect(() => {
    const restoreSession = async () => {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await refreshTokenRequest(storedRefreshToken);

        if (result.succeeded) {
          setAccessToken(result.data.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
          const profile = await getMyProfile();
          if (profile.succeeded) {
            setUser(profile.data);
          } else {
            setUser({ accessToken: result.data.accessToken });
          }
          registerDeviceForNotifications();
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (data) => {
    setAccessToken(data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    try {
      const profile = await getMyProfile();
      if (profile.succeeded) {
        setUser(profile.data);
      }
    } catch {
      setUser({ accessToken: data.accessToken });
    }
    registerDeviceForNotifications();
    navigate("/");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
