import React from 'react';
import { NavLink } from 'react-router-dom';
import DropdownMenu from './dropdownmenu'; 
import './Header.css';
import logoImage from './output-onlinepngtools.png'

function Header() {
  return (
    <div className="header">
      <div className="logo">
      <img src={logoImage}
      alt="cloudhub logo" />

      </div>
      <div className="menu">
        <ul>
          <li>
            <NavLink to="/" exact activeClassName="active">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" activeClassName="active">
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
        <DropdownMenu />
      </div>
    </div>
  );
}

export default Header;
