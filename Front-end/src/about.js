import React from 'react';
import Header from './header';
import './about.css'; 
import FileUpload from './FileUpload';
import FolderUpload from './FolderUpload'; 
import FileViewButton from './FileViewButton';

function Home() {
  return (
    <div>
      <Header /> 
<FileUpload />
<FolderUpload />
<FileViewButton />
    </div>
  );
}

export default Home;