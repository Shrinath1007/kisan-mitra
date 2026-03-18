import React, { useEffect, useState } from "react";
import API from "../../services/axiosClient";
import { useAuth } from "../../context/AuthContext";
import "./VacancyApplicants.css";

const VacancyApplicants = () => {
    const { user } = useAuth?.() || {};
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchVacanciesWithApplicants();
    }, []);

    const fetchVacanciesWithApplicants = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await API.get("/farmer/vacancies/applicants");
            setVacancies(res.data.vacancies || []);
        } catch (err) {
            console.error("Fetch vacancies with applicants error:", err);
            setError(err.response?.data?.message || err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptApplicant = async (vacancyId, labourId) => {
        const key = `${vacancyId}-${labourId}-accept`;
        try {
            setActionLoading(prev => ({ ...prev, [key]: true }));
            await API.post("/farmer/applicants/accept", { vacancyId, labourId });
            await fetchVacanciesWithApplicants();
        } catch (err) {
            console.error("Accept applicant error:", err);
            setError(err.response?.data?.message || err.message || "Failed to accept applicant.");
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleRejectApplicant = async (vacancyId, labourId) => {
        const key = `${vacancyId}-${labourId}-reject`;
        try {
            setActionLoading(prev => ({ ...prev, [key]: true }));
            await API.post("/farmer/applicants/reject", { vacancyId, labourId });
            await fetchVacanciesWithApplicants();
        } catch (err) {
            console.error("Reject applicant error:", err);
            setError(err.response?.data?.message || err.message || "Failed to reject applicant.");
        } finally {
            setActionLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handlePayApplicant = async (vacancy, applicant) => {
        const totalAmount = vacancy.ratePerDay * vacancy.duration;
        const message = `Pay ₹${totalAmount} to ${applicant.labourId?.name} for ${vacancy.duration} days work at ₹${vacancy.ratePerDay}/day`;
        
        if (window.confirm(`${message}\n\nThis is a reminder to pay in cash at the workplace. Click OK to mark as paid.`)) {
            // In a real app, you might want to track this payment
            alert("Payment reminder noted! Please pay the worker in cash at the workplace.");
        }
    };

    if (loading) {
        return (
            <div className="vacancy-applicants-page">
                <div className="loading">Loading vacancy applicants...</div>
            </div>
        );
    }

    return (
        <div className="vacancy-applicants-page">
            <header className="page-header">
                <h1>Vacancy Applicants</h1>
                <p>Manage applicants for your posted vacancies and track worker applications.</p>
            </header>

            {error && (
                <div className="error-message">
                    <span>⚠️ {error}</span>
                    <button onClick={fetchVacanciesWithApplicants} className="retry-btn">
                        Retry
                    </button>
                </div>
            )}

            <div className="vacancies-container">
                {vacancies.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No Vacancies with Applicants</h3>
                        <p>Your posted vacancies will appear here once workers start applying.</p>
                    </div>
                ) : (
                    vacancies.map((vacancy) => (
                        <div key={vacancy._id} className="vacancy-card">
                            <div className="vacancy-header">
                                <h3>{vacancy.title}</h3>
                                <div className="vacancy-meta">
                                    <span className="wage">₹{vacancy.ratePerDay}/day</span>
                                    <span className="duration">{vacancy.duration} days</span>
                                    <span className="workers">{vacancy.numWorkers} workers needed</span>
                                </div>
                            </div>
                            
                            <p className="vacancy-description">{vacancy.description}</p>
                            
                            <div className="vacancy-details">
                                <div className="detail-item">
                                    <strong>Location:</strong> {vacancy.location || "Not specified"}
                                </div>
                                <div className="detail-item">
                                    <strong>Start Date:</strong> {vacancy.startDate ? new Date(vacancy.startDate).toLocaleDateString() : "Flexible"}
                                </div>
                                <div className="detail-item">
                                    <strong>Total Payment per Worker:</strong> ₹{vacancy.ratePerDay * vacancy.duration}
                                </div>
                            </div>

                            <div className="applicants-section">
                                <h4>
                                    Applicants ({vacancy.applicants.length})
                                    {vacancy.applicants.length > 0 && (
                                        <span className="applicant-stats">
                                            {vacancy.applicants.filter(a => a.status === 'accepted').length} accepted, 
                                            {vacancy.applicants.filter(a => a.status === 'pending').length} pending
                                        </span>
                                    )}
                                </h4>
                                
                                {vacancy.applicants.length === 0 ? (
                                    <div className="no-applicants">
                                        <p>No applicants yet. Share your vacancy to get more applications!</p>
                                    </div>
                                ) : (
                                    <div className="applicants-grid">
                                        {vacancy.applicants.map((applicant) => (
                                            <div key={applicant._id} className="applicant-card">
                                                <div className="applicant-info">
                                                    <h5>{applicant.labourId?.name || "Unknown"}</h5>
                                                    <p className="applicant-contact">
                                                        📞 {applicant.labourId?.phone || "No phone"}
                                                    </p>
                                                    <p className="applicant-email">
                                                        ✉️ {applicant.labourId?.email || "No email"}
                                                    </p>
                                                    <div className={`status-badge ${applicant.status}`}>
                                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                                    </div>
                                                </div>
                                                
                                                <div className="applicant-actions">
                                                    {applicant.status === "pending" && (
                                                        <>
                                                            <button 
                                                                className="accept-btn"
                                                                onClick={() => handleAcceptApplicant(vacancy._id, applicant.labourId?._id)}
                                                                disabled={actionLoading[`${vacancy._id}-${applicant.labourId?._id}-accept`]}
                                                            >
                                                                {actionLoading[`${vacancy._id}-${applicant.labourId?._id}-accept`] ? "Accepting..." : "✅ Accept"}
                                                            </button>
                                                            <button 
                                                                className="reject-btn"
                                                                onClick={() => handleRejectApplicant(vacancy._id, applicant.labourId?._id)}
                                                                disabled={actionLoading[`${vacancy._id}-${applicant.labourId?._id}-reject`]}
                                                            >
                                                                {actionLoading[`${vacancy._id}-${applicant.labourId?._id}-reject`] ? "Rejecting..." : "❌ Reject"}
                                                            </button>
                                                        </>
                                                    )}
                                                    {applicant.status === "accepted" && (
                                                        <button 
                                                            className="pay-btn"
                                                            onClick={() => handlePayApplicant(vacancy, applicant)}
                                                        >
                                                            💰 Payment Info
                                                        </button>
                                                    )}
                                                    {applicant.status === "rejected" && (
                                                        <span className="rejected-text">Application rejected</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VacancyApplicants;
