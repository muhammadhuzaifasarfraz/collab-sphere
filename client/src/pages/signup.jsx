import React, { useState } from 'react';
import '../styles/signuppage.css';
import API from '../services/api';
import { useNavigate } from 'react-router-dom'; // Ensure this is correct

const SignupPage = () => {
  const navigate = useNavigate(); // Navigation using the correct hook
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    verifyPassword: '',
    role: 'student',
    batch: '',
    department: '',
    rollNumber: '',
    passingYear: '',
  });
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setIsStudent(value === 'student');
    setForm({ ...form, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.verifyPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);    try {
      const { data } = await API.post('/api/auth/signup', form);
      alert('Signup successful! You have successfully joined CollabSphere.');
      console.log('Signup response:', data);
      navigate('/login'); // Redirect to login after successful signup
    } catch (err) {
      console.error('Signup error:', err);
      
      // Check if the error response exists before trying to access data
      if (err.response && err.response.data && err.response.data.message) {
        const errorMessage = err.response.data.message;
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          alert('This email is already in use. Please use a different email.');
        } else {
          alert('Signup failed. Please try again.');
        }
      } else {
        // If no specific error message is returned, show a general error message
        alert('An unexpected error occurred. Please try again.');
      }
    }
    setLoading(false);
  };  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2>🎓 Collab Sphere</h2>
        <p className="subtitle">Create your account</p>
        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <input
            type="password"
            name="verifyPassword"
            value={form.verifyPassword}
            onChange={handleChange}
            placeholder="Verify Password"
            required
          />          <div className="role-selection">
            <p className="form-section-title">I am a:</p>
            <select name="role" value={form.role} onChange={handleRoleChange} required>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          {isStudent && (
            <>
              <p className="form-section-title">Student Information</p>
              <div className="student-fields">
                <select
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Batch</option>
                  {['SP20', 'FA20', 'SP21', 'FA21', 'SP22', 'FA22', 'SP23', 'FA23', 'SP24', 'FA24', 'SP25'].map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {['BCS', 'BSE', 'BBA', 'BAF', 'BAI', 'BCE', 'BEE', 'BME'].map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                placeholder="Roll Number"
                required
              />
            </>
          )}          {form.role === 'alumni' && (
            <>
              <p className="form-section-title">Alumni Information</p>
              <div className="alumni-fields">
                <select
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Batch</option>
                  {['SP20', 'FA20', 'SP21', 'FA21', 'SP22', 'FA22', 'SP23', 'FA23', 'SP24', 'FA24', 'SP25'].map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {['BCS', 'BSE', 'BBA', 'BAF', 'BAI', 'BCE', 'BEE', 'BME'].map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <select
                name="passingYear"
                value={form.passingYear}
                onChange={handleChange}
                required
                className="passing-year-select"
              >
                <option value="">Select Passing Year</option>
                {['2020', '2021', '2022', '2023', '2024', '2025'].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>          )}
          <button
            type="submit"
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="divider">or</div>
        <p className="login-link">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
