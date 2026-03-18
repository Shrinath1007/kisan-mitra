import React, { useEffect, useState } from "react";
import AI_API from "../../services/aiAxiosClient";
import "./FarmerPredictions.css";

const Predictions = () => {
  const [city, setCity] = useState(null);
  const [weather, setWeather] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cropTasks, setCropTasks] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [cropStage, setCropStage] = useState("sowing");
  const [plantingDate, setPlantingDate] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- AUTO LOCATION ----------------
  const getLocationCity = () => {
    if (!navigator.geolocation) {
      setCity("Delhi");
      fetchGeneralWeather("Delhi");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();

        const detectedCity =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Delhi";

        setCity(detectedCity);
        fetchGeneralWeather(detectedCity);
      },
      () => {
        setCity("Delhi");
        fetchGeneralWeather("Delhi");
      },
      { enableHighAccuracy: true }
    );
  };

  // ---------------- WEATHER + GENERAL TASKS ----------------
  const fetchGeneralWeather = async (cityName) => {
    try {
      setLoading(true);
      const res = await AI_API.post("/predict/weather", { city: cityName });

      setWeather(res.data.weather || []);
      const uniqueTasks = [
        ...new Set(
          (res.data.tasks || [])
            .map((t) => t.task || t.description || "")
            .filter((t) => t.trim())
        ),
      ];
      setTasks(uniqueTasks);

      setLoading(false);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setLoading(false);
    }
  };

  // ---------------- CROP SPECIFIC ----------------
  const handleCropSearch = async () => {
    if (!selectedCrop || !plantingDate)
      return alert("Please fill crop name + planting date.");

    try {
      setLoading(true);

      const payload = {
        city,
        crops: [
          {
            name: selectedCrop,
            plantingDate: plantingDate,
            stage: cropStage,
          },
        ],
      };

      const res = await AI_API.post("/predict/weather", payload);

      const uniqueCropTasks = [
        ...new Set(
          (res.data.tasks || [])
            .map((t) => t.task || t.description || "")
            .filter((t) => t.trim())
        ),
      ];
      setCropTasks(uniqueCropTasks);

      setLoading(false);
    } catch (err) {
      console.error("Crop AI Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationCity();
  }, []);

  return (
    <div className="ai-wrapper">
      <h1 className="ai-title">🌾 AI Predictions & Crop Advisor</h1>

      {city && <h3 className="current-city">📍 Location: {city}</h3>}

      {/* WEATHER */}
      <h2 className="section-title">🌦 7-Day Weather Forecast</h2>
      <div className="weather-grid">
        {weather.map((d, i) => (
          <div key={i} className="weather-card">
            <h3>{d.date}</h3>
            <p>
              🌡 Temp: <b>{d.temp}°C</b>
            </p>
            <p>
              🌧 Rain Chance: <b>{d.rainChance}%</b>
            </p>
          </div>
        ))}
      </div>

      {/* GENERAL TASKS */}
      <h2 className="section-title">🤖 AI Recommended Actions</h2>
      <div className="task-list">
        {tasks.length === 0 ? (
          <p>No general AI suggestions</p>
        ) : (
          tasks.map((t, i) => (
            <div key={i} className="task-card">
              • {t}
            </div>
          ))
        )}
      </div>

      {/* CROP ADVISOR */}
      <h2 className="section-title">🌱 Crop Advisor (7-Day Plan)</h2>

      <div className="crop-inputs">
        <input
          type="text"
          placeholder="Enter Crop (e.g., Wheat)"
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
        />

        <input
          type="date"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
        />

        <select
          value={cropStage}
          onChange={(e) => setCropStage(e.target.value)}
        >
          <option value="sowing">Sowing</option>
          <option value="germination">Germination</option>
          <option value="vegetative">Vegetative</option>
          <option value="flowering">Flowering</option>
          <option value="harvesting">Harvesting</option>
        </select>

        <button onClick={handleCropSearch}>Get Crop AI Plan</button>
      </div>

      {/* CROP TASKS */}
      {cropTasks.length > 0 && (
        <div className="task-list">
          {cropTasks.map((t, i) => (
            <div key={i} className="task-card">
              • {t}
            </div>
          ))}
        </div>
      )}

      {loading && <p className="loading-text">⏳ Fetching...</p>}
    </div>
  );
};

export default Predictions;
