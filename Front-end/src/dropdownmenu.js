import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dropdownmenu.css';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';
import { useUser } from './usercontext';

function DropdownMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
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

    const notificationInterval = setInterval(() => {
      checkForNewNotifications();
    }, 60000); 

    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  const checkForNewNotifications = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    try {
      const response = await axios.get('http://localhost:5000/api/check-notification');
      const { unreadNotificationsCount, unreadNotifications } = response.data;
      console.log('Unread notifications count:', unreadNotificationsCount);
      console.log('Unread notifications:', unreadNotifications);
  
      setNotifications(unreadNotificationsCount);
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  };

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
          <li>
          <button className="dropdown-button" onClick={() => navigate('/notifications')}>
            Notifications ({notifications})
          </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default DropdownMenu;
