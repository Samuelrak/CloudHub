import React, { useState } from 'react';
import Header from './header';
import PublicFiles from './public';
import SearchBar from './SearchBar';
import Carrousel from './Carrousel';
import Footer from './Footer';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState([]); 



  return (
    <>
      <Header />
      <Carrousel />
      <PublicFiles files={searchTerm ? files : []} />
      <Footer />
    </>
  );
}

export default Home;

