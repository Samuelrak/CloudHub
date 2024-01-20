  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import CommentPublic from './Comment-public';
  import './public.css';
  import jpgImage from './photos/jpg.png';
  import pngImage from './photos/png.png';
  import zipImage from './photos/zip.png';
  import pdfImage from './photos/pdf.png';
  import docImage from './photos/doc.png';
  import docxImage from './photos/docx.png';
  import xlsImage from './photos/xls.png';
  import mp3Image from './photos/mp3.png';
  import mp4Image from './photos/mp4.png';
  import aviImage from './photos/avi.png';
  import movImage from './photos/mov.png';
  import gifImage from './photos/gif.png';
  import txtImage from './photos/txt.png';
  import apkImage from './photos/apk.png';
  import exeImage from './photos/exe.png';
  import htmlImage from './photos/html.png';
  import isoImage from './photos/iso.png';
  import jsonImage from './photos/json.png';
  import pptxImage from './photos/pptx.png';
  import rarImage from './photos/rar.png';
  import sqlImage from './photos/sql.png';
  import xmlImage from './photos/xml.png';



  const PublicFiles = () => {
    const [publicFiles, setPublicFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filesPerPage, setFilesPerPage] = useState(5);
    const [initialFilesCount, setInitialFilesCount] = useState(5);
    const [fileTypeFilter, setFileTypeFilter] = useState('all');
    const [searchResults, setSearchResults] = useState([]);
    const [sortBy, setSortBy] = useState('date')
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const [showFileBox, setShowFileBox] = useState(false);
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    useEffect(() => {
      fetchPublicFiles();
    }, [searchQuery]); 

    const fetchPublicFiles = (sort = 'date') => {
      const apiUrl = `http://localhost:5000/api/public-files?searchQuery=${searchQuery}&sort=${sort}`;
    
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
              description: fileArray[8]


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

    const handleSearchFiles = (query) => {
      setSearchQuery(query);
      fetch(`http://localhost:5000/api/search-public-files?query=${query}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {

            setSearchResults(data.data);
          } else {

            console.error('Error searching for files:', data.error);
          }
        })
        .catch((error) => {
          console.error('Error searching for files:', error);
        });
    };

    
    const handleDownloadClick = (fileId, fileName) => {
      if (!token || !username) {
        window.location.href = '/login';
        return;
      }
      fetch(`http://localhost:5000/api/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Username': selectedFile.username
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
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error('Error downloading the file:', error);
        });
    };

    function formatBytes(bytes) {
      if (bytes === 0) return '0.00 KB';
    
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
    
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    const fetchRecommendations = () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
    
      if (!token || !username) {
        console.error('Token or username not found in localStorage');
        return;
      }
    
      const apiUrl = 'http://localhost:5000/api/recommendations/';
    
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'username': username,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.user_id && data.recommendations) {
            console.log('Recommendations:', data.recommendations);
          } else {
            console.error('Error fetching recommendations:', data.error);
          }
        })
        .catch((error) => {
          console.error('Error fetching recommendations:', error);
        });
    };
    
    const handleLikeClick = () => {
      if (selectedFile) {
        handleLikeDislike('like', selectedFile.file_id);
      }
    };

    const handleDislikeClick = () => {
      if (selectedFile) {
        handleLikeDislike('dislike', selectedFile.file_id);
      }
    };

    const handleLikeDislike = (likeDislike, fileId) => {
      fetch(`http://localhost:5000/api/like-dislike/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Username': selectedFile.username,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          like_dislike: likeDislike,
        }),
      })
        .then((response) => {
          if (response.ok) {
            if (likeDislike === 'like') {
              setLikes(likes + 1);
            } else if (likeDislike === 'dislike') {
              setDislikes(dislikes + 1);
            }
          } else {
            console.error(`Failed to ${likeDislike} the file:`, response.statusText);
          }
        })
        .catch((error) => {
          console.error(`Error ${likeDislike} the file:`, error);
        });
    };

    const handleFileClick = (file, event) => {
      event.preventDefault();
      setSelectedFile(file);
      setShowFileBox(true);
    

      fetch(`http://localhost:5000/api/like-dislike-count/${file.file_id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('API Response:', data);
    
          if ('total_like_count' in data && 'total_dislike_count' in data) {
            console.log('Setting Likes:', data.total_like_count);
            setLikes(data.total_like_count);
            console.log('Setting Dislikes:', data.total_dislike_count);
            setDislikes(data.total_dislike_count);
          } else {
            console.error('Error fetching like and dislike counts. Data:', data);
          }
        })
        .catch((error) => {
          console.error('Error fetching like and dislike counts:', error);
        });
    };
    const handleSearch = (query) => {
      setSearchQuery(query);
      setSelectedFile(null);
    };

    const handleSortChange = (event) => {
      const newSortBy = event.target.value;
      setSortBy(newSortBy);
    
      if (newSortBy === 'size') {
        sortedFiles = sortedFiles.sort((a, b) => {
          return b.file_size - a.file_size;
        });
      } else if (newSortBy === 'date') {
        sortedFiles = sortedFiles.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
      } else if (newSortBy === 'Recommedation') { 
        fetchRecommendations();
      }
    }
    // const handleSortChange = (event) => {
    //   const newSortBy = event.target.value;
    //   setSortBy(newSortBy);
    
    //   if (newSortBy === 'size') {
    //       fetchPublicFiles('size');
    //   } else {
    //     fetchPublicFiles(newSortBy);
    //   }
    // };

    const handleSearchInputChange = (e) => {
      const query = e.target.value;
      handleSearch(query);
      handleSearchFiles(query);
    };

    const handleSearchButtonClick = () => {
      handleSearch(searchQuery); 
    };

    const handleFileTypeChange = (event) => {
      setFileTypeFilter(event.target.value);
    };

    
    const filteredFilesByType = fileTypeFilter === 'all'
      ? publicFiles
      : publicFiles.filter((file) => {
          const fileExtension = file.file_name.split('.').pop().toLowerCase();
          return fileTypeFilter === fileExtension;
        });

    let sortedFiles = [...filteredFilesByType]; 

    if (sortBy === 'date') {
      sortedFiles = sortedFiles.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else if (sortBy === 'size') {
      sortedFiles = sortedFiles.sort((a, b) => {
        return a.file_size - b.file_size;
      });
    }
    const filteredFiles = searchQuery.trim() === '' ? sortedFiles : sortedFiles.filter((file) =>
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastFile = currentPage * filesPerPage;
    const indexOfFirstFile = indexOfLastFile - filesPerPage;
    
    const currentFiles = initialFilesCount === 5
      ? sortedFiles.slice(0, initialFilesCount)
      : sortedFiles.slice(indexOfFirstFile, indexOfLastFile);

    const paginate = (pageNumber) => {
      setCurrentPage(pageNumber);
    };

    const loadMore = () => {
      setFilesPerPage(15); 
      setInitialFilesCount(initialFilesCount + 15); 
    };

    return (
      <div className='full'>
        <div className="public-files-container">
          <div className="filter-sort-bar">
            <div className="filter-bar">
              <label htmlFor="fileTypeFilter">Filter:</label>
              <select
                id="fileTypeFilter"
                value={fileTypeFilter}
                onChange={handleFileTypeChange}
                className="filter-select"
              >
    <option value="all">All</option>
    <option value="txt">Text Files (.txt)</option>
    <option value="jpg">JPG Images (.jpg)</option>
    <option value="png">PNG Images (.png)</option>
    <option value="zip">ZIP Archives (.zip)</option>
    <option value="pdf">PDF Files (.pdf)</option>
    <option value="doc">DOC Files (.doc)</option>
    <option value="docx">DOCX Files (.docx)</option>
    <option value="xls">XLS Files (.xls)</option>
    <option value="xlsx">XLSX Files (.xlsx)</option>
    <option value="mp3">MP3 Audio Files (.mp3)</option>
    <option value="mp4">MP4 Video Files (.mp4)</option>
    <option value="avi">AVI Video Files (.avi)</option>
    <option value="mov">MOV Video Files (.mov)</option>
    <option value="gif">GIF Images (.gif)</option>
              </select>
            </div>
            <div className="sort-bar">
    <label htmlFor="sortBy">Sort by:</label>
    <select
      id="sortBy"
      value={sortBy}
      onChange={handleSortChange}
      className="sort-select"
    >
      <option value="date">Last Uploaded</option>
      <option value="oldest">Oldest</option>
      <option value="size">File Size (Smallest to Largest)</option>
      <option value="sizeDesc">File Size (Largest to Smallest)</option>

    </select>
  </div>
          </div>
          {selectedFile ? (
        <div className="file-details-container">
          <div className="file-details">
          <button onClick={() => {
              setSelectedFile(null);
              setShowFileBox(false);
            }}>Back to all files</button>
            <h3>File Details:</h3>
            <p><strong>File Name:</strong> {selectedFile.file_name}</p>
            <p><strong>Created At:</strong> {selectedFile.created_at}</p>
            <p><strong>File Size:</strong> {formatBytes(selectedFile.file_size)}</p>
            <p><strong>description:</strong> {selectedFile.description}</p>
            <div >
            <p className='owner12' >Username:<Link className = "owner"to={`/user/${selectedFile.username}`}>{selectedFile.username}</Link></p> 
            </div>
            <div className='empty1'></div>
            <button onClick={handleLikeClick}>Like ({likes})</button>
            <button onClick={handleDislikeClick}>Dislike ({dislikes})</button>
            <button className='download-button' onClick={() => handleDownloadClick(selectedFile.file_id, selectedFile.file_name)}>Download</button>


            
          </div>
          <div className="file-box-container">
          <div className="file-box1">
  {selectedFile.file_name.toLowerCase().endsWith('.jpg') ? (
    <img src={jpgImage} alt="Image" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.png') ? (
    <img src={pngImage} alt="PNG" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.zip') ? (
    <img src={zipImage} alt="ZIP" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.pdf') ? (
    <img src={pdfImage} alt="PDF" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.doc') ? (
    <img src={docImage} alt="DOC" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.docx') ? (
    <img src={docxImage} alt="DOCX" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.xls') ? (
    <img src={xlsImage} alt="XLS" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.xlsx') ? (
    <img src={xlsImage} alt="XLSX" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.mp3') ? (
    <img src={mp3Image} alt="MP3" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.mp4') ? (
    <img src={mp4Image} alt="MP4" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.avi') ? (
    <img src={aviImage} alt="AVI" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.mov') ? (
    <img src={movImage} alt="MOV" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.gif') ? (
    <img src={gifImage} alt="GIF" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.txt') ? (
    <img src={txtImage} alt="TXT" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.apk') ? (
    <img src={apkImage} alt="APK" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.exe') ? (
    <img src={exeImage} alt="EXE" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.html') ? (
    <img src={htmlImage} alt="HTML" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.iso') ? (
    <img src={isoImage} alt="ISO" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.json') ? (
    <img src={jsonImage} alt="JSON" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.pptx') ? (
    <img src={pptxImage} alt="PPTX" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.rar') ? (
    <img src={rarImage} alt="RAR" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.sql') ? (
    <img src={sqlImage} alt="SQL" />
  ) : selectedFile.file_name.toLowerCase().endsWith('.xml') ? (
    <img src={xmlImage} alt="XML" />
  ) : (
    <img src={jpgImage} alt="Placeholder" />
  )}
</div>

        
          <div className="file-box-comments">
          <div className="file-comments">
            <CommentPublic file_id={selectedFile.file_id} />
          </div>
          </div>
          </div>
        </div>
        ) : (
          <>
      <div className="search-bar">
          <input
            type="text"
            placeholder="Search for a file"
            value={searchQuery}
            onChange={(e) => handleSearchFiles(e.target.value)}
            list="suggestions" 
          />
          <datalist id="suggestions">
            {searchResults.map((searchResult, index) => (
              <option key={index} value={searchResult} />
            ))}
          </datalist>
      
            </div>
        
            <div className="files-container">
              {currentFiles.map((file) => (
                <div key={file.file_id} className="file-item" onClick={(event) => handleFileClick(file, event)}>
                  <div className="file-box">
                
                  {file.file_name.toLowerCase().endsWith('.jpg') ? (
                  <img src={jpgImage} alt="Image" />
                ) : file.file_name.toLowerCase().endsWith('.png') ? (
                  <img src={pngImage} alt="PNG" />
                ) : file.file_name.toLowerCase().endsWith('.zip') ? (
                  <img src={zipImage} alt="ZIP" />
                ) : file.file_name.toLowerCase().endsWith('.pdf') ? (
                  <img src={pdfImage} alt="PDF" />
                ) : file.file_name.toLowerCase().endsWith('.doc') ? (
                  <img src={docImage} alt="DOC" />
                ) : file.file_name.toLowerCase().endsWith('.docx') ? (
                  <img src={docxImage} alt="DOCX" />
                ) : file.file_name.toLowerCase().endsWith('.xls') ? (
                  <img src={xlsImage} alt="XLS" />
                ) : file.file_name.toLowerCase().endsWith('.mp3') ? (
                  <img src={mp3Image} alt="MP3" />
                ) : file.file_name.toLowerCase().endsWith('.mp4') ? (
                  <img src={mp4Image} alt="MP4" />
                ) : file.file_name.toLowerCase().endsWith('.avi') ? (
                  <img src={aviImage} alt="AVI" />
                ) : file.file_name.toLowerCase().endsWith('.mov') ? (
                  <img src={movImage} alt="MOV" />
                ) : file.file_name.toLowerCase().endsWith('.gif') ? (
                  <img src={gifImage} alt="GIF" />
                ) : file.file_name.toLowerCase().endsWith('.txt') ? (
                  <img src={txtImage} alt="TXT" />
                ) : file.file_name.toLowerCase().endsWith('.apk') ? (
                  <img src={apkImage} alt="APK" />
                ) : file.file_name.toLowerCase().endsWith('.exe') ? (
                  <img src={exeImage} alt="EXE" />
                ) : file.file_name.toLowerCase().endsWith('.html') ? (
                  <img src={htmlImage} alt="HTML" />
                ) : file.file_name.toLowerCase().endsWith('.iso') ? (
                  <img src={isoImage} alt="ISO" />
                ) : file.file_name.toLowerCase().endsWith('.json') ? (
                  <img src={jsonImage} alt="JSON" />
                ) : file.file_name.toLowerCase().endsWith('.pptx') ? (
                  <img src={pptxImage} alt="PPTX" />
                ) : file.file_name.toLowerCase().endsWith('.rar') ? (
                  <img src={rarImage} alt="RAR" />
                ) : file.file_name.toLowerCase().endsWith('.sql') ? (
                  <img src={sqlImage} alt="SQL" />
                ) : file.file_name.toLowerCase().endsWith('.xml') ? (
                  <img src={xmlImage} alt="XML" />
                ) : (
                  <img src={jpgImage} alt="Placeholder" />
                )}
              </div>
                  <div className="file-name" title={file.file_name}>{file.file_name}</div>
                </div>
              ))}
            </div>
            <div className="see-more">
              {initialFilesCount < filteredFiles.length ? (
                <button className="see-more-button" onClick={loadMore}>See More</button>
              ) : (
                <div className="pagination">
                  {Array.from({ length: Math.ceil(filteredFiles.length / filesPerPage) }).map((_, index) => (
                    <button
                      key={index}
                      className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
    );
  };

  export default PublicFiles;
