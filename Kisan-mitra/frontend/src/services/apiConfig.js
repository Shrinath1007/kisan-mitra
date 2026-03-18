// src/services/apiConfig.js
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
export const API_URL = `${BACKEND_URL}/api`;