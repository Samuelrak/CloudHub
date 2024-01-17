import React from 'react';
import './Carrousel.css';
import { NavLink } from 'react-router-dom';

const Carrousel = () => {
  return (
    <div className="container">
      <div className="sidebar">
        <h1 className='welcome'>Welcome to Our Site</h1>
      </div>
      <div className="main-content">
        <div className="welcome-text">
          <p>Welcome to Cloud Storage System NextGen, your ultimate destination for seamless digital file management and storage solutions. We've combined simplicity and security </p>
          <p>Explore our private cloud storage, stay organized with our efficient tools, and experience the power of sharing your files with others</p>
          <p>Welcome visitors to your site with a short, engaging introduction. Double click to edit and add your own text.</p>
        </div>
        <div className="action-button">
          <NavLink to="/dashboard">
            <button className="navlink-button">My Dashboard</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Carrousel;
