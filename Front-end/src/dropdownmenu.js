import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dropdownmenu.css';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';
import { useUser } from './usercontext';
import { useAuth } from './AuthContext';
import './dropdownmenu.css';

function DropdownMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = localStorage.getItem('token');

      setLoading(true);

      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          const response = await axios.get('http://localhost:5000/api/user-info');
          updateUser(response.data);
          setIsLoggedIn(true);

          // Check for notifications immediately after successful login
          checkForNewNotifications();
        } catch (error) {
          console.error('Error fetching user info:', error);
          handleLogout();
        }
      } else {
        setIsLoggedIn(false);
        updateUser(null);
      }
      setLoading(false);
    };

    fetchData();

    const notificationInterval = setInterval(() => {
      checkForNewNotifications();
    }, 60000);

    // Check for notifications immediately when the component mounts
    checkForNewNotifications();

    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  useEffect(() => {
    // Add a click event listener to handle toggling the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
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

  const toggleDropdown = (event) => {
    event.stopPropagation(); // Prevent the click event from propagating to document
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    updateUser(null);
    setIsLoggedIn(false);
  };

  const handleAboutClick = () => {
    setMenuVisible(false);
    navigate('/about');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleToggleBarClick = () => {
    setMenuVisible(!menuVisible);
  };
  

  return (
    <div className="dropdown-container">
      <div className="toggle-bar" onClick={handleToggleBarClick}>
        {isLoggedIn ? (
          <span onClick={toggleDropdown}>
            {user && user.username ? `Hello, ${user.username}` : 'Toggle Dropdown ▼'}
          </span>
        ) : (
          <>
            <button className="login-button" onClick={handleLoginClick}>
              Login
            </button>
            <button className="register-button" onClick={handleRegisterClick}>
              Register
            </button>
          </>
        )}
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
        menuVisible && user && (
          <div className="dropdown-menu" ref={dropdownRef}>
            <ul>
              <li>
              </li>
              <li>
              <Link to={`/user/${user.username}`}>{user.username} my profile</Link>
              </li>
              <li>
                <button className="dropdown-button" onClick={() => navigate('/notifications')}>
                  Notifications ({notifications})
                </button>
              </li>
              <li>
                <button className="dropdown-button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )
      )}
    </div>
  );
}

export default DropdownMenu;