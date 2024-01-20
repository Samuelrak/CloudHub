import React, { useRef, useState, useEffect } from 'react';
import './FileUpload.css'

const FileUpload = ({ setIsMaxStorageReached, setUploadSuccess, setVirusDetected, description, publish, updateFileExplorer, currentFolderId, handleFileUploadSuccess  }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [userTier, setUserTier] = useState('');
  const [userStorageLimit, setUserStorageLimit] = useState(0);
  const [usedStorage, setUsedStorage] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserStorageInfo();
  }, []);

  const fetchUserStorageInfo = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Token not found in localStorage.');
      return;
    }

    fetch('http://localhost:5000/api/user-files-info1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error('Error fetching user storage info:', data.error);
          return;
        }

        const fetchedUserTier = data.tier;

        setUserTier(fetchedUserTier);

        const tierToStorageLimit = {
          free: 100,
          basic: 250,
          pro: 500,
          premium: 1000,
        };

        const userStorageLimit = tierToStorageLimit[fetchedUserTier] || 0;
        setUserStorageLimit(userStorageLimit);

        const usedStorage = data.files.reduce((total, file) => total + file.file_size, 0);
        setUsedStorage(usedStorage);
      })
      .catch((error) => {
        console.error('Error fetching user storage info:', error);
      });
  };

const handleFileChange = (event) => {
  const file = event.target.files[0];
  setSelectedFile(file);
  if (file) {
    handleUpload(); 
  }
};

  const handleUpload = () => {
    if (selectedFile && !uploading) {
      setUploading(true);
      if (usedStorage + selectedFile.size > userStorageLimit * 1024 * 1024) {
        console.error(`Uploading this file will exceed your storage limit of ${userStorageLimit} MB.`);
        setIsMaxStorageReached(true);
        return;
      }
      setIsMaxStorageReached(false);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', selectedFile.name);

      const username = localStorage.getItem('username');
      const token = localStorage.getItem('token');
      if (!username || !token) {
        console.error('User_id, username, or token not found in localStorage.');
        return;
      }

      formData.append('username', username);
      formData.append('token', token);
      formData.append('description', description);
      formData.append('publish', publish);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'username': username,
          'description': description
        }
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);

          if (data.success) {
            const updatedUsedStorage = usedStorage + selectedFile.size;
            setUsedStorage(updatedUsedStorage);

            setUploadSuccess(true);
            updateFileExplorer();
            handleFileUploadSuccess(data.data);
          } else {

            if (data.error.includes('virus detected')) {
              setVirusDetected(true);
            } else {
              console.error('Error uploading file:', data.error);
            }
          }
        })
        .catch(error => {
          console.error('Error uploading file:', error);
        })
        .finally(() => {
          setUploading(false);
        });
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className="buttons-container">
        <button
          className="choose-file-button"
          onClick={() => fileInputRef.current.click()}
        >
          Choose File
        </button>
        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          Upload
        </button>
      </div>
      {uploading && (
        <div className="uploading-indicator">
          <div className="circular-spinner"></div>
          <p>Uploading...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;