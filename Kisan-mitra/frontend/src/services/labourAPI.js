// src/services/labourAPI.js
import API from "./axiosClient";

export const getLabourProfile = () => API.get("/labour/profile");
export const updateLabourProfile = (data) => API.put("/labour/profile", data);
export const getWorkHistory = () => API.get("/labour/work-history");
export const getVacancies = () => API.get("/labour/vacancies");
export const applyVacancy = (data) => API.post("/labour/apply", data);
