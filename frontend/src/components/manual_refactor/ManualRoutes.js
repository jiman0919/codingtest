import React from 'react';
import { Routes, Route,Navigate} from 'react-router-dom';

import CommonManual from "./manual/CommonManual";
import StudentManual from './manual/StudentManual';
import ProfessorManual from './manual/ProfessorManual';
import AdminManual from './manual/AdminManual';

const ManualRoutes = () => {
    return (
      <Routes>
        <Route path="/manual/register_manual" element={<Navigate to="/common_manual/register" replace />} />

        {/* 로그인 매뉴얼o */}
        <Route path="/common_manual" element={<CommonManual />} />
        <Route path="/common_manual/:slug" element={<CommonManual />} />

        {/* 학생 매뉴얼o */}
        <Route path="/student_manual" element={<StudentManual />} />
        <Route path="/student_manual/:slug" element={<StudentManual />} />

        {/* 교수 매뉴얼o */}
        <Route path="/professor_manual" element={<ProfessorManual />} />
        <Route path="/professor_manual/:slug" element={<ProfessorManual />} />
        
        {/* 관리자 매뉴얼o */}
        <Route path="/admin_manual" element={<AdminManual />} />
        <Route path="/admin_manual/:slug" element={<AdminManual />} />

      </Routes>
  );
};

export default ManualRoutes;