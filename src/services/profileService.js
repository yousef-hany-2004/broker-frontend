import axiosInstance from "./axiosInstance";

const PROFILE_BASE = "/api/v1/Profiles";

export const getMyProfile = async () => {
  const response = await axiosInstance.get(`${PROFILE_BASE}/me`);
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await axiosInstance.put(`${PROFILE_BASE}/me`, data);
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await axiosInstance.get(`${PROFILE_BASE}/${userId}`);
  return response.data;
};
