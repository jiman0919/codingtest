import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ showMenus, currentClassId }) => {
    const location = useLocation();

    const noCourseSelectedContent = (
        <div className="adminsidebar-sidebar-placeholder">
            <p>강좌를 선택하면<br/>메뉴가 표시됩니다.</p>
        </div>
    );

    const actualMenus = (
        <ul className="adminsidebar-sidebar-menu">
            {/* ✅ 문제 메뉴 */}
            <li className={location.pathname.startsWith(`/admin/classes/${currentClassId}/problems`) ? 'adminsidebar-active' : ''}>
                <Link to={`/admin/classes/${currentClassId}/problems`} className="adminsidebar-menu-item">
                    문제
                </Link>
            </li>
            {/* ✅ 유저 메뉴 */}
            <li className={location.pathname.startsWith(`/admin/classes/${currentClassId}/users`) ? 'adminsidebar-active' : ''}>
                <Link to={`/admin/classes/${currentClassId}/users`} className="adminsidebar-menu-item">
                    유저
                </Link>
            </li>
            {/* ✅ 제출 메뉴 */}
            <li className={location.pathname.startsWith(`/admin/classes/${currentClassId}/submits`) ? 'adminsidebar-active' : ''}>
                <Link to={`/admin/classes/${currentClassId}/submits`} className="adminsidebar-menu-item">
                    제출
                </Link>
            </li>
            {/* ✨ [수정] 문제 은행 메뉴의 경로를 새 구조에 맞게 변경합니다. */}
            <li className={location.pathname.startsWith(`/admin/classes/${currentClassId}/bank`) ? 'adminsidebar-active' : ''}>
                <Link to={`/admin/classes/${currentClassId}/bank`} className="adminsidebar-menu-item">
                    문제 은행
                </Link>
            </li>
        </ul>
    );

    return (
        <nav className="adminsidebar-admin-sidebar">
            <div className="adminsidebar-sidebar-title">교수 메뉴</div>
            {showMenus ? actualMenus : noCourseSelectedContent}
        </nav>
    );
};

export default AdminSidebar;