// src/components/Login/LoginEdit.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from './LoginAPI';
import './LoginStyle.css';

const LoginEdit = () => {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isPasswordMatch = newPassword === confirmPassword;
    const isFormFilled = currentPassword && newPassword && confirmPassword;
    const isFormValid = isFormFilled && isPasswordMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!isFormValid) {
            setError('입력 정보를 다시 확인해주세요.');
            setLoading(false);
            return;
        }

        try {
            const response = await changePassword(currentPassword, newPassword, confirmPassword);
            console.log("비밀번호 변경 성공:", response);
            setSuccess('비밀번호가 성공적으로 변경되었습니다.');

            setTimeout(() => {
                navigate(-1);
            }, 1000);

        } catch (err) {
            console.error('비밀번호 변경 실패:', err);
            const errorMessage = err.response?.data?.message || '비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="login-login-page-container">
            <div className="login-login-form-wrapper">
                <h2>비밀번호 변경</h2>
                <form className="login-login-form" onSubmit={handleSubmit}>
                    {error && <p className="login-error-message">{error}</p>}
                    {success && <p className="login-success-message">{success}</p>}
                    <div className="login-form-group">
                        <label htmlFor="currentPassword">현재 비밀번호:</label>
                        <input
                            type="password"
                            id="currentPassword"
                            className="login-form-input"
                            placeholder="현재 비밀번호를 입력하세요."
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="login-form-group">
                        <label htmlFor="newPassword">새 비밀번호:</label>
                        <input
                            type="password"
                            id="newPassword"
                            className="login-form-input"
                            placeholder="새 비밀번호를 입력하세요."
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="login-form-group">
                        <label htmlFor="confirmPassword">
                            새 비밀번호 확인:
                            {!isPasswordMatch && confirmPassword.length > 0 && (
                                <span className="login-error-inline"> *비밀번호가 일치하지 않습니다</span>
                            )}
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="login-form-input"
                            placeholder="새 비밀번호를 다시 입력하세요."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="login-login-edit-button-group">
                        <button
                            type="submit"
                            className={`login-login-edit-button login-primary ${isFormValid && !loading ? '' : 'login-disabled'}`}
                            disabled={!isFormValid || loading}
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className={`login-login-edit-button login-secondary`}
                        >
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginEdit;