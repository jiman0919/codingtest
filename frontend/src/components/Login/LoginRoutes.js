// src/components/Login/LoginRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginIn from './LoginIn';
import LoginAdd from './LoginAdd';
import LoginEdit from './LoginEdit';
import './LoginStyle.css';

function LoginRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginIn />} />
      <Route path="/new" element={<LoginAdd />} />
      <Route path="change-password" element={<LoginEdit />} />
    </Routes>
  );
}

export default LoginRoutes;