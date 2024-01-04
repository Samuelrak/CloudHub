import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FolderView({ folder }) {
  const [folderContents, setFolderContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolderContents = async () => {
      try {
        console.log('Folder value:', folder); 
        const response = await axios.get(`http://localhost:5000/api/files/`);
        setFolderContents(response.data.files);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching folder contents:', error);
        setLoading(false);
      }
    };
  
    fetchFolderContents();
  }, [folder]);

  return (
    <div>
      <h2>Folder Contents: {folder}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {folderContents.map(item => (
            <li key={item.id}>
              {item.is_folder ? (
       
                <div>
                  <span>{item.filename} (Folder)</span>
                  <button>View Folder</button>
                </div>
              ) : (
                <span>{item.filename} (File)</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FolderView;
