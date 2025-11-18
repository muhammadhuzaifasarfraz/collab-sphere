import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import Signup from './pages/signup';
import Login from './pages/login';
import StudentDashboard from './pages/studentdashboard';
import AlumniDashboard from './pages/alumnidashboard';
import ProfilePage from './pages/profilepage'; // ✅ ADD THIS


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/alumni-dashboard" element={<AlumniDashboard />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* ✅ ADD THIS */}
      </Routes>
    </Router>
  );
}

export default App;
