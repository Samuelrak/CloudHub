import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const UserPublic = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState({});
  const [subscribed, setSubscribed] = useState(false);

  const fetchUserDataAndCheckSubscription = async () => {
    const loggedInUsername = localStorage.getItem('username');
  
    try {
      const response = await fetch(`http://localhost:5000/api/user-info/${username}`);
      if (!response.ok) {
        console.error('Error fetching user info:', response.statusText);
        return;
      }
  
      const userInfo = await response.json();
      setUserData(userInfo);
      const targetUsername = userInfo.username;

      const subscriptionResponse = await fetch('http://localhost:5000/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          subscriberUsername: loggedInUsername,
          targetUsername: targetUsername,
        }),
      });
  
      if (!subscriptionResponse.ok) {
        console.error('Error checking subscription status:', subscriptionResponse.statusText);
        return;
      }
  
      const subscriptionData = await subscriptionResponse.json();
      setSubscribed(subscriptionData.isSubscribed);
    } catch (error) {
      console.error('Error in fetching user data or checking subscription status:', error);
    }
  };

  const handleSubscribe = () => {
    const loggedInUsername = localStorage.getItem('username');
    const targetUsername = userData.username; 
  
    fetch('http://localhost:5000/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        subscriberUsername: loggedInUsername, 
        targetUsername: targetUsername, 
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSubscribed(true);

          sendCustomNotification(loggedInUsername, `You have a new subscriber: ${loggedInUsername}`);
        } else {
          console.error('Error subscribing:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error subscribing:', error);
      });
  };

  const sendCustomNotification = (loggedInUsername, message) => {

    fetch('http://localhost:5000/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriberUsername: loggedInUsername, 
        message: message, 
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Notification sent successfully:', data.notification_id);
        } else {
          console.error('Error sending notification:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error sending notification:', error);
      });
  };

  const handleUnsubscribe = () => {
    const loggedInUsername = localStorage.getItem('username');
    const targetUsername = userData.username; 

    fetch('http://localhost:5000/api/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        subscriberUsername: loggedInUsername,
        targetUsername: targetUsername, 
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSubscribed(false);
        } else {
          console.error('Error unsubscribing:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error unsubscribing:', error);
      });
  };

  useEffect(() => {
    fetchUserDataAndCheckSubscription();
  }, [username]);

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>Username:</strong> {userData.username}</p>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Other Details:</strong> {userData.otherDetails}</p>
      <button onClick={subscribed ? handleUnsubscribe : handleSubscribe}>
        {subscribed ? 'Unsubscribe' : 'Subscribe'}
      </button>
    </div>
  );
};

export default UserPublic;
