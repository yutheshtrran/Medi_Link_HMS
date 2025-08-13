// Components/Loader.jsx
import React from 'react';
import '../Loader.css'; // Ensure you have the correct path to your CSS file

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div className="logo-container"> {/* New container for logo elements */}
        <h1 className="medi-link-text">
          Medi-Link
          <span className="logo-arrows">↗↗</span> {/* Simplified arrow placement */}
        </h1>
        <p className="subscript-text">CARE REDEFINED</p>
      </div>
    </div>
  );
};

export default Loader;