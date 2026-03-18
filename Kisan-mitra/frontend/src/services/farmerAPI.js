// src/services/farmerAPI.js
import API from "./axiosClient";

// GET ALL MACHINES (farmer)
export const getMachines = () => API.get("/machines/");

// GET FARMER CROPS
export const getCrops = () => API.get("/farmer/crops");

// POST VACANCY (Correct URL)
export const postVacancy = (payload) => API.post("/farmer/vacancy", payload);

// GET ALL VACANCIES FOR A FARMER
export const getVacancies = () => API.get("/farmer/vacancies");

// ADD CROP
export const addCrop = (payload) => API.post("/farmer/crop", payload);

// CREATE FARM
export const createFarm = (payload) => API.post("/farmer/farm", payload);