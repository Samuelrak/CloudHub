import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './UserProfile.css';
import userImage from './user.png';
import DefaultProfile from './defaul_user.jpg';

const UserPublic = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState({});
  const [subscribed, setSubscribed] = useState(false);
  const [targetUsername, setTargetUsername] = useState(""); 
  const [heatmapData, setHeatmapData] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commentGetCount, setCommentGetCount] = useState(0);
  const [publicFiles, setPublicFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [fileCurrentPage, setFileCurrentPage] = useState(1);
  const fileItemsPerPage = 10;
  const [notifications, setNotifications] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photo, setPhoto] = useState("");
  const loggedInUsername = localStorage.getItem('username');
  const showUploadButton = username === loggedInUsername;
  const isAdmin = userData.isadmin === 1;
  const isCurrentUser = loggedInUsername === username;
  


  const getMonthName = (month) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[month];
  };

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
      
      setTargetUsername(userInfo.username);

      console.log(userData)
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

  const fetchPublicFiles = () => {
    const loggedInUsername = localStorage.getItem('username');
    const apiUrl = `http://localhost:5000/api/public-files-user-profile?username=${username}`;
  
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const files = data.data.map((fileArray) => ({
            created_at: fileArray[0],
            file_id: fileArray[1],
            file_name: fileArray[2],
            file_path: fileArray[3],
            file_size: fileArray[4],
            folder_id: fileArray[6],
            username: fileArray[6],
            user_id: fileArray[7],


          }));
          setPublicFiles(files);
        } else {
          console.error('Error fetching public files:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error fetching public files:', error);
      });
  };

  const fetchData = async (targetUsername) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-files-info-public?targetUsername=${targetUsername}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      if (!response.ok) {
        console.error('Error fetching user files info:', response.statusText);
        return;
      }

      const userData = await response.json();

      if (userData.error) {
        console.error('Error fetching user files info:', userData.error);
        return;
      }
      

      const heatmapData = Array.from({ length: 7 }, () =>
        Array.from({ length: 48 }, () => null)
      );

      userData.files.forEach((file) => {
        const createdDate = new Date(file.created_at);
        const rowIndex = createdDate.getDay();
        const cellIndex = (createdDate.getHours() * 60 + createdDate.getMinutes()) / 30;
      
        if (rowIndex >= 0 && rowIndex < 7 && cellIndex >= 0 && cellIndex < 48) {
          heatmapData[rowIndex][cellIndex] = file;
        }
      });

      setHeatmapData(heatmapData);
    } catch (error) {
      console.error('Error fetching user files info:', error);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    setSelectedPhoto(file);
  };

  const handlePhotoChangeAndUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
  
    const formData = new FormData();
    const loggedInUsername = localStorage.getItem('username');
    formData.append('photo', file);
    formData.append('username', file);
  
    try {
      const response = await fetch('http://localhost:5000/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        console.error('Error uploading photo:', response.statusText);
        return;
      }
  
      const data = await response.json();
      console.log('Photo uploaded successfully:', data);
  
    } catch (error) {
      console.error('Error uploading photo:', error);
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

  
        } else {
          console.error('Error subscribing:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error subscribing:', error);
      });
  };

  

  const MonthHeaders = () => {
    return (
      <div className="heatmap-month-headers">
        {Array.from({ length: monthsInYear }, (_, i) => (
          <div className="heatmap-month-header" key={`month-header-${i}`}>
            {getMonthName(i)}
          </div>
        ))}
      </div>
    );
  };

  const FileBox = ({ file }) => {
    return (
      <div className="file-box">
        <h3>{file.file_name}</h3>
        <p>File Size: {file.file_size} MB</p>

      </div>
    );
  };
  const handleRemoveClick = (file) => {
    const requestBody = {
      username: file.username
    };
  
    fetch(`http://localhost:5000/api/admin/remove-file/${file.username}/${file.file_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(requestBody), 
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('File removed successfully');
        } else {
          console.error('Error removing file:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error removing file:', error);
      });
  };
  
  const UserProfile = ({ userFiles }) => {
    return (
      <div className="user-profile">
        <h2>User Profile</h2>
        <div className="file-boxes">
          {userFiles.map((file) => (
            <FileBox key={file.file_id} file={file} />
          ))}
        </div>
      </div>
    );
  };
  const handleUserClick = (username) => {
    setSelectedUser(username);
    setFileCurrentPage(1);
    fetchUserFiles(username);
  };

  const startOfYear = new Date(new Date().getFullYear(), 0, 1); 
  const endOfYear = new Date(new Date().getFullYear(), 11, 31); 
  const monthsInYear = 12; 
  const daysInMonth = Math.ceil((endOfYear - startOfYear) / (1000 * 60 * 60 * 24) / monthsInYear);

  const heatmapMatrix = [];

  if (userData.files) {
    for (let month = 0; month < monthsInYear; month++) {
      const monthLabel = getMonthName(month); 
      heatmapMatrix.push(
        <div className="heatmap-month-label" key={`label-${month}`}>
          {monthLabel}
        </div>
      );

      for (let day = 0; day < daysInMonth; day++) {
        const currentDate = new Date(startOfYear);
        currentDate.setMonth(currentDate.getMonth() + month);
        currentDate.setDate(currentDate.getDate() + day);

        const filesOnDate = userData.files.filter((file) => {
          const createdDate = new Date(file.created_at);
          return (
            currentDate.getMonth() === createdDate.getMonth() &&
            currentDate.getDate() === createdDate.getDate()
          );
        });

        const cellColorClass = filesOnDate.length > 0 ? calculateCellColor(currentDate) : '';

        heatmapMatrix.push(
          <div className={`heatmap-cell ${cellColorClass}`} key={`${month}-${day}`}></div>
        );
      }
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users');
      if (!response.ok) {
        throw new Error('Error fetching user data');
      }
      const data = await response.json();
      setUsers(data);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  const fetchUserFiles = (userId) => {
    fetch(`http://localhost:5000/api/admin/user-files/${userId}`)
      .then((response) => response.json())
      .then((data) => {

        setUserFiles(data);
      })
      .catch((error) => {
        console.error('Error fetching user files:', error);
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
          setSubscribed(false); // Update the state to reflect unsubscribed
  
        } else {
          console.error('Error unsubscribing:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error unsubscribing:', error);
      });
  };


  const countSubscribers = async (targetUsername) => {
    try {
      const response = await fetch(`http://localhost:5000/api/counts?targetUsername=${targetUsername}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        console.error('Error counting subscribers:', response.statusText);
        return;
      }
  
      const data = await response.json();
      setSubscriberCount(data.subscriberCount); 
      setCommentCount(data.commentCount); 
      setCommentGetCount(data.commentGetCount); 
    } catch (error) {
      console.error('Error counting subscribers:', error);
    } 
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching notifications:', response.statusText);
        return;
      }

      const notificationData = await response.json();
      setNotifications(notificationData.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('photo');
    if (fileInput) {
      fileInput.click(); 
    }
  };

  const calculateFilePagination = () => {
    const startIndex = (fileCurrentPage - 1) * fileItemsPerPage;
    const endIndex = startIndex + fileItemsPerPage;
    return { startIndex, endIndex };
  };

  const renderUserFiles = () => {
    const { startIndex, endIndex } = calculateFilePagination();
    return userFiles.slice(startIndex, endIndex).map((file) => (
      <tr key={file.file_id}>
        <td>{file.file_name}</td>
        <td>{file.file_size} MB</td>
        <p>Username: {file.username}</p>
        <button onClick={() => handleRemoveClick(file)}>Remove</button>

      </tr>
    ));
  };
  const handleFilePageChange = (newPage) => {
    setFileCurrentPage(newPage);
  };

  const groupedFilesByDate = {};

  if (userData.files) {
    userData.files.forEach((file) => {
      const createdDate = new Date(file.created_at).toDateString();
      if (!groupedFilesByDate[createdDate]) {
        groupedFilesByDate[createdDate] = [];
      }
      groupedFilesByDate[createdDate].push(file);
    });
  }
  const calculateHeatmapData = (userData) => {
    const heatmapData = Array.from({ length: 7 }, () =>
      Array.from({ length: 48 }, () => 0)
    );
  
    if (userData.files) {
      userData.files.forEach((file) => {
        const createdDate = new Date(file.created_at);
        const rowIndex = createdDate.getDay();
        const cellIndex =
          (createdDate.getHours() * 60 + createdDate.getMinutes()) / 30;
  
        if (rowIndex >= 0 && rowIndex < 7 && cellIndex >= 0 && cellIndex < 48) {
          heatmapData[rowIndex][cellIndex]++;
        }
      });
    }
  
    return heatmapData;
  };
const calculateContributions = (userData) => {
  const contributions = {};

  userData.files.forEach((file) => {
    const createdDate = new Date(file.created_at).toLocaleDateString(); 
    if (!contributions[createdDate]) {
      contributions[createdDate] = 1;
    } else {
      contributions[createdDate]++;
    }
  });



  return contributions;
};

  const calculateCellColor = (activityLevel) => {
    if (activityLevel >= 50) {
      return 'heatmap-cell-very-dark';
    } else if (activityLevel >= 20) {
      return 'heatmap-cell-dark';
    } else if (activityLevel >= 10) {
      return 'heatmap-cell-medium';
    } else if (activityLevel >= 0) {
      return 'heatmap-cell-light';
    } else {
      return 'heatmap-cell-empty';
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserDataAndCheckSubscription();
    fetchData(username);
    setHeatmapData(heatmapMatrix);
    countSubscribers(username);
    fetchPublicFiles();
    fetchNotifications();
  }, [username]);

  useEffect(() => {
    if (userData.files && userData.files.length > 0) {
      const newHeatmapData = calculateHeatmapData(userData);

      setHeatmapData(newHeatmapData);
    }
  }, [userData.files]);

  return (
    <div className="user-public-container">

<div className="avatar">
  {userData.photo ? (
    <img
      src={`data:image/png;base64,${userData.photo}`} 
      alt={`Profile of ${userData.username}`}
      className="profile-photo"
    />
  ) : (
<img
  src={DefaultProfile}
  alt={`Default User Profile`}
  className="profile-photo"
/>
  )}
</div>
{showUploadButton ? (
  <label className="upload-button">
    <input
      type="file"
      id="photo"
      name="photo"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handlePhotoChangeAndUpload}
    />
    <button onClick={triggerFileInput}>Select Photo</button>
  </label>
) : (
  <button onClick={subscribed ? handleUnsubscribe : handleSubscribe}>
  {subscribed ? 'Unsubscribe' : 'Subscribe'}
</button>
)}
    <div className="user-info">
    <div className='uploaded-files'>
    <h2>Uploaded files</h2>
    </div>
    <div className="heatmap-container">
        <MonthHeaders />
        {heatmapData.map((row, rowIndex) => (
          <div className="heatmap-row" key={rowIndex}>
            {row.map((activityLevel, cellIndex) => {
              const cellColorClass = calculateCellColor(activityLevel);
              return (
                <div
                  className={`heatmap-cell ${cellColorClass}`}
                  key={`${rowIndex}-${cellIndex}`}
                ></div>
              );
            })}
          </div>
        ))}

      <div className="horizontal-line"></div>
      <div className='user-info-detail'>
    <h2>User info</h2>
    </div>
      <div className="form-container">
          <div className="form-row">
    
            <div className="form-field">
            <p><strong>email:</strong> {userData.email}</p>
            </div>
            <div className="form-field">
            <p><strong>gender:</strong> {userData.gender}</p>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
       
              <p><strong>address:</strong> {userData.address}</p>
            </div>
            <div className="form-field">
            <p><strong>email:</strong> {userData.dateOfBirth}</p>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field full-width">
            <p><strong>email:</strong> {userData.phoneNumber}</p>
            </div>
          </div>
        </div>
      </div>
        <div className="user-details">
          <div className="line-container">
            <div className="vertical-line"></div>
            <div className="vertical-line2"></div>
            <h2>User Profile</h2>
            <p><strong>Username:</strong> {userData.username}</p>
            <p><strong>Tier:</strong> {userData.tier}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Other Details:</strong> {userData.otherDetails}</p>
    </div>
        </div>
        <div className='counting-div'>

        <div className="horizontal-line1"></div>
        <h2 className='counting-h2'>Counting</h2>
      
      
        <div className='count-container'>
        <p className='count1'>Subscriber Count: {subscriberCount}</p>
        <p className='count2'>Comment Count: {commentCount}</p> 
        <p className='count3'>CommentGet Count: {commentGetCount}</p> 
          </div>
        </div>
        </div>
        {isCurrentUser && (
        <div className="notify-container">
          <div className="horizontal-line1"></div>
          <div className="notifications">
            <h3 className='notify-h2'>Notifications</h3>
            <table className="notification-table">
      <thead>
        <tr>
          <th>Notification</th>
        </tr>
      </thead>
      <tbody>
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <tr key={notification.id}>
              <td>{notification.message}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td>No notifications available</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
)}
      <div className="subscription-info">
      </div>

      {isAdmin && (
        <div>
          <div className="horizontal-line2"></div>
          <div className="vertical-line3"></div>
          <div className='admin-table'>
            <h3>User List</h3>
            <table className="user-list-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 &&
                  users.map((user) => (
                    <tr key={user.user_id} onClick={() => handleUserClick(user.username)}>
                      <td>{user.user_id}</td>
                      <td>{user.username}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="public-files">
              <h4>User Files:</h4>
              <table className="user-files-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>File Size (MB)</th>
                  </tr>
                </thead>
                <tbody>
                  {renderUserFiles()}
                </tbody>
              </table>
              <div className="file-pagination">
                <button
                  onClick={() => handleFilePageChange(fileCurrentPage - 1)}
                  disabled={fileCurrentPage === 1}
                >
                  Previous
                </button>
                <span>Page {fileCurrentPage}</span>
                <button
                  onClick={() => handleFilePageChange(fileCurrentPage + 1)}
                  disabled={fileCurrentPage * fileItemsPerPage >= userFiles.length}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default UserPublic;