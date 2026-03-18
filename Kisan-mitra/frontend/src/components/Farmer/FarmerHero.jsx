import React from "react";
import "./FarmerHero.css";

const FarmerHero = ({ user }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="farmer-hero">
            {/* Animated Background Elements */}
            <div className="hero-background">
                <div className="hero-tractor"></div>
                <div className="hero-crops"></div>
                <div className="hero-irrigation"></div>
                <div className="hero-birds"></div>
            </div>
            
            <div className="hero-content">
                <div className="hero-greeting">
                    <h1>
                        {getGreeting()}, {user?.name || "Farmer"}!
                    </h1>
                    <p>
                        Welcome to your agricultural command center. Monitor your farms, 
                        track your crops, and grow your success.
                    </p>
                </div>
                
                <div className="hero-stats">
                    <div className="hero-stat-item">
                        <div className="hero-stat-icon">🌾</div>
                        <div className="hero-stat-text">
                            <span>Harvest Season</span>
                            <small>Peak productivity time</small>
                        </div>
                    </div>
                    <div className="hero-stat-item">
                        <div className="hero-stat-icon">🚜</div>
                        <div className="hero-stat-text">
                            <span>Smart Farming</span>
                            <small>Technology-driven agriculture</small>
                        </div>
                    </div>
                    <div className="hero-stat-item">
                        <div className="hero-stat-icon">💧</div>
                        <div className="hero-stat-text">
                            <span>Irrigation Ready</span>
                            <small>Optimal water management</small>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Floating Elements */}
            <div className="hero-floating-elements">
                <div className="floating-leaf floating-leaf-1">🍃</div>
                <div className="floating-leaf floating-leaf-2">🌿</div>
                <div className="floating-leaf floating-leaf-3">🍃</div>
                <div className="floating-seed floating-seed-1">🌱</div>
                <div className="floating-seed floating-seed-2">🌾</div>
            </div>
        </div>
    );
};

export default FarmerHero;