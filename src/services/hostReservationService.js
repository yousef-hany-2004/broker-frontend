import axiosInstance from "./axiosInstance";
 
/**
 * Get all reservations for the host
 * @param {object} params - { PageNumber, PageSize }
 */
export const getHostReservations = async (params = {}) => {
  const res = await axiosInstance.get("/api/v1/HostReservations/reservations", {
    params,
  });
  return res.data;
};
 
/**
 * Confirm cash collection for a specific booking
 * @param {string} bookingId
 */
export const confirmCashCollection = async (bookingId) => {
  const res = await axiosInstance.post(
    `/api/v1/HostReservations/reservations/${bookingId}/cash-collection/confirm`
  );
  return res.data;
};
 