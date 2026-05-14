import axiosInstance from "./axiosInstance";

const BASE = "/api/v1/PayoutMethods";

export const getPayoutMethods = async () => {
  const response = await axiosInstance.get(BASE);
  return response.data;
};

export const requestPayoutOtp = async () => {
  const response = await axiosInstance.post(`${BASE}/request-otp`);
  return response.data;
};

export const resendPayoutOtp = async (requestId) => {
  const response = await axiosInstance.post(`${BASE}/resend-otp`, {
    requestId,
  });
  return response.data;
};

export const addPayoutMethod = async (data) => {
  const response = await axiosInstance.post(BASE, data);
  return response.data;
};

// GET /api/v1/Payouts/balance — super admin only
export const getPayoutBalance = async () => {
  const response = await axiosInstance.get("/api/v1/Payouts/balance");
  return response.data;
};
