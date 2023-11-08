import React, { useState } from 'react';
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); 

  const handleLogin = () => {
    axios.defaults.headers.common['X-CSRFToken'] = window.csrf_token;

    axios.post('http://localhost:8000/api/login/', { username, password })
    .then(response => {
      console.log('Response status:', response.status);
      if (response.status === 200) {
    
        setSuccessMessage('Login successful'); 
      } else {
        
        console.error('Authentication failed. Details:', response.data);
        setError('Authentication failed. Please check your credentials.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      setError('An error occurred during the login process.');
    });
  }

  return (
    <div className="login-page">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>} {}
      <form>
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
        <button type="button" onClick={handleLogin}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;