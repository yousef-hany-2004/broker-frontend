const ACCESS_TOKEN_KEY = "accessToken_session";

export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getAccessToken = () => {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? null;
};

export const clearAccessToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};