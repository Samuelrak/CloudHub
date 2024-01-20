import React from 'react';
import './LoadingIndicator.css'

function LoadingIndicator() {
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="loader"></div>
        <div >
          <h1 className='loading-font'>Loading...</h1>
          </div>
      </div>
    </div>
  );
}

export default LoadingIndicator;
