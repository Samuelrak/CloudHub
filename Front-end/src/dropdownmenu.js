import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dropdownmenu.css';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';
import { useUser } from './usercontext';

function DropdownMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, updateUser } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          const response = await axios.get('http://localhost:5000/api/user-info');
          updateUser(response.data); 
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    updateUser(null);
  };

  const handleAboutClick = () => {
    setMenuVisible(false);
    navigate('/about');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleToggleBarClick = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <div className="dropdown-container">
      <div className="toggle-bar" onClick={handleToggleBarClick}>
        {user ? (
          <span>{user.username ? `Hello, ${user.username}` : 'Toggle Dropdown ▼'}</span>
        ) : (
          <button className="login-button" onClick={handleLoginClick}>
            Login
          </button>
        )}
      </div>
  
      {menuVisible && user && (
        <ul className="dropdown-menu">
          <li>
            <Link to="/about" className="dropdown-link" onClick={handleAboutClick}>
              About
            </Link>
          </li>
          <li>
            <button className="dropdown-button">Settings</button>
          </li>
          <li>
            <button className="dropdown-button" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      )}
    </div>
  );
      }

export default DropdownMenu;
/*
// DropdownMenu.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dropdownmenu.css';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';

function DropdownMenu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          const response = await axios.get('http://localhost:5000/api/user-info');
          setUsername(response.data.username);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error fetching user info:', error);
          setIsLoggedIn(false);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleAboutClick = async () => {
    setMenuVisible(false);
    navigate('/about');
  };

  const handleLoginClick = async () => {
    // Redirect to the login page only if the user is not logged in
    if (!isLoggedIn) {
      navigate('/login');
    }
  };

  const handleToggleBarClick = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <div className="dropdown-container">
      <div className="toggle-bar" onClick={handleToggleBarClick}>
        {isLoggedIn ? (
          <span>{username ? `Hello, ${username}` : 'Toggle Dropdown ▼'}</span>
        ) : (
          // Only show the "Login" button if the user is not logged in and the username is not fetched
          !username && (
            <button className="login-button" onClick={handleLoginClick}>
              Login
            </button>
          )
        )}
      </div>
      {loading ? (
        <LoadingIndicator style={{ zIndex: 1000 }} />
      ) : (
        menuVisible &&
        isLoggedIn && (
          <ul className="dropdown-menu">
            <li>
              <Link to="/about" className="dropdown-link" onClick={handleAboutClick}>
                About
              </Link>
            </li>
            <li>
              <button className="dropdown-button">Settings</button>
            </li>
            <li>
              <button className="dropdown-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        )
      )}
    </div>
  );
}

export default DropdownMenu;

*/

