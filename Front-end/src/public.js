import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import Comment from './Comment';

const PublicFiles = () => {
  const [publicFiles, setPublicFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 

  useEffect(() => {
    fetch('http://localhost:5000/api/public-files')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const files = data.data.map((fileArray) => ({
            file_id: fileArray[0],
            file_name: fileArray[1],
            folder_id: fileArray[2],
            file_size: fileArray[3],
            username: fileArray[4],
            file_path: fileArray[5],
            created_at: fileArray[6],
          }));
          setPublicFiles(files);
        } else {
          console.error('Error fetching public files:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error fetching public files:', error);
      });
  }, []);

  const fetchUserInfo = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-info/${username}`);
      if (response.ok) {
        const userInfo = await response.json();
        console.log('User Info:', userInfo);
      } else {
        console.error('Error fetching user info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleSearch = (query) => {
    setSearchQuery(query); 
  };


  const filteredFiles = searchQuery.trim() === '' ? publicFiles : publicFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2>Public Files</h2>
      <SearchBar onSearch={handleSearch} />
      {selectedFile ? (
        <div>
          <h3>File Details:</h3>
          <p><strong>File Name:</strong> {selectedFile.file_name}</p>
          <p><strong>File Size:</strong> {selectedFile.file_size} bytes</p>
          <Link to={`/user/${selectedFile.username}`}>
  {selectedFile.username}
</Link>
          <button onClick={() => setSelectedFile(null)}>Back to all files</button>
          <Comment file_id={selectedFile.file_id} />
        </div>
      ) : (
        <ul>
          {filteredFiles.map((file) => (
            <li key={file.file_id} onClick={() => handleFileClick(file)}>
              <div className="file-box">
                <div className="file-details">
                  <strong>File Name:</strong> {file.file_name}<br />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublicFiles;
