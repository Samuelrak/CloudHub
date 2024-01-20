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
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/pricing" activeClassName="active">
              Pricing
            </NavLink>
          </li>
        </ul>
      </div>
        <DropdownMenu />
      </div>
  );
}

export default Header;
