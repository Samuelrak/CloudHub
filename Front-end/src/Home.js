import React, { useState } from 'react';
import Header from './header';
import PublicFiles from './public';
import SearchBar from './SearchBar';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState([]); 

  const handleSearch = (searchTerm) => {
    const filteredFiles = files.filter(file =>
      file.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    if (searchTerm !== searchTerm) {
      setFiles(filteredFiles);
    }
  };

  return (
    <>
      <Header />
        <h2>Welcome to Our Website</h2>
        <p>
          This is the home page of our website. You can add any content or components that you want to display here.
        </p>
        <p>
          For example, you might want to showcase some features, provide a brief introduction, or display a call to action.
       </p>
      <PublicFiles files={searchTerm ? files : []} />
    </>
  );
}

export default Home;

