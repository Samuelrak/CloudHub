import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './header';
import Home from './Home';
import About from './about';
import Login from './login';
import { UserProvider } from './usercontext'; 
import FileDetail from './FileDetail';
import UserProfile from './UserProfile'; 
import Pricing from './pricing'; 
import CreditCart from './CreditCart';
import { loadStripe } from '@stripe/stripe-js'; 
import { Elements } from '@stripe/react-stripe-js'; 
import Register from './Register';

const stripePromise = loadStripe('pk_test_51OTpbSF4Z1rGwqoeFuAs5yjY6ldMQuo6pgoNv6zw7hKKD5HL0CMXCc3lymf5QhaYE2179xTwFtMSvKLX8VIJhpyn00mhijCHAK');

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<About />} />    
            <Route path="/pricing" element={<Pricing />} />  
            <Route
              path="/login"
              element={<Login onLogin={() => <Navigate to="/" />} />}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/file-detail/:file_id" element={<FileDetail />} />
            <Route path="/user/:username" element={<UserProfile />} />
            <Route path="/Creditcart/:tier" element={<Elements stripe={stripePromise}><CreditCart /></Elements>} />
          </Routes>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
