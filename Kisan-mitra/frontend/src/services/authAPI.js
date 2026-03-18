// src/services/authAPI.js
import API from "./axiosClient";

export const registerUser = (data) => API.post("/auth/register", data);

export const registerWithVerification = (data) => API.post("/auth/register-with-verification", data);

export const sendOTP = (data) => API.post("/auth/send-otp", data);

export const verifyOTP = (data) => API.post("/auth/verify-otp", data);

export const loginUser = (data) => API.post("/auth/login", data);

// Password Reset APIs
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

export const verifyResetOTP = (data) => API.post("/auth/verify-reset-otp", data);

export const resetPassword = (data) => API.post("/auth/reset-password", data);
