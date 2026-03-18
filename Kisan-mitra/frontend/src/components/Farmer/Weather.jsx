// src/components/Farmer/Weather.jsx
import React from "react";
import "./Weather.css";

const Weather = ({ weatherData, loading, error }) => {
  if (loading) {
    return <div className="weather-widget loading">Loading weather...</div>;
  }

  if (error) {
    return <div className="weather-widget error">Error: {error}</div>;
  }
  
  if (!weatherData) {
    return (
      <div className="weather-widget empty">
        <p>No weather data available. Add a farm to see the forecast.</p>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <h3 className="section-title">7-Day Weather Forecast</h3>
      <div className="daily-forecasts">
        {weatherData.daily.time.map((day, index) => (
          <div key={day} className="day-forecast">
            <p className="day">
              {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
            </p>
            <p className="weather-code">
              {getWeatherIcon(weatherData.daily.weathercode[index])}
            </p>
            <p className="temp-max">
              {weatherData.daily.temperature_2m_max[index]}°C
            </p>
            <p className="temp-min">
              {weatherData.daily.temperature_2m_min[index]}°C
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get weather icon
const getWeatherIcon = (code) => {
  if (code >= 0 && code <= 1) return "☀️"; // Clear sky, mainly clear
  if (code >= 2 && code <= 3) return "🌥️"; // Partly cloudy, overcast
  if (code >= 45 && code <= 48) return "🌫️"; // Fog
  if (code >= 51 && code <= 57) return "💧"; // Drizzle
  if (code >= 61 && code <= 67) return "🌧️"; // Rain
  if (code >= 71 && code <= 77) return "❄️"; // Snow
  if (code >= 80 && code <= 82) return "🌦️"; // Rain showers
  if (code >= 85 && code <= 86) return "🌨️"; // Snow showers
  if (code >= 95 && code <= 99) return "⛈️"; // Thunderstorm
  return "❓";
};

export default Weather;