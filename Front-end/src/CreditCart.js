import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios'; 

const CreditCart = () => {
  const navigate = useNavigate();
  const { tier } = useParams();
  const stripe = useStripe();
  const elements = useElements();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { token, error } = await stripe.createToken(cardElement);

      if (error) {
        console.error(error.message);
        setPaymentError(error.message);
        setPaymentSuccess(false);
      } else {
        console.log({ token, tier, nameOnCard });
        setPaymentError(null);
        setPaymentSuccess(true);

        axios.post('http://localhost:5000/api/update-tier', {
          token: token,
          username: username,
          tier: tier,
        })
        .then((response) => {
          console.log('Tier updated successfully');
        })
        .catch((error) => {
          console.error('Failed to update tier', error);
        });

        setTimeout(() => {
          setPaymentSuccess(false);
          navigate('/');
        }, 5000);
      }
    } catch (error) {
      console.error(error.message);
      setPaymentError(error.message);
      setPaymentSuccess(false);
    }
  };

  useEffect(() => {
  }, []);

  return (
    <div>
      <h2>Payment Information</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
        <button type="submit">Pay</button>
      </form>
      <p>Username: {username}</p>
      <p>Tier: {tier}</p>
      {paymentError && <div className="error-message">{paymentError}</div>}
      {paymentSuccess && <div className="success-message">Payment successful!</div>}
    </div>
  );
};

export default CreditCart;
