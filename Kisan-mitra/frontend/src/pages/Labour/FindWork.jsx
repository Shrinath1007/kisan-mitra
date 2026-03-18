import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Import useAuth
import API from "../../services/axiosClient";
import "./FindWork.css";

const FindWork = () => {
  const { user, token, ready } = useAuth(); // Use the auth context
  const [vacancies, setVacancies] = useState([]);
  const [filteredVacancies, setFilteredVacancies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    if (ready && token) {
      // Only fetch if auth context is ready and token exists
      fetchVacancies();
    }
  }, [ready, token]); // Depend on ready and token

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const res = await API.get("/labour/vacancies");
      const vacanciesData = res.data.vacancies || [];
      setVacancies(vacanciesData);
      setFilteredVacancies(vacanciesData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredVacancies(vacancies);
    } else {
      const filtered = vacancies.filter(vacancy =>
        vacancy.title.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredVacancies(filtered);
    }
  };

  // Helper function to get expiration status
  const getExpirationStatus = (vacancy) => {
    if (!vacancy.startDate) return null;
    
    const currentDate = new Date();
    const startDate = new Date(vacancy.startDate);
    const timeDiff = startDate.getTime() - currentDate.getTime();
    const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (currentDate > startDate) {
      return {
        isExpired: true,
        message: `Expired on ${startDate.toLocaleDateString()} (start date passed)`,
        className: 'expired'
      };
    } else if (daysUntilExpiration <= 1) {
      return {
        isExpired: false,
        message: daysUntilExpiration === 1 ? 'Starts today!' : 'Starts in less than 24 hours!',
        className: 'expiring-soon'
      };
    } else if (daysUntilExpiration <= 3) {
      return {
        isExpired: false,
        message: `Starts in ${daysUntilExpiration} days`,
        className: 'expiring-warning'
      };
    }
    
    return {
      isExpired: false,
      message: `Starts on ${startDate.toLocaleDateString()}`,
      className: 'active'
    };
  };

  const applyForVacancy = async (id) => {
    try {
      setApplyingId(id);
      const res = await API.post("/labour/apply", { vacancyId: id });

      alert(res.data.message);
      
      // Refresh the vacancies data to get the updated application status
      await fetchVacancies();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Failed to apply";
      
      if (err?.response?.data?.isExpired) {
        alert(`❌ ${errorMessage}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="labour-find-work">
      <div className="page-header">
        <h1>🔍 Find Work Opportunities</h1>
        <p>Browse available job vacancies and apply instantly to start earning.</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search jobs by title (e.g., Harvesting, Ploughing, Irrigation)"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredVacancies(vacancies);
                }}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-results-info">
              <span className="results-count">
                {filteredVacancies.length} job{filteredVacancies.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading available job opportunities...</p>
        </div>
      ) : (
        <div className="vacancy-list">
          {filteredVacancies.length === 0 ? (
            searchTerm ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Jobs Found</h3>
                <p>No jobs found for "<strong>{searchTerm}</strong>". Try searching with different keywords like "Harvesting", "Ploughing", or "Irrigation".</p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilteredVacancies(vacancies);
                  }} 
                  className="refresh-btn"
                >
                  🔄 Clear Search & Show All Jobs
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Job Opportunities Available</h3>
                <p>There are currently no job vacancies posted. Check back later for new opportunities!</p>
                <button onClick={fetchVacancies} className="refresh-btn">
                  🔄 Refresh Jobs
                </button>
              </div>
            )
          ) : (
            filteredVacancies.map((v) => {
              const applied = v.applicants?.some(app => 
                String(app.labourId) === String(user?._id)
              );
              const full = v.status === 'filled';
              const expirationStatus = getExpirationStatus(v);
              const expired = expirationStatus?.isExpired || false;

              return (
                <div key={v._id} className={`vacancy-card ${expirationStatus?.className || ''}`}>
                  <div className="vacancy-header">
                    <h2>{v.title}</h2>
                    {expirationStatus && (
                      <div className={`expiration-badge ${expirationStatus.className}`}>
                        {expired ? '⏰ EXPIRED' : '📅 STARTING SOON'}
                      </div>
                    )}
                  </div>
                  
                  <p>{v.description}</p>
                  <p>
                    <strong>👨‍🌾 Farmer:</strong> {v.postedBy?.name}
                  </p>
                  <p>
                    <strong>💰 Rate Per Day:</strong> ₹{v.ratePerDay}
                  </p>
                  <p>
                    <strong>👥 Workers Needed:</strong> {v.numWorkers}
                  </p>
                  <p>
                    <strong>📅 Start Date:</strong> {new Date(v.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>⏱️ Duration:</strong> {v.duration} days
                  </p>
                  <p>
                    <strong>📊 Status:</strong> <span className={`status-${expired ? 'expired' : v.status}`}>{expired ? 'expired (start date passed)' : v.status}</span>
                  </p>
                  <p>
                    <strong>📝 Applied:</strong> {v.applicants?.length} / {v.numWorkers}
                  </p>

                  {expirationStatus && (
                    <p className={`expiration-info ${expirationStatus.className}`}>
                      <strong>📅 {expirationStatus.message}</strong>
                    </p>
                  )}

                  {expired ? (
                    <button className="expired-btn" disabled>
                      ❌ Job Expired (Start Date Passed)
                    </button>
                  ) : full ? (
                    <button className="full-btn" disabled>
                      Position Filled
                    </button>
                  ) : applied ? (
                    <button className="applied-btn" disabled>
                      ✅ Already Applied
                    </button>
                  ) : (
                    <button
                      className="apply-btn"
                      onClick={() => applyForVacancy(v._id)}
                      disabled={applyingId === v._id}
                    >
                      {applyingId === v._id ? "Submitting Application..." : "Apply Now"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FindWork;