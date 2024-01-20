import React, { useState } from 'react';
import Header from './header';
import './about.css'; 
import FileUpload from './FileUpload';
import FolderUpload from './FolderUpload'; 
import FileViewButton from './FileViewButton';
import FileExplorer from './FileExplorer';
import Footer from './Footer';

function Home() {



  // const handleDescriptionChange = (value) => {
  //   setDescription(value);
  // };

  // const handlePublishChange = (value) => {
  //   setPublish(value);
  // };

  

  return (
    <div>
      <Header /> 
      


<FileExplorer
  // isMaxStorageReached={isMaxStorageReached}
  // uploadSuccess={uploadSuccess}
  // virusDetected={virusDetected}
  // setDescription={handleDescriptionChange}
  // setPublish={handlePublishChange}
  // description={description} 
  // publish={publish} 
  // updateFileExplorer={updateFileExplorer}
  // setCurrentFolderId1={setCurrentFolderId1} 

/>
    </div>

  );
}

export default Home;
