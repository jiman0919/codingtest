// src/components/admin/Header/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../Login/LoginAPI';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const isConfirmed = window.confirm("로그아웃 하시겠습니까?");
        
        if (isConfirmed) {
            try {
                // 서버에 로그아웃 요청을 먼저 보낼 수 있습니다.
                await logoutUser(); 
            } catch (err) {
                console.error("서버 로그아웃 요청 실패:", err);
                // 실패해도 클라이언트에서는 로그아웃을 계속 진행합니다.
            }
            
            // 로컬 스토리지에서 토큰들을 삭제합니다.
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // ✨ [수정] navigate 대신 window.location.href를 사용해 페이지를 완전히 새로고침합니다.
            // 이렇게 하면 숨어있는 다른 코드에 의해 의도치 않게 동작하는 것을 방지할 수 있습니다.
            window.location.href = '/login';
        };
    };

    const handleChangePassword = () => {
        navigate('/login/change-password');
    };

    return (
        <header className="header-admin-header">
            <div className="header-header-left">
                <span className="header-logo">AI-Security</span>
            </div>
            <div className="header-header-right">
                <button onClick={handleChangePassword} className="header-change-password-button">
                    비밀번호 변경
                </button>
                <button onClick={handleLogout} className="header-logout-button">
                    로그아웃
                </button>
            </div>
        </header>
    );
};

export default Header;