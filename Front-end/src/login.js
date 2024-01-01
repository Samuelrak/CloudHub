import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div>
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
