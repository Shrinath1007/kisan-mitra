// src/controllers/aiController.js
const axios = require('axios');

const PY_AI_URL = process.env.PY_AI_URL || "http://localhost:7000";

exports.predict = async (req, res) => {
  try {
    const { city, crops } = req.body;
    const response = await axios.post(`${PY_AI_URL}/predict/weather`, { city, crops });
    return res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service:', error.message);
    return res.status(500).json({ message: 'Error calling AI service' });
  }
};

exports.labour = async (req, res) => {
    try {
        const response = await axios.get(`${PY_AI_URL}/predict/labour`);
        res.json(response.data);
    } catch (err) {
        console.error("AI labour error:", err.message);
        return res.status(500).json({ message: "AI labour error" });
    }
};

exports.machinery = async (req, res) => {
    try {
        const response = await axios.get(`${PY_AI_URL}/predict/machinery`);
        res.json(response.data);
    } catch (err) {
        console.error("AI machinery error:", err.message);
        return res.status(500).json({ message: "AI machinery error" });
    }
};

exports.cropAnalysis = async (req, res) => {
    try {
        const response = await axios.post(`${PY_AI_URL}/analyze/crop`, req.body);
        res.json(response.data);
    } catch (err) {
        console.error("AI crop analysis error:", err.message);
        return res.status(500).json({ message: "AI crop analysis error" });
    }
};

exports.weatherPrediction = async (req, res) => {
  try {
    const { location } = req.query;
    const response = await axios.get(`${PY_AI_URL}/predict/weather?location=${location}`);
    return res.json(response.data);
  } catch (error) {
    console.error('Error calling AI weather prediction service:', error.message);
    return res.status(500).json({ message: 'Error calling AI weather prediction service' });
  }
};
