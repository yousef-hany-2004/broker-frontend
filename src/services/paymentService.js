import axiosInstance from "./axiosInstance";

const BASE = "/api/v1/PaymentMethods";

export const getPaymentMethods = async () => {
  const response = await axiosInstance.get(BASE);
  return response.data;
};

export const addPaymentMethod = async (data) => {
  const response = await axiosInstance.post(BASE, data);
  return response.data;
};

export const getCheckoutStatus = async (orderReference) => {
  const response = await axiosInstance.get(
    `/api/v1/Checkout/${orderReference}/status`,
  );
  return response.data;
};

export async function createCheckoutSession(data) {
  const response = await axiosInstance.post("/api/v1/Checkout/session", data);
  return response.data;
}
