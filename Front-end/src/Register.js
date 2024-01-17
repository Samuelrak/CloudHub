import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; 

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState(''); 
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const validatePhoneNumber = (phoneNumber) => {
    const phoneNumberRegex = /^\d{10}$/; 
    return phoneNumberRegex.test(phoneNumber);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setTimeout(() => {
        setPasswordError('');
      }, 3000);
      return;
    }

    const age = calculateAge(dateOfBirth);

    if (age < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError('Invalid phone number format');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email address format');
      return;
    }

    const data = {
      username,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      phoneNumber,
      email
    };

    try {
      const response = await axios.post('http://localhost:5000/api/register', data);

      if (response.data.success) {
        navigate('/login');
      } else {
        console.error('Registration failed. Details:', response.data);
        setError('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred during the registration process.');
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleRegister}>
        <div className="form-group1">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength="20"
            required
          />
        </div>
        <div className="form-group1">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength="20"
            required
          />
        </div>
        <div className="form-group1">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            maxLength="20" 
            required
          />
          {passwordError && <p className="error-message">{passwordError}</p>}
        </div>
        <div className="form-row">
          <div className="form-group-register">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength="20" 
              required
            />
          </div>
          <div className="form-group-register">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength="20" 
              required
            />
          </div>
        </div>
        <div className="form-row">
        <div className="form-group2">
  <label className="gender-label">Gender</label>
  <select
    value={gender}
    onChange={(e) => setGender(e.target.value)}
    required
  >
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">other</option>
  </select>
</div>
          <div className="form-group-register">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group1">
          <label>Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength="20"
            required
          />
        </div>
        <div className="form-group1">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength="20" 
            required
          />
        </div>
        <button className='button-register' type="submit-register">Register</button>
      </form>
    </div>
  );
}

export default Register;
