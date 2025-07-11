import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_BASEURL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // must be outside headers
});

// 🔐 Request Interceptor: Attach token if available
API.interceptors.request.use(
  (config) => {
    const verificationToken = localStorage.getItem("verificationToken");
    const verificationTokenStudent = localStorage.getItem("verificationTokenStudent");

    // Prefer student token if both are present
    const token = verificationTokenStudent || verificationToken;

    if (token) {
      config.headers["the-verify-token"] = token;
    }

    return config;
  },
  (error) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// ⚠️ Response Interceptor: Handle unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized: clear relevant tokens
      console.warn("401 Unauthorized: clearing tokens");
      localStorage.removeItem("verificationTokenStudent");
      localStorage.removeItem("verificationToken");
    } else {
      console.error("Axios error:", error);
    }

    return Promise.reject(error);
  }
);