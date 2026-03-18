import React, { useState, useEffect } from 'react';
import { getLabourProfile, updateLabourProfile } from '../../services/labourAPI';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    availability: false,
    expectedRate: '',
    manualOverride: false,
    manualStatus: false,
  });
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching labour profile...');
        const { data } = await getLabourProfile();
        console.log('Profile data received:', data);
        setProfile(data);
        setFormData({
          name: data.name || '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          availability: Boolean(data.availability),
          expectedRate: data.expectedRate || '',
          manualOverride: Boolean(data.manualOverride),
          manualStatus: Boolean(data.manualStatus),
        });
      } catch (err) {
        setError('Error fetching profile');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        availability: Boolean(profile.availability),
        expectedRate: profile.expectedRate || '',
        manualOverride: Boolean(profile.manualOverride),
        manualStatus: Boolean(profile.manualStatus),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const updatedData = {
        ...formData,
        skills: formData.skills 
          ? formData.skills.split(',').map((skill) => skill.trim()).filter(skill => skill.length > 0)
          : [],
      };
      
      const { data } = await updateLabourProfile(updatedData);
      setProfile(data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Error updating profile. Please try again.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="labour-profile">
        <div className="profile-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="labour-profile">
        <div className="profile-container">
          <div className="error-container">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="labour-profile">
      <div className="profile-container">
        {/* Page Header */}
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <p>Manage your personal information and work preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-container">
            {error}
          </div>
        )}

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-header">
              <h2>✏️ Edit Profile</h2>
              <p>Update your information to help farmers find the right worker</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  💰 Expected Rate (₹/day)
                </label>
                <input
                  type="number"
                  name="expectedRate"
                  value={formData.expectedRate}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 500"
                  min="0"
                  step="50"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  🛠️ Skills (comma separated)
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  placeholder="e.g., Plowing, Harvesting, Irrigation, Pesticide Application"
                  rows="3"
                />
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Enter your skills separated by commas. This helps farmers find workers with the right expertise.
                </small>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="manualOverride"
                  name="manualOverride"
                  checked={formData.manualOverride || false}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <label htmlFor="manualOverride" className="checkbox-label">
                  🔧 Manually control my availability status
                </label>
              </div>

              {formData.manualOverride && (
                <div className="checkbox-group" style={{ marginLeft: '20px' }}>
                  <input
                    type="checkbox"
                    id="manualStatus"
                    name="manualStatus"
                    checked={formData.manualStatus || false}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="manualStatus" className="checkbox-label">
                    🟢 Set myself as available for work
                  </label>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                💾 Save Changes
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                ❌ Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Profile Display */
          <div className="profile-content">




            {/* Avatar and Basic Info */}
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {(profile?.name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="profile-basic-info">
                <h2>{profile?.name || user?.name || 'Unknown User'}</h2>
                <div className="email">{profile?.email || user?.email}</div>
                <span className="role-badge">Agricultural Worker</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="profile-details">
              {/* Contact Information */}
              <div className="detail-card">
                <div className="detail-item">
                  <div className="detail-icon">📧</div>
                  <div className="detail-content">
                    <div className="detail-label">Email Address</div>
                    <div className="detail-value">{profile?.email || 'Not provided'}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">📞</div>
                  <div className="detail-content">
                    <div className="detail-label">Phone Number</div>
                    <div className="detail-value">{profile?.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="detail-card">
                <div className="detail-item">
                  <div className="detail-icon">🟢</div>
                  <div className="detail-content">
                    <div className="detail-label">Availability Status</div>
                    <div className="detail-value">
                      <span className={`availability-status ${profile?.availability ? 'available' : 'unavailable'}`}>
                        {profile?.availability ? 'Available for Work' : 'Not Available'}
                      </span>
                      {profile?.calculatedAvailability && (
                        <div className="availability-details">
                          <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            {profile.calculatedAvailability.manualOverride 
                              ? `Manually set to ${profile.calculatedAvailability.manualStatus ? 'available' : 'unavailable'}`
                              : `Automatically calculated: ${profile.calculatedAvailability.reason}`
                            }
                          </small>
                          {!profile.availability && profile.calculatedAvailability.nextAvailableDate && (
                            <small style={{ color: '#6b7280', fontSize: '12px', display: 'block' }}>
                              Next available: {new Date(profile.calculatedAvailability.nextAvailableDate).toLocaleDateString()}
                            </small>
                          )}
                          {profile.calculatedAvailability.workSchedule && profile.calculatedAvailability.workSchedule.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <small style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'bold' }}>Current Work:</small>
                              {profile.calculatedAvailability.workSchedule.map((work, index) => (
                                <div key={index} style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>
                                  • {work.jobTitle} ({new Date(work.startDate).toLocaleDateString()} - {new Date(work.endDate).toLocaleDateString()})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">💰</div>
                  <div className="detail-content">
                    <div className="detail-label">Expected Daily Rate</div>
                    <div className="detail-value">
                      {profile?.expectedRate ? `₹${profile.expectedRate}/day` : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="detail-card">
              <div className="detail-item">
                <div className="detail-icon">🛠️</div>
                <div className="detail-content">
                  <div className="detail-label">Skills & Expertise</div>
                  <div className="detail-value">
                    {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                      <div className="skills-container">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="detail-value no-data">No skills added yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button onClick={handleEdit} className="edit-profile-btn">
                Edit Profile
              </button>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn">
                  <span className="action-icon">🔍</span>
                  <span className="action-text">Find Jobs</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">📊</span>
                  <span className="action-text">View Dashboard</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">📝</span>
                  <span className="action-text">Work History</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">💬</span>
                  <span className="action-text">Support</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


