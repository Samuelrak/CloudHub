import React from 'react';
import Header from './header';
import './about.css'; 
import FileUpload from './FileUpload';
import FolderUpload from './FolderUpload'; 
import FileViewButton from './FileViewButton';
import FileExplorer from './FileExplorer';

function Home() {
  return (
    <div>
      <Header /> 
<FileUpload />
<FolderUpload />
{/* <FileViewButton /> */}
<FileExplorer />
    </div>
  );
}

export default Home;