// src/services/ownerAPI.js
import API from "./axiosClient";

export const addMachine = (data) => API.post("/machines/add", data);
export const getOwnerMachines = () => API.get("/machines/my-machines");