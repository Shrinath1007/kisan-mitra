// src/services/aiAxiosClient.js
import axios from "axios";

const AI_API = axios.create({
    baseURL: "http://localhost:7000", // The AI service runs on port 7000
    timeout: 30000,
});

export default AI_API;