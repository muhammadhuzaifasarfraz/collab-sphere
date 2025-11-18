// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: false // Disable this since we're using token-based auth
});

// Helper function to get full image URL
export const getFullImageUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_BASE_URL}${photoUrl}`;
};

// Add a request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (credentials) => API.post('/api/auth/login', credentials);
export const signup = (userData) => API.post('/api/auth/signup', userData);

// Jobs API
export const createJob = (jobData) => {
  console.log('Creating job with data:', jobData);
  return API.post('/api/jobs/create', jobData);
};
export const getAllJobs = () => API.get('/api/jobs/all');
export const getMyJobs = (userId) => API.get(`/api/jobs/my-jobs/${userId}`);
export const applyForJob = (applicationData) => API.post('/api/jobs/apply', applicationData);
export const getJobApplications = (jobId) => API.get(`/api/jobs/applications/${jobId}`);
export const updateApplicationStatus = (statusData) => API.post('/api/jobs/update-application-status', statusData);

// Messages API
export const sendMessage = (messageData) => API.post('/api/messages/send', messageData);
export const getConversation = (otherUserId) => API.get(`/api/messages/conversation/${otherUserId}`);
export const getConversations = () => API.get('/api/messages/conversations');
export const getMessagingUsers = () => API.get('/api/messages/users');

// Export the API instance
export default API;
