// src/components/Login/LoginAdd.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from './LoginAPI';
import './LoginStyle.css';

const LoginAdd = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // ✨ error 상태는 더 이상 사용하지 않으므로 삭제합니다.

    const isPasswordMatch = password === confirmPassword;
    const isFormFilled = name && username && password && confirmPassword;
    const isFormValid = isFormFilled && isPasswordMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isFormValid) {
            // ✨ 에러 메시지를 alert으로 변경합니다.
            alert('모든 필드를 올바르게 입력하고, 비밀번호가 일치하는지 확인해주세요.');
            setLoading(false);
            return;
        }

        try {
            const response = await registerUser(name, username, password, confirmPassword);
            console.log('회원가입 성공:', response);
            alert('회원가입이 완료되었습니다.');
            navigate('/login'); // 성공 시 로그인 페이지로 이동
        } catch (err) {
            console.error('회원가입 실패:', err);
            // ✨ API 호출 실패 시 에러도 alert으로 변경합니다.
            alert(`잘못된 형식입니다.: ${err.message || '서버 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-login-page-container">
            <div className="login-login-form-wrapper">
                <h2>회원가입</h2>
                <form className="login-login-form" onSubmit={handleSubmit}>
                    {/* ✨ error 메시지 p 태그는 삭제합니다. */}
                    
                    <div className="login-form-group">
                        <label htmlFor="name">
                            이름:
                            {/* ✨ 안내 문구 추가 */}
                            <span className="login-label-helper">*실명을 입력하세요.</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="login-form-input"
                            placeholder="이름을 입력하세요."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="username">
                            아이디(학번):
                            {/* ✨ 안내 문구 추가 */}
                            <span className="login-label-helper">*9자리 숫자를 입력하세요.</span>
                        </label>
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
                        <label htmlFor="password">
                            비밀번호:
                             {/* ✨ 안내 문구 추가 */}
                            <span className="login-label-helper">*8자 이상</span>
                        </label>
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

                    <div className="login-form-group">
                        <label htmlFor="confirm-password">
                            비밀번호 확인:
                             {/* ✨ 비밀번호 불일치 메시지는 form 전체 유효성 검사로 대체되었으므로 삭제합니다. */}
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            className="login-form-input"
                            placeholder="비밀번호를 다시 입력하세요."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className={`login-login-btn ${isFormValid ? 'login-active' : 'login-disabled'}`}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? '회원가입 중...' : '회원가입'}
                    </button>
                </form>
                <p className="login-login-footer">
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginAdd;