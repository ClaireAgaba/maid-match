import React from 'react';
import logo from '../assets/logo.png';

// sizeClass controls the image height via Tailwind classes, e.g. "h-8", "h-10", "h-12"
const BrandLogo = ({ className = '', showText = false, sizeClass = 'h-8' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logo} alt="MaidMatch" className={`${sizeClass} w-auto`} />
      {showText && (
        <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">MaidMatch</span>
      )}
    </div>
  );
};

export default BrandLogo;
