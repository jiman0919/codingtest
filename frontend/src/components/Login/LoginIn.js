// src/components/Login/LoginIn.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from './LoginAPI';
import './LoginStyle.css';

const LoginIn = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const isFormFilled = username && password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isFormFilled) {
            setLoading(false);
            return;
        }

        try {
            const response = await loginUser(username, password);
            console.log('로그인 성공:', response);

            const userRole = response.role;

            if (userRole === 'professor') {
                alert('로그인되었습니다.');
                navigate('/admin');
            } else if (userRole === 'student') {
                alert('로그인되었습니다.');
                navigate('/user/classes');
            } else if (userRole === 'admin') {
                alert('로그인되었습니다.');
                navigate('/master');
            } else {
                alert('로그인 성공. 하지만 사용자 역할을 알 수 없습니다.');
                navigate('/login');
            }

        } catch (err) {
            console.error('로그인 실패:', err);
            alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-login-page-container">
            <div className="login-login-form-wrapper">
                <h2>로그인</h2>
                <form className="login-login-form" onSubmit={handleSubmit}>
                    {/* 에러 메시지 표시 부분 삭제 */}
                    <div className="login-form-group">
                        <label htmlFor="username">아이디:</label>
                        <input
                            type="text"
                            id="username"  
                            className="login-form-input"
                            placeholder="아이디를 입력하세요."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="login-form-group">
                        <label htmlFor="password">비밀번호:</label>
                        <input
                            type="password"
                            id="password"
                            className="login-form-input"
                            placeholder="비밀번호를 입력하세요."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`login-login-btn ${isFormFilled && !loading ? 'login-active' : 'login-disabled'}`}
                        disabled={!isFormFilled || loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
                <p className="login-login-footer">
                    계정이 없으신가요? <Link to="/login/new">회원가입</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginIn;