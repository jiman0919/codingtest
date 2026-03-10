import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

// 관리자 페이지 컴포넌트들 임포트
import ClassList from './Class/ClassList';
import ClassAdd from './Class/ClassAdd';
import ClassEdit from './Class/ClassEdit';

import ProblemList from './Problem/ProblemList';
import ProblemDetail from './Problem/ProblemDetail';
import ProblemAdd from './Problem/ProblemAdd';
import ProblemEdit from './Problem/ProblemEdit';

import UserList from './User/UserList';

import SubmitUser from './Submit/SubmitUser';
import SubmitProblem from './Submit/SubmitProblem';
import SubmitDetail from './Submit/SubmitDetail';

import BankList from './Bank/BankList';
import BankDetail from './Bank/BankDetail';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AdminLayout />}>
                {/* `/admin`으로 접속 시 `/admin/classes`로 이동 */}
                <Route index element={<Navigate to="classes" replace />} />

                {/* ✅ 강좌 관리 - 중첩 라우트 구조 시작 */}
                <Route path="classes" element={<ClassList />} />
                <Route path="classes/add" element={<ClassAdd />} />
                {/* ✨ 이 부분을 수정합니다. :id -> :classId */}
                <Route path="classes/edit/:classId" element={<ClassEdit />} />

                {/* ✅ 강좌에 종속되는 모든 서브 메뉴 라우트 */}
                <Route path="classes/:classId" element={<Navigate to="problems" replace />} />

                {/* ✅ 문제 관리 중첩 라우트: /admin/classes/:classId/problems/* */}
                <Route path="classes/:classId/problems" element={<ProblemList />} />
                <Route path="classes/:classId/problems/add" element={<ProblemAdd />} />
                <Route path="classes/:classId/problems/detail/:problemId" element={<ProblemDetail />} />
                <Route path="classes/:classId/problems/edit/:problemId" element={<ProblemEdit />} />

                {/* ✅ 유저 관리 중첩 라우트: /admin/classes/:classId/users/* */}
                <Route path="classes/:classId/users" element={<UserList />} />

                {/* ✅ 제출 관리 중첩 라우트: /admin/classes/:classId/submits/* */}
                <Route path="classes/:classId/submits" element={<SubmitUser />} />
                <Route path="classes/:classId/submits/:userId" element={<SubmitProblem />} />
                <Route path="classes/:classId/submits/:userId/:problemId" element={<SubmitDetail />} />

                {/* ✨ 2. 문제 은행 관리 라우트 추가 */}
                <Route path="classes/:classId/bank" element={<BankList />} />
                <Route path="classes/:classId/bank/detail/:problemId" element={<BankDetail />} />

                {/* 정의되지 않은 `/admin/xxx` 경로 처리 */}
                <Route path="*" element={<Navigate to="classes" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;