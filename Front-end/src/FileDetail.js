import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './header';
import axios from 'axios';
import { RingLoader } from 'react-spinners';

function FileDetail() {
  const { file_id } = useParams();
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/files/${file_id}`);
        const fetchedFileDetails = response.data.file_details;
        setFileDetails(fetchedFileDetails);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching file details:', error);
        setLoading(false);
      }
    };

    fetchFileDetails();
  }, [file_id]);

  return (
    <div>
      <Header />
      <h2>File Detail</h2>
      {loading ? (
        <div className="spinner-container">
          <RingLoader color="#36D7B7" loading={loading} size={150} />
        </div>
      ) : (
        <>
          <p>File ID: {fileDetails?.file_id}</p>
          <p>Filename: {fileDetails?.filename}</p>
          <p>User ID: {fileDetails?.user_id}</p>
        </>
      )}
    </div>
  );
}

export default FileDetail;