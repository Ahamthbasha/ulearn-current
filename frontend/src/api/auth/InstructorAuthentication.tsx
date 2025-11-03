import { API } from "../../service/axios";
import type { userData } from "../../types/userData";

import authenticationRoutes from "../../types/endPoints/authEndpoints";
import type { Login } from "../../types/LoginTypes";
import { AxiosError } from "axios";

export const signup = async (userData: userData)=> {
  try {
    const response = await API.post(
      authenticationRoutes.instructorSignUp,
      userData
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resendOtp = async (email: string)=> {
  try {
    const response = await API.post(authenticationRoutes.instructorResendOtp, {
      email,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (otp: string) => {
  try {
    const response = await API.post(authenticationRoutes.instructorVerifyOtp, {
      otp,
    });

    return response.data;
  } catch (error) {
    // Extract and throw the actual error message from backend
    if (error instanceof AxiosError && error.response?.data) {
      throw new Error(error.response.data.message || 'OTP verification failed');
    }
    throw new Error('Unexpected error occurred');
  }
};


export const login = async ({ email, password, role }: Login) => {
  try {
    const response = await API.post(
      authenticationRoutes.instructorLogin,
      { email, password, role }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await API.post(
      authenticationRoutes.instructorLogout,
      {}
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorVerifyEmail = async (email: string) => {
  try {
    const response = await API.post(
      authenticationRoutes.instructorVerifyEmail,
      { email }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorVerifyResetOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post(
      authenticationRoutes.instructorVerifyResetOtp,
      { email, otp }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorForgotResendOtp = async (email: string) => {
  try {
    const response = await API.post(
      authenticationRoutes.instructorForgotResendOtp,
      { email }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorResetPassword = async (
  password: string
)=> {
  try {
    const response = await API.post(
      authenticationRoutes.instructorResetPassword,
      { password }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const googleLogin = async (login: object)=> {
  try {
    const response = await API.post(
      authenticationRoutes.instructorGoogleLogin,
      login
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
