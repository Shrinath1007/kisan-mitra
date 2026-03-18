import axios from "axios";
import { getToken } from "./tokenHelper";
import { API_URL } from "./apiConfig";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
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
    const response = await api.get("/wallet");
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    throw error;
  }
};

const walletService = {
  getWallet,
};

export default walletService;
