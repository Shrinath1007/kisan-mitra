import axios from "axios";
import { getToken } from "./tokenHelper";
import { API_URL } from "./apiConfig";

const ADMIN_API_URL = `${API_URL}/admin`;

const api = axios.create({
  baseURL: ADMIN_API_URL,
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

export const login = async (credentials) => {
  const response = await api.post("/login", credentials);
  // Don't store in localStorage here - let AuthContext handle it
  return response.data;
};

export const getFarmers = () => api.get("/farmers");
export const deleteFarmer = (id) => api.delete(`/farmer/${id}`);

export const getMachines = () => api.get("/machines");
export const deleteMachine = (id) => api.delete(`/machine/${id}`);

export const getLabours = () => api.get("/labours");
export const deleteLabour = (id) => api.delete(`/labour/${id}`);

const adminService = {
  login,
  getFarmers,
  deleteFarmer,
  getMachines,
  deleteMachine,
  getLabours,
  deleteLabour,
};

export default adminService;
