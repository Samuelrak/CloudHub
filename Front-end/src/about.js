import React from 'react';
import Header from './header';
import './about.css'; 
import FileUpload from './FileUpload';
import FileViewButton from './FileViewButton';

function Home() {
  return (
    <div>
      <Header /> 
<FileUpload />
<FileViewButton />
    </div>
  );
}

export default Home;