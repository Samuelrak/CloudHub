import React from 'react';

function LoadingIndicator() {
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: 'white' }}>Loading...</div>
    </div>
  );
}

export default LoadingIndicator;
