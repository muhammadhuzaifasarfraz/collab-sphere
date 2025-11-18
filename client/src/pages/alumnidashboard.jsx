import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/alumnidashboard.css';
import API, { createJob, getMyJobs, getJobApplications, updateApplicationStatus, getFullImageUrl } from '../services/api';
import Connect from '../components/Connect';

const departments = ['BCS', 'BSE', 'BBA', 'BAF', 'BAI', 'BCE', 'BEE', 'BME'];
const batches = ['SP20', 'FA20', 'SP21', 'FA21', 'SP22', 'FA22', 'SP23', 'FA23', 'SP24', 'FA24', 'SP25'];

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    type: 'job'
  });
  const [showJobForm, setShowJobForm] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const sidebarItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'postjob', icon: '📝', label: 'Post Job' },
    { id: 'myjobs', icon: '💼', label: 'My Jobs' },
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
    console.log('Retrieved user from localStorage:', storedUser);
    
    if (storedUser && storedUser.role === 'alumni') {
      setUser(storedUser);
      // Load jobs posted by this alumni
      fetchMyJobs(storedUser._id);
    } else {
      console.log('User not found or not alumni. Redirecting to login.');
      // Redirect if not logged in or not an alumni
      navigate('/login');
    }
  }, [navigate]);

  const fetchMyJobs = async (userId) => {
    if (!userId) {
      console.error('Cannot fetch jobs: userId is undefined');
      setError('User ID is missing. Please log in again.');
      return;
    }
    
    try {
      console.log('Fetching jobs for user ID:', userId);
      setLoading(true);
      const response = await getMyJobs(userId);
      console.log('Jobs fetched successfully:', response.data);
      setMyJobs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load your job listings: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId) => {
    try {
      setLoading(true);
      const response = await getJobApplications(jobId);
      setApplications(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
      setLoading(false);
    }
  };

  const handleJobFormChange = (e) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value
    });
  };

  const toggleJobForm = () => {
    setShowJobForm(!showJobForm);
    setError('');
    setSuccess('');
  };  

  const submitJobForm = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Check if user exists and has _id
      if (!user || !user._id) {
        console.error('User or user ID is missing:', user);
        setError('User information is missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('Submitting job form with user ID:', user._id);
      
      // Use the response to check for success and display job details if needed
      const { data } = await createJob({
        ...jobForm,
        userId: user._id
      });
      
      console.log('Job created successfully:', data);
      setSuccess('Job/Internship posted successfully!');
      setJobForm({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        type: 'job'
      });
      setShowJobForm(false);
      
      // Refresh job listings
      fetchMyJobs(user._id);
      setLoading(false);
    } catch (err) {
      console.error('Error posting job:', err);
      setError(err.response?.data?.error || 'Failed to post job/internship');
      setLoading(false);
    }
  };

  const viewApplications = (job) => {
    setSelectedJob(job);
    fetchJobApplications(job._id);
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setLoading(true);
      await updateApplicationStatus({
        jobId: selectedJob._id,
        applicationId,
        status
      });
      
      // Refresh applications
      fetchJobApplications(selectedJob._id);
      setSuccess(`Application ${status} successfully`);
      setLoading(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update application status');
      setLoading(false);
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return (
          <div className="dashboard-overview">
            <h1>Welcome, {user?.firstName}!</h1>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Posted Jobs</h3>
                <p>{myJobs.length} Opportunities</p>
              </div>
              <div className="stat-card">
                <h3>Total Applications</h3>
                <p>{myJobs.reduce((total, job) => total + job.applications.length, 0)} Applications</p>
              </div>
            </div>
          </div>
        );

      case 'postjob':
        return (
          <section className="post-job-section">
            <h2>Post New Opportunity</h2>
            <form onSubmit={submitJobForm} className="job-form">
              <div className="form-group">
                <label>Title:</label>
                <input 
                  type="text" 
                  name="title" 
                  value={jobForm.title} 
                  onChange={handleJobFormChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Company:</label>
                <input 
                  type="text" 
                  name="company" 
                  value={jobForm.company} 
                  onChange={handleJobFormChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input 
                  type="text" 
                  name="location" 
                  value={jobForm.location} 
                  onChange={handleJobFormChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea 
                  name="description" 
                  value={jobForm.description} 
                  onChange={handleJobFormChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Requirements:</label>
                <textarea 
                  name="requirements" 
                  value={jobForm.requirements} 
                  onChange={handleJobFormChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select 
                  name="type" 
                  value={jobForm.type} 
                  onChange={handleJobFormChange} 
                  required
                >
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Posting...' : 'Post Opportunity'}
              </button>
            </form>
          </section>
        );

      case 'myjobs':
        return (
          <section className="my-jobs-section">
            <h2>My Posted Opportunities</h2>
            {loading ? (
              <p>Loading...</p>
            ) : myJobs.length > 0 ? (
              <div className="jobs-grid">
                {myJobs.map(job => (
                  <div key={job._id} className="job-card">
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <span className="job-type">{job.type}</span>
                    </div>
                    <p className="job-company">{job.company} • {job.location}</p>
                    <p className="applications-count">
                      {job.applications.length} application(s)
                    </p>
                    <button 
                      onClick={() => viewApplications(job)} 
                      className="view-btn"
                      disabled={job.applications.length === 0}
                    >
                      View Applications
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No jobs posted yet.</p>
            )}

            {selectedJob && (
              <div className="applications-view">
                <h3>Applications for {selectedJob.title}</h3>
                {loading ? (
                  <p>Loading applications...</p>
                ) : applications.length > 0 ? (
                  <div className="applications-list">
                    {applications.map(app => (
                      <div key={app._id} className="application-item">
                        <div className="application-header">
                          <h4>From: {app.student.email}</h4>
                          <span className={`status status-${app.status}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="proposal">{app.proposal}</p>
                        <div className="application-date">
                          Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                        </div>
                        {app.status === 'pending' && (
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleStatusUpdate(app._id, 'accepted')}
                              className="accept-btn"
                              disabled={loading}
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(app._id, 'rejected')}
                              className="reject-btn"
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No applications received yet.</p>
                )}
              </div>
            )}
          </section>
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
                      value="Alumni"
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
    <div className="alumni-dashboard">
      <div className="dashboard-container">
        <div className="sidebar">
          {sidebarItems.map(item => (
            <button 
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

export default AlumniDashboard;
