import React, { useState, useEffect, useRef } from 'react';
import './FileExplorer.css';
import Comment from './Comment';

const FolderUpload = () => {
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

    formData.append('folderName', selectedFolderName);

    fetch(`http://localhost:5000/api/folderId?folderName=${selectedFolderName}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          formData.append('folderId', data.data.folderId);
          setCurrentFolderId(data.data.folderId);
          folderHistoryRef.current = [...folderHistory, data.data.folderId];
        } else {
          console.error('Error getting folder ID:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error getting folder ID:', error);
      });
  };



  const handleMakePrivate = (fileId) => {
    fetch(`http://localhost:5000/api/make-private/${fileId}`, {
      method: 'POST',
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

  const fetchFilesAndFolders = (folderId = null) => {
    const url = folderId
      ? `http://localhost:5000/api/files?folder_id=${folderId}`
      : 'http://localhost:5000/api/files';
  
    fetch(url)
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

  const handleBackButtonClick = () => {
    if (showFileDetails) {
      setShowFileDetails(false);
      setShowFolders(true);
    } else if (folderHistory.length > 1) {
      folderHistory.pop();
      const previousFolderId = folderHistory[folderHistory.length - 1];
      setCurrentFolderId(previousFolderId);
      fetchFilesAndFolders(previousFolderId);
    } else {
      setCurrentFolderId(null);
      setSelectedFolderName(null);
      setSelectedFileDetails(null);
      fetchFilesAndFolders();
    }
  };

  const handleFolderClick = (folderId, folderName) => {
    setCurrentFolderId(folderId);
    setSelectedFolderName(folderName);
    setSelectedFileDetails(null);
    fetchFilesAndFolders(folderId);
    setShowFolders(true);
    setShowFileDetails(false);
  
    if (!folderHistory.includes(folderId)) {
      folderHistory.push(folderId);
    }
  };

  function formatBytes(bytes) {
    if (bytes === 0) return '0.00 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  const handleFileClick = (fileId) => {
    fetch(`http://localhost:5000/api/fileDetails?fileId=${fileId}`)
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

  useEffect(() => {
    fetchFilesAndFolders();
  }, []);
  
  useEffect(() => {
    if (selectedFileDetails) {
      const status = {};
      selectedFileDetails.forEach((file) => {
        status[file.file_id] = file.is_public;
      });
      setFilePublicStatus(status);
    }
  }, [selectedFileDetails]);

  return (
    <div>
      <div>
        <button onClick={handleBackButtonClick}>Back</button>
      </div>
      <div>
        {showFileDetails && selectedFileDetails ? (
          <div>
            <table className="filetable">
              <tbody>
                <tr>
                  <th className="th">File Name</th>
                  <th className="th">File Size</th>
                  <th className="th">Public</th>
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
        <Comment file_id={selectedFileDetails[0]} />
                  </td>
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
                </tr>
              </thead>
              <tbody>
              {filesInFolder.map((file) => (
    <tr
      key={file.file_id}
      onClick={() => handleFileClick(file.file_id)}
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
      </td>
    </tr>
  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  );
              }  

export default FolderUpload;