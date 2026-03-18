import axios from "axios";
import { API_URL } from "./apiConfig";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("km_token"); // Use AuthContext token key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getWallet = async () => {
  try {
    const response = await api.get("/admin/wallet");
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    throw error;
  }
};

const adminwalletService = {
  getWallet,
};

export default adminwalletService;
