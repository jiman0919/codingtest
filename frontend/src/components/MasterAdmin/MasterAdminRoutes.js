// src/components/MasterAdmin/MasterAdminRoutes.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// MasterAdmin 컴포넌트들을 불러옵니다.
import Manage from './Manage';
import ManageProfessor from './ManageProfessor';

const MasterAdminRoutes = () => {
  // 이제 권한 체크 로직이 없습니다.
  
  return (
    <Routes>
      {/* MasterAdmin 메인 페이지: 유저 목록과 관리자 계정 관리 */}
      <Route path="/" element={<Manage />} />
      
      {/* MasterAdmin 교수 관리 페이지 */}
      <Route path="/professor" element={<ManageProfessor />} />
    </Routes>
  );
};

export default MasterAdminRoutes;