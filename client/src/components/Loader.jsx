/**
 * @fileoverview Loading spinner component
 * @module components/Loader
 */

import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p className="loader-text">Loading...</p>
    </div>
  );
};

export default Loader;

