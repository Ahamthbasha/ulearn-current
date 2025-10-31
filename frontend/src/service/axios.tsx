import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";
import { toast } from "react-toastify";
import { clearUserDetails } from "../redux/slices/userSlice";
import { clearInstructorDetails } from "../redux/slices/instructorSlice";
import { type NavigateFunction } from "react-router-dom";
import { type AnyAction, type Dispatch } from "@reduxjs/toolkit";
import { StatusCode, Roles, AuthErrorMsg } from "../utils/enums";

export const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASEURL || "http://localhost:3001",
  withCredentials: true,
});

export const configureAxiosInterceptors = (
  dispatch: Dispatch<AnyAction>,
  navigate: NavigateFunction
) => {
  API.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const verificationToken = localStorage.getItem("verificationToken");
     
      const token = verificationToken;

      if (token && config.headers) {
        config.headers["the-verify-token"] = token;
      }

      if (!(config.data instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
      }

      return config;
    },
    (error: AxiosError) => {
      console.error("Request Interceptor Error:", error);
      return Promise.reject(error);
    }
  );

  API.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ message?: string }>) => {
      if (
        error.response?.status === StatusCode.FORBIDDEN &&
        error.response?.data?.message === AuthErrorMsg.ACCOUNT_BLOCKED
      ) {
        // Handle blocked user
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const instructor = JSON.parse(localStorage.getItem("instructor") || "{}");
        const role = user?.role || instructor?.role;

        toast.error("🚫 You have been blocked by the admin.");

        if (role === Roles.STUDENT) {
          localStorage.removeItem("user");
          dispatch(clearUserDetails());
          navigate("/user/login");
        } else if (role === Roles.INSTRUCTOR) {
          localStorage.removeItem("instructor");
          dispatch(clearInstructorDetails());
          navigate("/instructor/login");
        }
      } else if (error.response?.status === StatusCode.UNAUTHORIZED) {
        console.warn("401 Unauthorized: clearing tokens");
        localStorage.removeItem("verificationToken");
      } else {
        console.error("Axios error:", error);
      }

      return Promise.reject(error);
    }
  );
};