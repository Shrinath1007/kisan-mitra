// src/services/api.js
import API from "./axiosClient";

// Fetch all vacancies (returns data.vacancies[])
export async function fetchAllVacancies(token) {
    try {
        const res = await API.get("/labour/vacancies", {
            headers: { Authorization: `Bearer ${token}` },
        });

        return (res.data && res.data.vacancies) || [];
    } catch (err) {
        console.error("Error fetching vacancies:", err);
        return [];
    }
}

// Fetch labour work history (returns data.history[])
export async function fetchLabourWorkHistory(token) {
    try {
        const res = await API.get("/labour/work-history", {
            headers: { Authorization: `Bearer ${token}` },
        });

        return (res.data && res.data.history) || [];
    } catch (err) {
        console.error("Error fetching work history:", err);
        return [];
    }
}

// Fetch AI Job Demand Predictions (/api/ai/labour)
export async function fetchLabourDemandPredictions(token) {
    try {
        const res = await API.get("/ai/labour", {
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.data || null;
    } catch (err) {
        console.error("Error fetching labour predictions:", err);
        return null;
    }
}