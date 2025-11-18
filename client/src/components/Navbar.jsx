import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar = ({ showBack = true, showLogout = false, showProfile = true, title = "Collab Sphere" }) => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // Go back to the previous page in history
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };
  
  const goToProfile = () => {
    navigate('/profile'); // Navigate to the profile page
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          {showBack && (
            <button className="back-button" onClick={goBack}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          )}
        </div>
        
        <div className="navbar-center">
          <h1 className="navbar-title">{title}</h1>
        </div>
          <div className="navbar-right">
          {showProfile && (
            <button className="profile-button" onClick={goToProfile}>
              Profile <i className="fas fa-user"></i>
            </button>
          )}
          {showLogout && (
            <button className="logout-button" onClick={handleLogout}>
              Logout <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;