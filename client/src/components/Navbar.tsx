import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfilePicture = () => {
    if (user?.employee?.profilePicture) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.employee.profilePicture}`;
    }
    return null;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="logo">HRMS</div>
        </div>

        <div className={`navbar-links ${showMobileMenu ? 'active' : ''}`}>
          <Link to="/dashboard" onClick={() => setShowMobileMenu(false)}>
            Employees
          </Link>
          <Link to="/attendance" onClick={() => setShowMobileMenu(false)}>
            Attendance
          </Link>
          <Link to="/time-off" onClick={() => setShowMobileMenu(false)}>
            Time Off
          </Link>
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <>
              <Link to="/salary" onClick={() => setShowMobileMenu(false)}>
                Salary
              </Link>
              <Link to="/create-employee" onClick={() => setShowMobileMenu(false)}>
                Create Employee
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {getProfilePicture() ? (
                <img src={getProfilePicture()} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <FiUser />
                </div>
              )}
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <Link to="/my-profile" onClick={() => setShowDropdown(false)}>
                  <FiUser /> My Profile
                </Link>
                <button onClick={handleLogout}>
                  <FiLogOut /> Log Out
                </button>
              </div>
            )}
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

