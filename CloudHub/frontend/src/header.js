import React from 'react';
import './Header.css'; 
import { NavLink } from 'react-router-dom';
import DropdownMenu from './dropdownmenu.js';

function Header() {
  return (
    <div className="header">
      <div className="logo">
        <img src="cloudhub.png" alt="cloudhub logo" />
      </div>
      <div className="menu">
        <ul>
          <li>
            <NavLink to="/" exact activeClassName="active">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" activeClassName="active">
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/features" activeClassName="active">
              Features
            </NavLink>
          </li>
          <li>
            <NavLink to="/pricing" activeClassName="active">
              Pricing
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" activeClassName="active">
              Contact
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="user">
        <img src="user.png" alt="user icon" />
        <span>myname</span>
        <i className="arrow">▼</i>
        <DropdownMenu /> {}
      </div>
    </div>
  );
}

export default Header;




