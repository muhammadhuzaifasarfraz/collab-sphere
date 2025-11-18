import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getFullImageUrl } from '../services/api';
import '../styles/profilepage.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const departments = ['BCS', 'BSE', 'BBA', 'BAF', 'BAI', 'BCE', 'BEE', 'BME'];
const batches = ['SP20', 'FA20', 'SP21', 'FA21', 'SP22', 'FA22', 'SP23', 'FA23', 'SP24', 'FA24', 'SP25'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    batch: '',
    profilePhoto: '',
    rollNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/api/auth/profile');
        setProfile(response.data);
        if (response.data.profilePhoto) {
          setPreviewImage(getFullImageUrl(response.data.profilePhoto));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const validateFile = (file) => {
    if (!file) return false;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleFileChange = async (e) => {
    setError('');
    setSuccess('');
    const file = e.target.files[0];
    
    if (!validateFile(file)) {
      fileInputRef.current.value = '';
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await API.post('/api/auth/upload-photo', formData, {
        headers: {
          // Don't set Content-Type here, it will be set automatically with the boundary
        },
      });

      const fullPhotoUrl = getFullImageUrl(response.data.photoUrl);
      setProfile(prev => ({
        ...prev,
        profilePhoto: response.data.photoUrl
      }));
      setPreviewImage(fullPhotoUrl);
      setSuccess('Profile photo updated successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload profile photo');
      setPreviewImage(profile.profilePhoto || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Ensure we have all required fields, including role
      const updateData = {
        ...profile,
        role: profile.role // Explicitly include role
      };
      
      await API.put('/api/auth/update', updateData);
      setSuccess('Profile updated successfully!');
      // Wait for 2 seconds to show the success message before redirecting
      setTimeout(() => {
        if (profile.role === 'student') {
          navigate('/student-dashboard');
        } else {
          navigate('/alumni-dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button 
            className="back-button"
            onClick={() => navigate(profile.role === 'student' ? '/student-dashboard' : '/alumni-dashboard')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <h2>Edit Profile</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            <img
              src={previewImage || getFullImageUrl(profile.profilePhoto) || '/default-avatar.png'}
              alt="Profile"
              className="profile-photo"
            />
          </div>
          <label className="photo-upload-label">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="photo-upload"
              ref={fileInputRef}
            />
          </label>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-fields">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                readOnly
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={profile.role === 'student' ? 'Student' : 'Alumni'}
                readOnly
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={profile.department}
                onChange={handleChange}
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
                name="batch"
                value={profile.batch}
                onChange={handleChange}
                required
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>

            {profile.role === 'student' && (
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={profile.rollNumber || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
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
};

export default ProfilePage;
