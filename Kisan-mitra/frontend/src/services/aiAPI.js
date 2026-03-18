// src/services/aiApi.js
import API from "./axiosClient";

export const getVacancyPrediction = () => API.get("/ai/predict/vacancy");
export const getWeatherPrediction = (payload) => API.post("/ai/predict", payload);