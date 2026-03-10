import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminRoutes from './components/admin/AdminRoutes';
import UserRoutes from './components/User/UserRoutes';
import LoginRoutes from './components/Login/LoginRoutes';
import MasterRoutes from './components/MasterAdmin/MasterAdminRoutes';
import Manual from './components/manual_refactor/ManualRoutes';

import SplashScreen from './components/SplashScreen/SplashScreen';

import Help from './components/Help/Help'; 

import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); 
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login/*" element={<LoginRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/master/*" element={<MasterRoutes />} />
          <Route path="/manual/*" element={<Manual />} />
        </Routes>
        <Help />
      </div>
    </BrowserRouter>
  );
}

export default App;