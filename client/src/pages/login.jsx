import React, { useState } from 'react';
import '../styles/loginpage.css';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };  

  const validateUserData = (user) => {
    if (!user) return false;
    return user._id && user.email && user.role && user.firstName && user.lastName;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {      const res = await API.post('/api/auth/login', form);
      const { user, token } = res.data;

      if (!token) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      if (!validateUserData(user)) {
        setError('Your profile is incomplete. Please contact support.');
        setLoading(false);
        return;
      }

      // Store user data and token in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Set the token in API headers for future requests
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Navigate based on role
      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else if (user.role === 'alumni') {
        navigate('/alumni-dashboard');
      } else {
        setError('Invalid user role detected');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <h2>🎓 Collab Sphere</h2>
        <p className="subtitle">Welcome Back! Please Login to Continue</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
          />          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />          <div className="forgot-password">
            <a href="/reset-password">Forgot Password?</a>
          </div><button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="divider">or</div>
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
