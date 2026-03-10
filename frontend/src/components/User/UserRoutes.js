// src/routes/UserRoutes.js

import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import UserClass from './UserClass';
import UserProblem from './UserProblem';
import UserTest from './UserTest';
import ProblemView from './ProblemView';

const UserRoutes = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            console.log("No access token found for user, redirecting to login.");
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/classes" element={<UserClass />} />
            <Route path="/classes/:classId/problems" element={<UserProblem />} />
            
            {/* UserTest를 부모 라우트로, ProblemView를 자식 라우트로 배치 */}
            <Route path="/classes/:classId/problems" element={<UserTest />}>
                <Route path=":problemId" element={<ProblemView />} />
            </Route>
        </Routes>
    );
};

export default UserRoutes;