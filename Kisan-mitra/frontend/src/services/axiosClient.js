// src/services/axiosClient.js
import axios from "axios";
import { getToken } from "./tokenHelper";

import { API_URL } from "./apiConfig";

const API = axios.create({
  baseURL: API_URL,
  timeout: 20000, // increased to prevent timeouts
});

// ---------------- TOKEN INTERCEPTOR ----------------
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------- GLOBAL ERROR HANDLER ----------------
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED") {
      console.error("⏳ API Timeout:", err.config && err.config.url);
    }

    if (err.response && err.response.status === 401) {
      console.warn("⚠ Token expired or unauthorized");
      // you can auto-logout here
    }

    return Promise.reject(err);
  }
);

export default API;
