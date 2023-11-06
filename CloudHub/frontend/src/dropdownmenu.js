import React, { useState } from 'react';
import './dropdownmenu.css';

function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {

    setIsLoggedIn(true);
  };

  const handleLogout = () => {

    setIsLoggedIn(false);
  };

  return (
    <div className="dropdown-container">
      {isLoggedIn && (
        <button className="dropdown-button" onClick={toggleDropdown}>
          Toggle Dropdown
        </button>
      )}
      {isLoggedIn ? (
        <ul className="dropdown-menu">
          <li>
            <button className="dropdown-button">Settings</button>
          </li>
          <li>
            <button className="dropdown-button" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      ) : (
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
      )}
    </div>
  );
}

export default DropdownMenu;