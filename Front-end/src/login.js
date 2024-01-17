import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import './Login.css'; 

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    const data = { username, password };

    try {
      const response = await axios.post('http://localhost:5000/api/login', data);

      console.log('Server Response:', response.data);

      if (response.data.success) {
        const { token, session_id, username, user_id } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('session_id', session_id);
        localStorage.setItem('username', username);
        localStorage.setItem('user_id', user_id);
        setIsLoggedIn(true);
        onLogin();
        navigate('/');
      } else {
        console.error('Authentication failed. Details:', response.data);
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during the login process.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form className='form-login' onSubmit={handleLogin}>
        <div className="form-group-login1">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group-login1">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className='button-login' type="submit">Login</button>
      </form>
      <p className="signup-link">
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;
