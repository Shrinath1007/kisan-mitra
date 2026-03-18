import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import {
  fetchAllVacancies,
  fetchLabourWorkHistory,
  fetchLabourDemandPredictions,
} from "../../services/api";

import VacanciesList from "../../components/Labour/VacanciesList";
import PredictionCard from "../../components/Labour/PredictionCard";
import { useAuth } from "../../context/AuthContext";

const LabourDashboard = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("vacancies");
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingApplications: 0,
    avgRating: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = user?.token; // if your API helper uses token
        const [vacanciesData, historyData, predictionsData] = await Promise.all(
          [
            fetchAllVacancies(token),
            fetchLabourWorkHistory(token),
            fetchLabourDemandPredictions(token),
          ]
        );

        const vacs = vacanciesData || [];
        const history = historyData || [];
        const predRes = predictionsData || null;

        setVacancies(vacs);
        setPred(predRes);

        // Stats calculation:
        const completedJobs = (history || []).filter(
          (job) => job.status === "completed"
        ).length;

        const pendingApplications = (vacs || []).filter((vacancy) =>
          vacancy.applicants?.some(
            (applicant) =>
              String(applicant.labourId) === String(user?.id) &&
              applicant.status === "pending"
          )
        ).length;

        const totalRating = (history || []).reduce(
          (sum, job) => sum + (job.rating || 0),
          0
        );
        const avgRating =
          history && history.length > 0
            ? (totalRating / history.length).toFixed(1)
            : 0;

        setStats({
          totalJobs: (vacs || []).length,
          completedJobs,
          pendingApplications,
          avgRating,
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const token = user?.token;
      const [vacanciesData, historyData, predictionsData] = await Promise.all([
        fetchAllVacancies(token),
        fetchLabourWorkHistory(token),
        fetchLabourDemandPredictions(token),
      ]);

      const vacs = vacanciesData || [];
      const history = historyData || [];

      setVacancies(vacs);
      setPred(predictionsData || null);

      const completedJobs = (history || []).filter(
        (job) => job.status === "completed"
      ).length;

      const pendingApplications = (vacs || []).filter((vacancy) =>
        vacancy.applicants?.some(
          (applicant) =>
            String(applicant.labourId) === String(user?.id) &&
            applicant.status === "pending"
        )
      ).length;

      const totalRating = (history || []).reduce(
        (sum, job) => sum + (job.rating || 0),
        0
      );

      const avgRating =
        history && history.length > 0
          ? (totalRating / history.length).toFixed(1)
          : 0;

      setStats({
        totalJobs: (vacs || []).length,
        completedJobs,
        pendingApplications,
        avgRating,
      });
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="labour-dashboard loading">
        <div className="dashboard-background">
          <div className="floating-leaf dashboard-leaf-1"></div>
          <div className="floating-leaf dashboard-leaf-2"></div>
          <div className="floating-leaf dashboard-leaf-3"></div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <div className="loading-text">
            <h3>Preparing Your Dashboard</h3>
            <p>Loading your farming opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="labour-dashboard">
      <div className="dashboard-background">
        <div className="floating-leaf dashboard-leaf-1"></div>
        <div className="floating-leaf dashboard-leaf-2"></div>
        <div className="floating-leaf dashboard-leaf-3"></div>
        <div className="floating-grain"></div>
      </div>

      <header className="labour-header">
        <div className="header-content">
          <div className="welcome-section">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 13l-3-3 1.41-1.41L11 12.17l4.59-4.59L17 9l-6 6z" />
              </svg>
            </div>
            <div className="welcome-text">
              <h1>Welcome back, {user?.name || "Worker"}! 👨‍🌾</h1>
              <p>Ready for your next farming opportunity?</p>
            </div>
          </div>
          <button
            className="refresh-btn"
            onClick={refreshData}
            aria-label="Refresh data"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total-jobs">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalJobs}</span>
              <span className="stat-label">Total Vacancies</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.completedJobs}</span>
              <span className="stat-label">Completed Jobs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.pendingApplications}</span>
              <span className="stat-label">Pending Apps</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rating">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.avgRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeSection === "vacancies" ? "active" : ""}`}
          onClick={() => setActiveSection("vacancies")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
          </svg>
          Job Vacancies
          {vacancies.length > 0 && (
            <span className="tab-badge">{vacancies.length}</span>
          )}
        </button>

        <button
          className={`nav-tab ${
            activeSection === "predictions" ? "active" : ""
          }`}
          onClick={() => setActiveSection("predictions")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
          7-Day Job Demand
        </button>
      </nav>

      <main className="dashboard-main">
        <section
          className={`dashboard-section ${
            activeSection === "vacancies" ? "active" : ""
          }`}
          id="vacancies"
        >
          <div className="section-header">
            <h2>All Available Job Vacancies</h2>
            <p>Find your next farming opportunity based on your skills</p>
          </div>
          <VacanciesList vacancies={vacancies} userId={user?.id || user?._id} />
        </section>

        <section
          className={`dashboard-section ${
            activeSection === "predictions" ? "active" : ""
          }`}
          id="predictions"
        >
          <div className="section-header">
            <h2>7-Day Job Demand Predictions</h2>
            <p>Smart insights for better opportunities in the upcoming week</p>
          </div>
          <PredictionCard pred={pred} />
        </section>
      </main>

      <footer className="dashboard-footer">
        <div className="quick-actions">
          <button className="action-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Apply for Jobs
          </button>
          <button className="action-btn secondary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
            View Trends
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LabourDashboard;
