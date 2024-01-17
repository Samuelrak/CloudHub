import React, { useState, useEffect, useRef } from 'react';
import './FileExplorer.css';
import CommentPrivate from './Comment-private';
import FileUpload from './FileUpload';
import FolderUpload from './FolderUpload';

const FileExplorer = () => {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [filesInFolder, setFilesInFolder] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedFileDetails, setSelectedFileDetails] = useState(null);
  const [showFolders, setShowFolders] = useState(true);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [publicFiles, setPublicFiles] = useState({}); 
  const [isFilePublic, setIsFilePublic] = useState(true);
  const [filePublicStatus, setFilePublicStatus] = useState({});
  const [currentFileIsPublic, setCurrentFileIsPublic] = useState(true);
  const [totalStorageMB, setTotalStorageMB] = useState(0);
  const [totalStorageMBBar, setTotalStorageMBBar] = useState(0);
  const [usedStorageMB, setUsedStorageMB] = useState(0);
  const storedToken = localStorage.getItem('token');
  const [token, setToken] = useState(storedToken || ''); 
  const [userTier, setUserTier] = useState('');
  const [userFiles, setUserFiles] = useState([]);
  const [username, setUsername] = useState(''); 
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMaxStorageReached, setIsMaxStorageReached] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [virusDetected, setVirusDetected] = useState(false);
  const [description, setDescription] = useState(''); 
  const [publish, setPublish] = useState(false);

  

  const tierToStorageLimit = {
    free: 100,
    basic: 250,
    pro: 500,
    premium: 1000,
  };

  const tierToStorageLimitBar = {
    free: 100_000_000,
    basic: 250_000_000,
    pro: 500_000_000,
    premium: 1000_000_000,
  };

  localStorage.getItem('token', token)
  const folderHistoryRef = useRef([]);
  const folderHistory = folderHistoryRef.current;
  

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

  const toggleFilePublic = (fileId) => {
    setPublicFiles((prevPublicFiles) => ({
      ...prevPublicFiles,
      [fileId]: !prevPublicFiles[fileId],
    }));
  };

  const fetchStorageInfo = () => {
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
        const fetchedUsername = data.username; 
  
        setUserTier(fetchedUserTier);
        setUsername(fetchedUsername);

        const totalStorage = tierToStorageLimit[fetchedUserTier] || 0;
        const totalStorageBar = tierToStorageLimitBar[fetchedUserTier] || 0;
        const usedStorage = data.files.reduce((total, file) => total + file.file_size, 0);
  
        setTotalStorageMB(totalStorage);
        setTotalStorageMBBar(totalStorageBar)
        setUsedStorageMB(usedStorage);
        setUserFiles(data.files); 
      })
      .catch((error) => {
        console.error('Error fetching user storage info:', error);
      });
  };



  const handleMakePrivate = (fileId) => {
    fetch(`http://localhost:5000/api/make-private/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('File is now private');
          

          setFilePublicStatus((prevStatus) => ({
            ...prevStatus,
            [fileId]: false,
          }));
        } else {
          console.error('Failed to make the file private:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error making the file private:', error);
      });
  };
  
  const handleMakePublic = (fileId) => {
    fetch(`http://localhost:5000/api/make-public/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('File is now public');

          setFilePublicStatus((prevStatus) => ({
            ...prevStatus,
            [fileId]: true,
          }));
        } else {
          console.error('Failed to make the file public:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error making the file public:', error);
      });
  };

  const handleCreateFolder = () => {
    if (!newFolderName) {
      alert('Please enter a folder name.');
      return;
    }
  
    fetch(`http://localhost:5000/api/create-folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderName: newFolderName,  parentFolderId: currentFolderId  }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Folder created successfully');
          setNewFolderName('');
          fetchFilesAndFolders(currentFolderId, token);
        } else {
          console.error('Error creating folder:', data.error);
  
        }
      })
      .catch((error) => {
        console.error('Error creating folder:', error);

      });
  };

  const fetchFilesAndFolders = (folderId, token) => {
    const url = folderId
      ? `http://localhost:5000/api/files?folder_id=${folderId}`
      : 'http://localhost:5000/api/files';
    console.log('token:', token);
    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setFilesInFolder(data.data.files);
          setFolders(data.data.folders);
  
          const publicStatus = {};
          data.data.files.forEach((file) => {
            publicStatus[file.file_id] = file.is_public;
          });
          
          setFilePublicStatus(publicStatus);
        } else {
          console.error('Error fetching files and folders:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error fetching files and folders:', error);
      });
  };

  const updateFilePublicStatus = (files) => {
    const status = {};
    files.forEach((file) => {
      status[file.file_id] = file.is_public;
    });
    setFilePublicStatus(status);
  };
  const handleBackButtonClick = () => {
    if (showFileDetails) {
      updateFilePublicStatus(filesInFolder);
      
      setShowFileDetails(false);
      setShowFolders(true);
    } else if (folderHistory.length > 1) {
      folderHistory.pop();
      const previousFolderId = folderHistory[folderHistory.length - 1];
      setCurrentFolderId(previousFolderId);
      folderHistoryRef.current = folderHistory.slice(); 
  
      fetchFilesAndFolders(previousFolderId, token);
    } else {
      setCurrentFolderId(null);
      setSelectedFolderName(null);
      setSelectedFileDetails(null);
      folderHistoryRef.current = [];
  
      fetchFilesAndFolders(null, token);
    }
  };

  const updateFileExplorer = () => {
    fetchFilesAndFolders(currentFolderId, token);
  };

  const handleFolderClick = (folderId, folderName) => {
    setCurrentFolderId(folderId);
    setCurrentFolderId(folderId);
    setSelectedFolderName(folderName);
    setSelectedFileDetails(null);
    fetchFilesAndFolders(folderId, token);
    setShowFolders(true);
    setShowFileDetails(false);
    
  
    if (!folderHistory.includes(folderId)) {
      folderHistory.push(folderId);
    }
  };

  const handleFolderSelection = (folderId) => {
    setCurrentFolderId(folderId);
  };

  function formatBytes(bytes) {
    if (bytes === 0) return '0.00 KB';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
  
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  const handleFileClick = (fileId, username) => {
    console.log(username);
    fetch(`http://localhost:5000/api/fileDetails?fileId=${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'username': username, 
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSelectedFileDetails(data.data);
  
          const isFilePublic = data.data.is_public === 1;
          setCurrentFileIsPublic(isFilePublic);
  
          setShowFolders(false);
          setShowFileDetails(true);
        } else {
          console.error('Error fetching file details:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error fetching file details:', error);
      });
  };

  const handleDownloadClick = (fileId) => {
    fetch(`http://localhost:5000/api/download/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Username': `Username ${selectedFileDetails[4]}`
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          console.error('Failed to download the file:', response.statusText);
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = selectedFileDetails[1]; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error downloading the file:', error);
      });
  };

  const handleRemoveFile = (fileId, event) => {
    event.preventDefault();
    event.stopPropagation();
  
    if (window.confirm("Are you sure you want to remove this file?")) {
      fetch(`http://localhost:5000/api/remove-file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
    
            console.log('File removed successfully');

            fetchFilesAndFolders(currentFolderId, token);
          } else {
            console.error('Failed to remove the file:', data.error);
          }
        })
        .catch((error) => {
          console.error('Error removing the file:', error);
        });
    }
  };

   const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    

    setSelectedFiles(files);

    if (files.length > 0) {
      const folderPath = files[0].webkitRelativePath;
      const folderNames = folderPath.split('/');
      const folderName = folderNames[folderNames.length - 2];
      setSelectedFolderName(folderName);
    }
  };

  const handleDescriptionChange = (event) => {
    const value = event.target.value;
    setDescription(value);
  };
  
  const handlePublishChange = (event) => {
    const value = event.target.checked;
    setPublish(value);
  };

  const updateStorageInfo = () => {
    fetchStorageInfo();
  };

  useEffect(() => {
    fetchStorageInfo();
    fetchFilesAndFolders(null, token);
  }, []);
  
  useEffect(() => {
    if (uploadSuccess) {
      fetchStorageInfo(); // Only call fetchStorageInfo when uploadSuccess is true
    }
  }, [uploadSuccess]);
  
  useEffect(() => {
    if (selectedFileDetails) {
      const status = {};
      (Array.isArray(selectedFileDetails) ? selectedFileDetails : []).forEach((file) => {
        if (file && file.file_id) {
          status[file.file_id] = file.is_public;
        }
      });
      setFilePublicStatus(status);
    }
  }, [selectedFileDetails]);

  return (
   
    <div className='upload-info'>
            <div className='upload-info1'>
       <FileUpload
        setIsMaxStorageReached={setIsMaxStorageReached}
        setUploadSuccess={setUploadSuccess} 
        setVirusDetected={setVirusDetected} 
        description={description} 
        publish={publish} 
        updateFileExplorer={updateFileExplorer}
        currentFolderId={currentFolderId} 

      />

        <FolderUpload
        setIsMaxStorageReached={setIsMaxStorageReached}
        setUploadSuccess={setUploadSuccess}
        setVirusDetected={setVirusDetected}
        description={description} 
        publish={publish} 
        updateFileExplorer={updateFileExplorer}
        currentFolderId={currentFolderId} 

      />

 

      {isMaxStorageReached && (
        <div>
          <p>You have reached the maximum storage limit.</p>
        </div>
      )}

      {virusDetected && (
        <div>
          <p>Virus spotted</p>
        </div>
      )}

{uploadSuccess && (
  <div>
    <p>Successful Uploaded</p>
    {fetchStorageInfo()}
  </div>
)}
<div>
  <label>
    Description:
    <input type="text" value={description} onChange={handleDescriptionChange} />
  </label>
</div>
<div>
  <label>
    Publish:
    <input type="checkbox" checked={publish} onChange={handlePublishChange} />
  </label>
</div>
<div>
  <input
    type="text"
    placeholder="New Folder Name"
    value={newFolderName}
    onChange={(e) => setNewFolderName(e.target.value)}
  />
  <button onClick={handleCreateFolder}>Create Folder</button>
</div>

</div>
<div className='storage count'>
<div className="storage-bar">
        <div className="storage-used" style={{ width: `${(usedStorageMB / totalStorageMBBar) * 100}%` }}>
        </div>
      </div>

{totalStorageMB} MB Used
</div>

<div className='used'>
<p>Used: </p>
{formatBytes(usedStorageMB)}
</div>
<div className='total'>
<p>Total: </p>
{totalStorageMB} MB Used
</div>
        <>
          {currentFolderId !== null && (
            <div>
              <button onClick={handleBackButtonClick}>Back</button>
            </div>
        
                      )}  
          <div className='storage' onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {showFileDetails && selectedFileDetails ? (
              <div>
                <table className="filetable">
                  <tbody>
                    <tr>
                      <th className="th">File Name</th>
                      <th className="th">File Size</th>
                      <th className="th">Public</th>
                      <th className="th">Download</th>
                      <th className="th">User</th>
                    </tr>
                    <tr>
                      <td className="td">{selectedFileDetails[1]}</td>
                      <td className="td">{formatBytes(selectedFileDetails[3])}</td>
                      <td className="td">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            const fileId = selectedFileDetails[0];
                            const isPublic = filePublicStatus[fileId];
                            if (isPublic) {
                              handleMakePrivate(fileId);
                            } else {
                              handleMakePublic(fileId);
                            }
                            setFilePublicStatus((prevStatus) => ({
                              ...prevStatus,
                              [fileId]: !isPublic,
                            }));
                          }}
                          className={filePublicStatus[selectedFileDetails[0]] ? 'private-button' : 'public-button'}
                        >
                          {filePublicStatus[selectedFileDetails[0]] ? 'Make Private' : 'Make Public'}
                        </button>
                        <CommentPrivate file_id={selectedFileDetails[0]} />
                      </td>
                      <td className="td">
                        <button onClick={() => handleDownloadClick(selectedFileDetails[0])}>
                          Download
                        </button>
                      </td>
                      <td className="td">{selectedFileDetails[4]}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <table className="table">
                  <thead>
                    <tr>
                      <th className="th">File Name</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filesInFolder.map((file) => (
                      <tr
                        key={file.file_id}
                        onClick={() => handleFileClick(file.file_id, username)}
                        className="trHover"
                      >
                        <td className="td">{file.file_name}</td>
                          <td className="td">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                const isPublic = filePublicStatus[file.file_id];
                                if (isPublic) {
                                  handleMakePrivate(file.file_id);
                                } else {
                                  handleMakePublic(file.file_id);
                                }
                              }}
                              className={filePublicStatus[file.file_id] ? 'private-button' : 'public-button'}
                            >
                              {filePublicStatus[file.file_id] ? 'Make Private' : 'Make Public'}
                            </button>
                            <button
                            className='remove-button'
                            onClick={(event) => handleRemoveFile(file.file_id, event)}
                          >
                            Remove
                          </button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
          {showFolders && (
            <div>
              <table className="table">
                <thead>
                  <tr></tr>
                </thead>
                <tbody>
                  {folders.map((folder) => (
                    <tr
                      key={folder.folder_id}
                      onClick={() => handleFolderClick(folder.folder_id, folder.folder_name)}
                      className="trHover"
                    >
                      <td className="td">{folder.folder_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </>
    </div>
  );
};

export default FileExplorer;
