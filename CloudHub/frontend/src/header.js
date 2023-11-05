import React from 'react';
import './Header.css'; 
import { NavLink } from 'react-router-dom';

// function Header() {
//   return (
//     <header> 
//       <h1 id="logo">Your Website Header</h1>
//         <nav>
//         <ul>
//         <li><a href="/">Home</a></li>
//         <li><a href="/pricing">Pricing</a></li>
//         <li><a href="/about">About Us</a></li>
//         <li><a href="/faq">FAQ</a></li>
//         <li><a href="/contact">Contact</a></li>
//       </ul>
//         </nav>
//     </header>
//   );
// }
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
      </div>
    </div>
  );
}

export default Header;




