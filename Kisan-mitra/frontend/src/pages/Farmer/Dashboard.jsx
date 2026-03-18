// src/pages/Farmer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { useAuth } from "../../context/AuthContext";

// API Services
import {
  getCrops,
  getVacancies,
  createFarm,
  addCrop,
} from "../../services/farmerAPI";
import { getWeatherPrediction } from "../../services/aiAPI";
import { getMyBookings } from "../../services/bookingAPI";

// Components
import FarmerHero from "../../components/Farmer/FarmerHero";
import AIRecommendation from "../../components/Farmer/AIRecommendation";
import Modal from "../../components/common/Modal";
import AddCropForm from "../../components/Farmer/AddCropForm";
import Weather from "../../components/Farmer/Weather";

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Main data state
  const [farms, setFarms] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ai, setAi] = useState(null);

  // Weather state
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [showAddCropForm, setShowAddCropForm] = useState(false);
  const [showAddFarmForm, setShowAddFarmForm] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Form state
  const [newFarmForm, setNewFarmForm] = useState({
    name: "",
    area: "",
    soilType: "loamy",
  });

  // ---------------- FETCH ALL DASHBOARD DATA ----------------
  const loadData = async () => {
    try {
      setLoading(true);

      const [cropsRes, bookingRes, vacanciesRes] = await Promise.all([
        getCrops(),
        getMyBookings(),
        getVacancies(),
      ]);

      const userFarms = cropsRes?.data?.farms || [];
      setFarms(userFarms);
      setBookings(bookingRes?.data?.bookings || []);
      setVacancies(vacanciesRes?.data?.vacancies || []);

      if (userFarms.length > 0) {
        try {
          const aiRes = await getWeatherPrediction({ city: "Delhi" });
          setAi(aiRes.data);
        } catch (aiErr) {
          console.warn("AI Weather error:", aiErr);
        }
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
      // Trigger page load animation after data is loaded
      setTimeout(() => setPageLoaded(true), 100);
    }
  };

  // ---------------- FETCH WEATHER DATA ----------------
  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    // Hardcoded to Delhi for now, but can be replaced with user's location
    const latitude = 28.6139;
    const longitude = 77.209;

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch weather data.");
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setWeatherError(error.message);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ------------------- FORM HANDLERS -------------------
  const handleAddCrop = async (cropData) => {
    try {
      await addCrop(cropData);
      setShowAddCropForm(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error adding crop:", error);
      alert("Failed to add crop");
    }
  };

  const handleAddFarm = async (e) => {
    e.preventDefault();
    try {
      await createFarm(newFarmForm);
      setShowAddFarmForm(false);
      setNewFarmForm({ name: "", area: "", soilType: "loamy" });
      loadData(); // Refresh data
    } catch (err) {
      console.error("Create Farm Error:", err);
      alert("Failed to create farm.");
    }
  };

  const handleFarmChange = (e) => {
    const { name, value } = e.target;
    setNewFarmForm((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------- DERIVED STATS -------------------
  const totalFarms = farms.length;
  const totalCrops = farms.reduce((sum, f) => sum + (f?.crops?.length || 0), 0);
  const activeVacancies = vacancies.filter((v) => v.status === "active").length;
  const totalBookings = bookings.length;

  // ------------------- LOADING UI -------------------
  if (loading) {
    return (
      <div className="farmer-dashboard loading">
        <div className="loading-spinner">
          <div className="loading-tractor">🚜</div>
          <div className="loading-text">
            <h3>Preparing your farm dashboard...</h3>
            <p>Loading crops, machinery, and weather data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`farmer-dashboard ${pageLoaded ? 'page-loaded' : ''}`}>
      <FarmerHero user={user} />

      {/* ------------------ STATS ------------------ */}
      <div className="stats-grid">
        {/* Total Farms */}
        <div className="stat-card" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <h3>{totalFarms}</h3>
            <p>Total Farms</p>
          </div>
          <div className="stat-decoration">🌾</div>
        </div>
        {/* Active Crops */}
        <div className="stat-card" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon">🌱</div>
          <div className="stat-info">
            <h3>{totalCrops}</h3>
            <p>Active Crops</p>
          </div>
          <div className="stat-decoration">🍃</div>
        </div>
        {/* Active Vacancies */}
        <div className="stat-card" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{activeVacancies}</h3>
            <p>Active Vacancies</p>
          </div>
          <div className="stat-decoration">🤝</div>
        </div>
        {/* Total Bookings */}
        <div className="stat-card" style={{ animationDelay: '0.4s' }}>
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>{totalBookings}</h3>
            <p>Total Machinery Bookings</p>
          </div>
          <div className="stat-decoration">⚙️</div>
        </div>
      </div>
        
      <div className="page-wrapper">
        {/* ------------------ WEATHER ------------------ */}
        <section className="dashboard-section weather-section" style={{ animationDelay: '0.5s' }}>
          <Weather
            weatherData={weatherData}
            loading={weatherLoading}
            error={weatherError}
          />
        </section>

        {/* ------------------ AI RECOMMENDATIONS ------------------ */}
        <section className="dashboard-section ai-section" style={{ animationDelay: '0.6s' }}>
          <h3 className="section-title">
            <span className="title-icon">🤖</span>
            AI Weather & Crop Recommendations
          </h3>
          {farms.length > 0 ? (
            <AIRecommendation data={ai} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <h4>Ready to Start Farming?</h4>
              <p>Add a farm to get AI-powered recommendations tailored to your crops and location.</p>
              <button 
                className="empty-state-action"
                onClick={() => setShowAddFarmForm(true)}
              >
                Create Your First Farm
              </button>
            </div>
          )}
        </section>

        {/* ------------------ QUICK ACTIONS ------------------ */}
        <section className="dashboard-section actions-section" style={{ animationDelay: '0.7s' }}>
          <h3 className="section-title">
            <span className="title-icon">⚡</span>
            Quick Actions
          </h3>
          <div className="quick-actions-grid">
            <button
              className="quick-action-card farm-action"
              onClick={() => setShowAddFarmForm(true)}
            >
              <div className="action-icon">🏠</div>
              <div className="action-content">
                <span className="action-title">Add New Farm</span>
                <small className="action-subtitle">Expand your agricultural portfolio</small>
              </div>
              <div className="action-arrow">→</div>
            </button>
            <button
              className="quick-action-card crop-action"
              disabled={farms.length === 0}
              onClick={() => setShowAddCropForm(true)}
            >
              <div className="action-icon">🌱</div>
              <div className="action-content">
                <span className="action-title">Add Crop to Farm</span>
                <small className="action-subtitle">Plant new crops this season</small>
              </div>
              <div className="action-arrow">→</div>
            </button>
            <button
              className="quick-action-card vacancy-action"
              onClick={() => navigate("/farmer/vacancies")}
            >
              <div className="action-icon">👥</div>
              <div className="action-content">
                <span className="action-title">Manage Vacancies</span>
                <small className="action-subtitle">Find skilled farm workers</small>
              </div>
              <div className="action-arrow">→</div>
            </button>
            <button
              className="quick-action-card machinery-action"
              onClick={() => navigate("/farmer/machinery")}
            >
              <div className="action-icon">🔧</div>
              <div className="action-content">
                <span className="action-title">Book Machinery</span>
                <small className="action-subtitle">Rent tractors and equipment</small>
              </div>
              <div className="action-arrow">→</div>
            </button>
          </div>
        </section>
      </div>

      {/* ------------------ MODALS ------------------ */}
      {showAddFarmForm && (
        <Modal
          title="Add New Farm"
          onClose={() => setShowAddFarmForm(false)}
        >
          <form onSubmit={handleAddFarm} className="farm-form">
            <div className="form-group">
              <label>Farm Name</label>
              <input
                type="text"
                name="name"
                value={newFarmForm.name}
                onChange={handleFarmChange}
                required
                placeholder="Enter your farm name"
              />
            </div>
            <div className="form-group">
              <label>Area (in acres)</label>
              <input
                type="number"
                name="area"
                value={newFarmForm.area}
                onChange={handleFarmChange}
                required
                placeholder="Enter farm area"
              />
            </div>
            <div className="form-group">
              <label>Soil Type</label>
              <select
                name="soilType"
                value={newFarmForm.soilType}
                onChange={handleFarmChange}
              >
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="silt">Silt</option>
                <option value="peaty">Peaty</option>
                <option value="chalky">Chalky</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddFarmForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <span>🏠</span>
                Add Farm
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAddCropForm && (
        <Modal
          title="Add New Crop"
          onClose={() => setShowAddCropForm(false)}
        >
          <AddCropForm
            onSubmit={handleAddCrop}
            onCancel={() => setShowAddCropForm(false)}
            farms={farms}
          />
        </Modal>
      )}
    </div>
  );
};

export default FarmerDashboard;