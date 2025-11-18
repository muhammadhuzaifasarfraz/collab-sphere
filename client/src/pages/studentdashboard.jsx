import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/studentdashboard.css';
import API, { getAllJobs, applyForJob, getFullImageUrl } from '../services/api';
import Connect from '../components/Connect';

const departments = ['BCS', 'BSE', 'BBA', 'BAF', 'BAI', 'BCE', 'BEE', 'BME'];
const batches = ['SP20', 'FA20', 'SP21', 'FA21', 'SP22', 'FA22', 'SP23', 'FA23', 'SP24', 'FA24', 'SP25'];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [filter, setFilter] = useState('all');  const sidebarItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'jobs', icon: '💼', label: 'Jobs' },
    { id: 'applications', icon: '📝', label: 'My Applications' },
    { id: 'chat', icon: '💬', label: 'Messages' },
    { id: 'profile', icon: '👤', label: 'Profile' },    { id: 'logout', icon: '🚪', label: 'Logout', action: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }}
  ];

  useEffect(() => {
    // Get user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log('Retrieved user from localStorage (student dashboard):', storedUser);
    
    if (storedUser && storedUser.role === 'student') {
      setUser(storedUser);
      fetchJobs();
    } else {
      console.log('User not found or not student. Redirecting to login.');
      // Redirect if not logged in or not a student
      navigate('/login');
    }
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getAllJobs();
      setJobs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job listings');
      setLoading(false);
    }
  };

  const selectJob = (job) => {
    setSelectedJob(job);
    setProposal('');
    setError('');
    setSuccess('');
  };

  const handleProposalChange = (e) => {
    setProposal(e.target.value);
  };
  const submitApplication = async (e) => {
    e.preventDefault();
    
    if (!proposal.trim()) {
      setError('Please write a proposal before submitting');
      return;
    }
    
    // Check if user exists and has _id
    if (!user || !user._id) {
      console.error('User or user ID is missing:', user);
      setError('User information is missing. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Submitting application with data:', {
        jobId: selectedJob._id,
        studentId: user._id,
        proposal
      });
      
      await applyForJob({
        jobId: selectedJob._id,
        studentId: user._id,
        proposal
      });
      
      setSuccess('Application submitted successfully!');
      setProposal('');
      setSelectedJob(null);
      
      // Refresh jobs to update application status
      fetchJobs();
      setLoading(false);
    } catch (err) {
      console.error('Error applying for job:', err);
      setError(err.response?.data?.error || 'Failed to submit application');
      setLoading(false);
    }
  };
  
  const filteredJobs = filter === 'all' ? 
    jobs : 
    jobs.filter(job => job.type === filter);
  
  // Check if student has already applied for a job
  const hasApplied = (job) => {
    return job.applications && job.applications.some(app => app.student === user?._id);
  };  

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return (
          <div className="dashboard-overview">
            <h1>Welcome, {user?.firstName}!</h1>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>My Applications</h3>
                <p>{jobs.filter(job => hasApplied(job)).length} Applications</p>
              </div>
              <div className="stat-card">
                <h3>Available Jobs</h3>
                <p>{jobs.length} Opportunities</p>
              </div>
            </div>
          </div>
        );

      case 'jobs':
        return (
          <section className="jobs-section">
            <div className="section-header">
              <h2>Available Opportunities</h2>
              <div className="filter-options">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filter === 'job' ? 'active' : ''}`}
                  onClick={() => setFilter('job')}
                >
                  Jobs
                </button>
                <button 
                  className={`filter-btn ${filter === 'internship' ? 'active' : ''}`}
                  onClick={() => setFilter('internship')}
                >
                  Internships
                </button>
              </div>
            </div>

            <div className="jobs-container">
              {loading ? (
                <p>Loading opportunities...</p>
              ) : filteredJobs.length > 0 ? (
                <div className="jobs-list">                  {filteredJobs.map(job => (
                    <div
                      key={job._id}
                      className={`job-item ${selectedJob?._id === job._id ? 'selected' : ''}`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <h3>{job.title}</h3>
                      <div className="job-meta">
                        <span className="job-company">{job.company}</span>
                        <span className="job-location">{job.location}</span>
                        <span className="job-type">{job.type}</span>
                      </div>
                      <p className="job-preview">
                        {job.description.length > 100 
                          ? `${job.description.substring(0, 100)}...` 
                          : job.description}
                      </p>
                      <div className="job-footer">
                        <span className="posted-date">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        {hasApplied(job) && (
                          <div className="applied-badge">Applied</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No opportunities found.</p>
              )}

              {selectedJob && (
                <div className="job-details">
                  <h3>{selectedJob.title}</h3>
                  <div className="job-meta">
                    <span className="job-company">{selectedJob.company}</span>
                    <span className="job-location">{selectedJob.location}</span>
                    <span className="job-type">{selectedJob.type}</span>
                  </div>
                  <div className="job-section">
                    <h4>Description:</h4>
                    <p>{selectedJob.description}</p>
                  </div>
                  <div className="job-section">
                    <h4>Requirements:</h4>
                    <p>{selectedJob.requirements}</p>
                  </div>
                  
                  {!hasApplied(selectedJob) ? (
                    <form onSubmit={submitApplication} className="application-form">
                      <h4>Submit Your Application</h4>
                      <div className="form-group">
                        <label>Your Proposal/Cover Letter:</label>
                        <textarea 
                          value={proposal} 
                          onChange={handleProposalChange} 
                          placeholder="Explain why you're a good fit for this position..."
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="apply-btn" 
                        disabled={loading || !proposal.trim()}
                      >
                        {loading ? 'Submitting...' : 'Apply Now'}
                      </button>
                    </form>
                  ) : (
                    <div className="already-applied">
                      You have already applied to this position.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );

      case 'applications':
        return (
          <div className="applications-section">
            <h2>My Applications</h2>
            <div className="applications-list">
              {jobs.filter(job => hasApplied(job)).map(job => (
                <div key={job._id} className="application-item">
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span className="job-company">{job.company}</span>
                    <span className="job-type">{job.type}</span>
                  </div>
                  <div className="application-status">Applied</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="chat-container">
            {user && <Connect currentUser={user} />}
          </div>
        );      case 'profile':
        return (
          <div className="profile-section">
            <div className="profile-container">
              <div className="profile-header">
                <h2>Edit Profile</h2>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="profile-photo-section">
                <div className="profile-photo-container">
                  <img
                    src={user?.profilePhoto ? getFullImageUrl(user.profilePhoto) : '/default-avatar.png'}
                    alt="Profile"
                    className="profile-photo"
                  />
                </div>
                <label className="photo-upload-label">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      if (!file.type.startsWith('image/')) {
                        setError('Please upload an image file');
                        return;
                      }
                      
                      if (file.size > 5 * 1024 * 1024) {
                        setError('File size must be less than 5MB');
                        return;
                      }

                      try {
                        const formData = new FormData();
                        formData.append('profilePhoto', file);
                        
                        const response = await API.post('/api/auth/upload-photo', formData);
                        setUser(prev => ({
                          ...prev,
                          profilePhoto: response.data.photoUrl
                        }));
                        setSuccess('Profile photo updated successfully!');
                      } catch (err) {
                        setError('Failed to upload profile photo');
                      }
                    }}
                    className="photo-upload"
                  />
                </label>
              </div>

              <form className="profile-form" onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await API.put('/api/auth/update', user);
                  setSuccess('Profile updated successfully!');
                  setTimeout(() => setSuccess(''), 3000);
                } catch (err) {
                  setError('Failed to update profile');
                }
                setLoading(false);
              }}>
                <div className="profile-fields">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={user?.firstName || ''}
                      onChange={(e) => setUser({...user, firstName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={user?.lastName || ''}
                      onChange={(e) => setUser({...user, lastName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="readonly-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value="Student"
                      readOnly
                      className="readonly-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={user?.department || ''}
                      onChange={(e) => setUser({...user, department: e.target.value})}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Batch</label>
                    <select
                      value={user?.batch || ''}
                      onChange={(e) => setUser({...user, batch: e.target.value})}
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Roll Number</label>
                    <input
                      type="text"
                      value={user?.rollNumber || ''}
                      onChange={(e) => setUser({...user, rollNumber: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`submit-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="student-dashboard">
      <div className="dashboard-container">
        <div className="sidebar">
          {sidebarItems.map(item => (            <button 
              key={item.id}
              className={`sidebar-button ${activeComponent === item.id ? 'active' : ''}`}
              onClick={item.action || (() => setActiveComponent(item.id))}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="main-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
