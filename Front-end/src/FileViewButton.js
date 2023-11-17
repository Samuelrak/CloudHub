import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import axios from 'axios';
import jpgIcon from './jpg-icon.png';
import FileDetail from './FileDetail';

function formatBytes(bytes) {
  if (bytes === 0) return '0.00 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function FileViewButton() {
  const [files, setFiles] = useState([]);
  const [selectedFilename, setSelectedFilename] = useState(null);
  const [isComponentVisible, setComponentVisibility] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/files')
      .then(response => {
        setFiles(response.data.files);
      })
      .catch(error => {
        console.error('Error fetching files:', error);
      });
  }, []);

  const handleFileClick = (filename) => {
    setSelectedFilename(filename);
  };

  if (!isComponentVisible) {
    return null; 
  }

  const handleDownload = (filename) => {
    const downloadUrl = `http://localhost:5000/api/download/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div>
      <h2>File List</h2>
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>User ID</th>
            <th>Username</th>
            <th>Created At</th>
            <th>File Size</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.file_id}>
              <td>
                {file.filename.endsWith('.jpg') ? (
                  <img src={jpgIcon} alt="JPG Icon" />
                ) : file.filename.endsWith('.png') ? (
                  <img src={jpgIcon} alt="PNG Icon" />
                ) : (
                  <span>{file.filename}</span>
                )}
              </td>
              <td>
                <Link to={`/file-detail/${file.file_id}`}>
                  {file.username}
                </Link>
              </td>
              <td>{file.filename}</td>
              <td>{file.user_id}</td>
              <td>{file.username}</td>
              <td>{file.created_at}</td>
              <td>{formatBytes(file.file_size)}</td>
              <td>
                <button onClick={() => handleDownload(file.filename)}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FileViewButton;
