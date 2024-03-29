import React, { useState, useEffect } from 'react';
import './FolderUpload.css'

const FolderUpload = ({ setIsMaxStorageReached, uploadSuccess, setVirusDetected, description, publish, currentFolderId, updateFileExplorer }) => {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [totalStorageMB, setTotalStorageMB] = useState(0);
  const [usedStorageMB, setUsedStorageMB] = useState(0);
  const [userTier, setUserTier] = useState('');
  const [userFiles, setUserFiles] = useState([]);
  const [uploading, setUploading] = useState(false); 

  const tierToStorageLimit = {
    free: 100,
    basic: 250,
    pro: 500,
    premium: 1000,
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const handleFileChange = (event) => {
    const files = event.target.files;
    setSelectedFiles(files);

    if (files.length > 0) {
      const folderPath = files[0].webkitRelativePath;
      const folderNames = folderPath.split('/');
      const folderName = folderNames[folderNames.length - 2];
      setSelectedFolderName(folderName);

    }
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0 || !selectedFolderName) {
      console.error('Please select files and choose a folder.');
      return;
    }

    let totalSelectedFileSize = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
      totalSelectedFileSize += selectedFiles[i].size;
    }

    const userTierLimit = tierToStorageLimit[userTier];
    if (totalSelectedFileSize > userTierLimit * 1024 * 1024) {
      console.error(`File size exceeds your storage limit of ${userTierLimit} MB.`);
      return;
    }

    const updatedUsedStorageMB = usedStorageMB + totalSelectedFileSize;
    if (updatedUsedStorageMB > userTierLimit * 1024 * 1024) {
      console.error(`Uploading these files will exceed your storage limit of ${userTierLimit} MB.`);
      setIsMaxStorageReached(true);
      return;
    }
    setIsMaxStorageReached(false);
    setUploading(true);

    const formData = new FormData();

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      formData.append('files[]', file);
    }

    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    if (!username || !token) {
      console.error('User_id, username, or token not found in localStorage.');
      return;
    }

    formData.append('folderName', selectedFolderName);
    formData.append('username', username);
    formData.append('user_id', userId)
    formData.append('description', description);
    formData.append('publish', publish);
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }

    fetch('http://localhost:5000/api/upload1', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          if (data.error.includes('virus detected')) {
            setVirusDetected(true);
          } else {
            console.error('Error uploading file:', data.error);
          }
        } else {
          console.log(data);
          const updatedUsedStorageMB = usedStorageMB + totalSelectedFileSize;
          setUsedStorageMB(updatedUsedStorageMB);
          uploadSuccess(true);
          updateFileExplorer();
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      })
      .finally(() => {
        setUploading(false); 
      });
  };

  const handleFolderUploadClick = () => {
    const fileInput = document.getElementById('folderInput');
    fileInput.click();
  };

  const fetchStorageInfo = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Token not found in localStorage.');
      return;
    }

    fetch('http://localhost:5000/api/user-files-info', {
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

        const totalStorage = tierToStorageLimit[fetchedUserTier] || 0;

        const usedStorage = data.files.reduce((total, file) => total + file.file_size, 0);

        setTotalStorageMB(totalStorage);
        setUsedStorageMB(usedStorage);
        setUserFiles(data.files);
      })
      .catch((error) => {
        console.error('Error fetching user storage info:', error);
      });
  };

  return (
    <div>
      <button className='input-folder' onClick={handleFolderUploadClick}>Choose Folder</button>

      <input
        type="file"
        id="folderInput"
        webkitdirectory="true"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        className='button-folder'
        onClick={handleUpload}
        disabled={!selectedFiles || uploading} 
      >
        Upload
      </button>

      {uploading && (
        <div className="uploading-indicator">
          <div className="circular-spinner"></div>
          <p>Uploading...</p>
        </div>
      )}
    </div>
  );
};

export default FolderUpload;
