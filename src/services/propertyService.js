import axiosInstance from "./axiosInstance";

const PROPERTY_BASE = "/api/v1/PropertyListings";

export const getProperties = async (params = {}) => {
  const response = await axiosInstance.get(PROPERTY_BASE, { params });
  return response.data;
};

export const createPropertyListing = async (data) => {
  const response = await axiosInstance.post(PROPERTY_BASE, data);
  return response.data;
};

export const uploadPropertyMedia = async (id, formData) => {
  const response = await axiosInstance.post(
    `${PROPERTY_BASE}/${id}/media`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const publishPropertyListing = async (id) => {
  const response = await axiosInstance.post(`${PROPERTY_BASE}/${id}/publish`);
  return response.data;
};

export const getManagePropertyDetails = async (id) => {
  const response = await axiosInstance.get(`${PROPERTY_BASE}/${id}/manage`);
  return response.data;
};

// GET /api/v1/PropertyListings/{id} — public property details
export const getPropertyById = async (id) => {
  const response = await axiosInstance.get(`/api/v1/PropertyListings/${id}`);
  return response.data;
};

export const getManageListings = async (params = {}) => {
  const response = await axiosInstance.get(`${PROPERTY_BASE}/manage`, {
    params,
  });
  return response.data;
};

export const updatePropertyListing = async (id, data) => {
  const response = await axiosInstance.put(
    `/api/v1/PropertyListings/${id}`,
    data,
  );
  if (response.status === 200 || response.status === 204) {
    return { succeeded: true };
  }
  return response.data;
};

export const deletePropertyListing = async (id) => {
  const response = await axiosInstance.delete(`/api/v1/PropertyListings/${id}`);
  // backend may return empty body on success
  if (response.status === 200 || response.status === 204) {
    return { succeeded: true };
  }
  return response.data;
};

export const configureRentalRules = async (propertyId, data) => {
  const response = await axiosInstance.put(
    `/api/v1/PropertyListings/${propertyId}/rental-rules`,
    data,
  );
  return response.data;
};

export const deletePropertyMedia = async (propertyId, mediaId) => {
  const response = await axiosInstance.delete(
    `/api/v1/PropertyListings/${propertyId}/media/${mediaId}`,
  );
  return response.data;
};
