import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import jpgIcon from './jpg-icon.png';

function formatBytes(bytes) {
  if (bytes === 0) return '0.00 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function FileViewButton({ match }) {
  const [data, setData] = useState([]);
  const [isComponentVisible, setComponentVisibility] = useState(true);

  useEffect(() => {
    const folderId = match.params.folderId;
    const url = folderId ? `http://localhost:5000/api/files?folder_id=${folderId}` : 'http://localhost:5000/api/files';

    axios.get(url)
      .then(response => {
        setData(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching files and folders:', error);
      });
  }, [match.params.folderId]);

  if (!isComponentVisible) {
    return null; 
  }

  return (
    <div>
      <h2>File List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            {/* Add more headers as needed */}
          </tr>
        </thead>
        <tbody>
          {data.folders.map(folder => (
            <tr key={folder.folder_id}>
              <td>
                <Link to={`/files/${folder.folder_id}`}>
                  {folder.folder_name}
                </Link>
                <FileViewButton match={{ params: { folderId: folder.folder_id } }} />
              </td>
            </tr>
          ))}
          {data.files.map(file => (
            <tr key={file.file_id}>
              <td>
                {file.filename.endsWith('.jpg') ? (
                  <img src={jpgIcon} alt="JPG Icon" />
                ) : (
                  <span>{file.filename}</span>
                )}
              </td>
              {/* Add more columns as needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FileViewButton;
