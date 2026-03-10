import React from 'react';
import './SplashScreen.css';
import platformLogo from './AI정보보안학과_로고.png'; 

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <img src={platformLogo} alt="플랫폼 로고" className="splash-logo" />
    </div>
  );
};

export default SplashScreen;