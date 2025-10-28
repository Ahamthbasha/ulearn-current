import type { userData } from "../../types/userData";
import { API } from "../../service/axios";
import authenticationRoutes from "../../types/endPoints/authEndpoints";

export const adminLogin = async (userData: userData) => {
  try {
    const response = await API.post(authenticationRoutes.adminLogin, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const adminLogout = async ()=> {
  try {
    const response = await API.post(
      authenticationRoutes.adminLogout,
      {}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
