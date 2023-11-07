import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

import Home from './Home';
import About from './about';
import Login from './login';

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />    
        <Route path="/login" element={<Login />} />  
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
