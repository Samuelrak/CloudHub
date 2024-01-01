<<<<<<< HEAD
import React, { useState } from 'react';

const FolderUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);

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

    const formData = new FormData();

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      formData.append('files[]', file);
    }

    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
      console.error('User_id, username, or token not found in localStorage.');
      return;
    }

    formData.append('folderName', selectedFolderName);
    formData.append('username', username);

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
          console.error('Error uploading file:', data.error);
        } else {
          console.log(data);
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple directory="" webkitdirectory="" mozdirectory="" />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default FolderUpload;
=======
  import React, { useState } from 'react';

  const FolderUpload = () => {
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [selectedFolderName, setSelectedFolderName] = useState(null);

    const handleFileChange = (event) => {
      const files = event.target.files;
      setSelectedFiles(files);
    
      if (files.length > 0) {
        // Extract parent folder name from the file paths
        const folderPath = files[0].webkitRelativePath;
        const folderNames = folderPath.split('/');
    
        // Check if there is a parent folder
        if (folderNames.length > 2) {
          const parentFolderName = folderNames[folderNames.length - 3];
          setSelectedFolderName(parentFolderName);
        } else {
          // No parent folder (top-level), set it to null or handle it accordingly
          setSelectedFolderName(null);
        }
      }
    };
    
    const handleUpload = () => {
      if (!selectedFiles || selectedFiles.length === 0 || !selectedFolderName) {
        console.error('Please select files and choose a folder.');
        return;
      }
    
      const formData = new FormData();
    
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        formData.append('files[]', file);
      }
    
      const username = localStorage.getItem('username');
      const token = localStorage.getItem('token');
      if (!username || !token) {
        console.error('User_id, username, or token not found in localStorage.');
        return;
      }
    
      // Append folder name and parent folder ID to the form data
      formData.append('folderName', selectedFolderName);
      formData.append('username', username);
    
      // Append parent folder name to the form data
      formData.append('parentFolderName', selectedFolderName);
    
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
            console.error('Error uploading file:', data.error);
          } else {
            console.log(data);
            // Refresh the folder view here if needed
          }
        })
        .catch(error => {
          console.error('Error uploading file:', error);
        });
    };

    return (
      <div>
        <input type="file" onChange={handleFileChange} multiple directory="" webkitdirectory="" mozdirectory="" />
        <button onClick={handleUpload}>Upload</button>
      </div>
    );
  };

  export default FolderUpload;
>>>>>>> 3546cf8f1c90c75ffa6d0ee4f8baacbf45e4d0b6
