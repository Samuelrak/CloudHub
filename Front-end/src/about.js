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
<<<<<<< HEAD
{/* <FileViewButton /> */}
<FileExplorer />
=======
<FileViewButton />
>>>>>>> 3546cf8f1c90c75ffa6d0ee4f8baacbf45e4d0b6
    </div>
  );
}

export default Home;