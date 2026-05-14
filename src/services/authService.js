import axiosInstance from "./axiosInstance";

const AUTH_BASE = "/api/v1/Authentication";

export const registerUser = async (data) => {
  const response = await axiosInstance.post(`${AUTH_BASE}/register`, data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axiosInstance.post(`${AUTH_BASE}/sign-in`, data);
  return response.data;
};

export const refreshTokenRequest = async (refreshToken) => {
  const response = await axiosInstance.post(`${AUTH_BASE}/refresh-token`, {
    refreshToken,
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosInstance.post(`${AUTH_BASE}/forgot-password`, {
    email,
  });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await axiosInstance.post(
    `${AUTH_BASE}/reset-password`,
    data,
  );
  return response.data;
};

export const resendConfirmation = async (email) => {
  const response = await axiosInstance.post(
    `${AUTH_BASE}/resend-confirmation`,
    { email },
  );
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosInstance.post(
    `${AUTH_BASE}/change-password`,
    data,
  );
  return response.data;
};
