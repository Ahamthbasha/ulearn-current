import { API } from "../../service/axios";

import authenticationRoutes from "../../types/endPoints/authEndpoints";

import type { userData } from "../../types/userData";

import type { Login } from "../../types/LoginTypes";


export const signup = async (userData: userData)=> {
  try {
    const response = await API.post(
      authenticationRoutes.studentSignUp,
      userData
    );
    return response.data;
  } catch (error) {
    throw error
  }
};

export const resendOtp = async (email: string)=> {
  try {
    const response = await API.post(authenticationRoutes.studentResendOtp, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (otp: string)=> {
  try {
    const response = await API.post(authenticationRoutes.studentVerifyOtp, {
      otp,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async ({ email, password, role }: Login)=> {
  try {
    const response = await API.post(authenticationRoutes.studentLogin, {
      email,
      password,
      role,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async ()=> {
  try {
    const response = await API.post(
      authenticationRoutes.studentLogout,
      {}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (email: string) => {
  try {
    const response = await API.post(authenticationRoutes.studentVerifyEmail, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyResetOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post(
      authenticationRoutes.studentVerifyResetOtp,
      { email, otp },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotResendOtp = async (email: string)=> {
  try {
    const response = await API.post(
      authenticationRoutes.studentForgotResendOtp,
      { email }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (password: string) => {
  try {
    const response = await API.post(
      authenticationRoutes.studentResetPassword,
      { password },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const googleLogin = async (loginData: object) => {
  try {
    const response = await API.post(
      authenticationRoutes.studentGoogleLogin,
      loginData,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
