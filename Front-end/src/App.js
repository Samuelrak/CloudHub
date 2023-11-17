import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, redirect } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './header';
import Home from './Home';
import About from './about';
import Login from './login';
import { UserProvider } from './usercontext'; 
import FileDetail from './FileDetail';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />    
            <Route
              path="/login"
              element={<Login onLogin={() => <Navigate to="/" />} />}
            />
            <Route path="/file-detail/:file_id" element={<FileDetail />} />
          </Routes>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
