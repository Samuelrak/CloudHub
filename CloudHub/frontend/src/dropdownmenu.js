import React from 'react';
import { Link } from 'react-router-dom';
import './dropdownmenu.css';
import { useAuth } from './AuthContext.js'; // Import the useAuth hook

function DropdownMenu() {
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="dropdown-container">
      {isLoggedIn && (
        <button className="dropdown-button">
          Toggle Dropdown
        </button>
      )}
      {isLoggedIn ? (
        <ul className="dropdown-menu">
          <li>
            <button className="dropdown-button">Settings</button>
          </li>
          <li>
            <button className="dropdown-button" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      ) : (
        <Link to="/login">
          <button className="login-button">
            Login
          </button>
        </Link>
      )}
    </div>
  );
}

export default DropdownMenu;
