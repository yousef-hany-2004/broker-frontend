import axiosInstance from "./axiosInstance";

export async function upgradeToLandlord() {
  const response = await axiosInstance.post(
    "/api/v1/IdentityManagement/upgrade-to-landlord",
    {},
  );
  return response.data;
}

export async function getKycStatus() {
  const response = await axiosInstance.get(
    "/api/v1/IdentityManagement/kyc/status",
  );
  return response.data;
}
