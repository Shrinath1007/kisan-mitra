import axios from "axios";
import { getToken } from "./tokenHelper";
import { API_URL } from "./apiConfig";

// -----------------------------------------------------
//  AXIOS INSTANCE WITH TOKEN
// -----------------------------------------------------
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For JSON data, set content type
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status !== 401) {
      console.error("API Error:", {
        url: error.config && error.config.url,
        method: error.config && error.config.method,
        status: error.response && error.response.status,
        message:
          (error.response && error.response.data && error.response.message) ||
          error.message,
      });
    }
    return Promise.reject(error);
  }
);

// -----------------------------------------------------
//  MACHINE OWNER → GET ONLY HIS MACHINES
// -----------------------------------------------------
export const getMyMachines = async () => {
  try {
    console.log("Fetching owner machines...");
    const response = await api.get("/machines/my-machines");
    return response;
  } catch (error) {
    console.error("Error fetching owner machines:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  MACHINE → ADD NEW MACHINE (with base64 images)
// -----------------------------------------------------
export const addMachine = async (machineData) => {
  try {
    console.log("Adding machine with base64 images");
    const response = await api.post("/machines/add", machineData);
    return response;
  } catch (error) {
    console.error("Error adding machine:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  BOOKINGS → GET OWNER BOOKINGS
// -----------------------------------------------------
export const getOwnerBookings = async (params = {}) => {
  try {
    console.log("Fetching owner bookings...");
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/booking/owner?${queryString}`);
    console.log("Owner bookings response:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  BOOKINGS → UPDATE STATUS
// -----------------------------------------------------
export const updateBookingStatus = async (bookingId, status) => {
  try {
    console.log(`Updating booking ${bookingId} status to ${status}`);
    const response = await api.put(`/booking/${bookingId}/status`, { status });
    return response;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  BOOKINGS → GET STATISTICS
// -----------------------------------------------------
export const getBookingStats = async () => {
  try {
    console.log("Fetching booking statistics...");
    const response = await api.get("/booking/owner/stats");
    return response;
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  MACHINE OPERATIONS
// -----------------------------------------------------
export const getMachineById = (machineId) => api.get(`/machines/${machineId}`);
export const updateMachine = (machineId, payload) =>
  api.put(`/machines/${machineId}`, payload);
export const deleteMachine = (machineId) =>
  api.delete(`/machines/${machineId}`);
export const getMachineBookings = (machineId) =>
  api.get(`/machines/${machineId}/bookings`);
export const getAllMachines = () => api.get("/machines");
export const searchMachines = (queryString) =>
  api.get(`/machines/search${queryString ? "?" + queryString : ""}`);

// -----------------------------------------------------
//  HEALTH CHECK → TEST CORS
// -----------------------------------------------------
export const testCors = async () => {
  try {
    console.log("Testing CORS...");
    const response = await api.get("/test-cors");
    return response;
  } catch (error) {
    console.error("Error testing CORS:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  HEALTH CHECK → TEST BACKEND CONNECTION
// -----------------------------------------------------
export const testBackendHealth = async () => {
  try {
    console.log("Testing backend health...");
    const response = await api.get("/test");
    return response;
  } catch (error) {
    console.error("Error testing backend health:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  AI SERVICES → GET MACHINERY DEMAND
// -----------------------------------------------------
export const getAIMachineryDemand = async () => {
  try {
    console.log("Fetching AI machinery demand...");
    const response = await api.get("/ai/machinery");
    return response;
  } catch (error) {
    console.error("Error fetching AI machinery demand:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  AI SERVICES → GET WEATHER PREDICTION
// -----------------------------------------------------
export const getAIWeatherPrediction = async (locationData) => {
  try {
    // Extract city string from location object or use the string directly
    const locationString = typeof locationData === 'object' 
      ? locationData.city || locationData.location || 'Delhi'
      : locationData || 'Delhi';
      
    console.log(`Fetching AI weather prediction for ${locationString}...`);
    const response = await api.get(
      `/ai/weather-prediction?location=${encodeURIComponent(locationString)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching AI weather prediction:", error);
    throw error;
  }
};

// -----------------------------------------------------
//  EXPORT MACHINE SERVICE
// -----------------------------------------------------
const machineService = {
  // Machine operations
  getMyMachines,
  addMachine,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMachineBookings,
  getAllMachines,
  searchMachines,

  // Booking operations
  getOwnerBookings,
  updateBookingStatus,
  getBookingStats,

  // AI services
  getAIWeatherPrediction,
  getAIMachineryDemand,

  // Health Check
  testBackendHealth,
  testCors,
};

export default machineService;
