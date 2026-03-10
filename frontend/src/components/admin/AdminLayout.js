import React, { useEffect } from 'react';
import Header from './Header/Header';
import AdminSidebar from './AdminSidebar/AdminSidebar';
import { Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const location = useLocation();
    const { classId } = useParams();
    const navigate = useNavigate(); // ? useNavigate 훅 사용

    // ? 토큰 유효성 검사 useEffect 훅 추가
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        
        // access_token이 없으면 로그인 페이지로 리디렉션
        if (!accessToken) {
            console.log("No access token found, redirecting to login.");
            navigate('/login', { replace: true });
        }
    }, [navigate]); // navigate가 변경될 때만 실행 (최초 한 번 실행)

    const currentClassId = classId;

    useEffect(() => {
        console.log('--- AdminLayout Rerender ---');
        console.log('Current Pathname:', location.pathname);
        console.log('AdminLayout ClassId (from useParams):', classId);
        console.log('Effective currentClassId (passed to Sidebar):', currentClassId);

        const isProblemRelatedRoute = location.pathname.startsWith(`/admin/classes/${currentClassId}/problems`);
        const isUserRelatedRoute = location.pathname.startsWith(`/admin/classes/${currentClassId}/users`);
        const isSubmitRelatedRoute = location.pathname.startsWith(`/admin/classes/${currentClassId}/submits`);
        const isBankRelatedRoute = location.pathname.startsWith(`/admin/classes/${currentClassId}/bank`);
        const isClassList = location.pathname === '/admin/classes';

        console.log('isProblemRelatedRoute:', isProblemRelatedRoute);
        console.log('isUserRelatedRoute:', isUserRelatedRoute);
        console.log('isSubmitRelatedRoute:', isSubmitRelatedRoute);
        console.log('isBankRelatedRoute:', isBankRelatedRoute);
        console.log('isClassList:', isClassList);

        const calculatedShowMenus = (
            // ? [수정] 계산 로직에도 isBankRelatedRoute를 추가합니다.
            (!!currentClassId && (isProblemRelatedRoute || isUserRelatedRoute || isSubmitRelatedRoute || isBankRelatedRoute))
        ) && !isClassList;

        console.log('Calculated shouldShowMenus (final):', calculatedShowMenus);
    }, [location.pathname, classId, currentClassId]);

    // ? [수정] '문제 은행' 경로 확인 로직을 다른 메뉴들과 통합하여 아래와 같이 수정합니다.
    // 이전 isBankRoute 변수는 삭제합니다.
    const shouldShowMenus =
        (
            !!currentClassId && (
                location.pathname.startsWith(`/admin/classes/${currentClassId}/problems`) ||
                location.pathname.startsWith(`/admin/classes/${currentClassId}/users`) ||
                location.pathname.startsWith(`/admin/classes/${currentClassId}/submits`) ||
                location.pathname.startsWith(`/admin/classes/${currentClassId}/bank`)
            )
        ) &&
        location.pathname !== '/admin/classes';

    return (
        <div className="adminlayout-admin-layout">
            <Header />
            <div className="adminlayout-admin-container">
                <AdminSidebar showMenus={shouldShowMenus} currentClassId={currentClassId} />
                <main className="adminlayout-admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;