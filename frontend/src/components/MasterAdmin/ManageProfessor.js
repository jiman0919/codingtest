import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdminUser } from './ManageAPI';
import Header from '../admin/Header/Header';
import './ManageStyle.css';

const ManageProfessor = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isPasswordMatch = password === confirmPassword;
    const isFormFilled = name && username && password && confirmPassword;
    const isFormValid = isFormFilled && isPasswordMatch;

    const handleCreateProfessor = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!isFormValid) {
            setError('모든 필드를 올바르게 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const newProfessor = {
                name,
                username,
                password,
                confirm_password: confirmPassword,
                role: 'professor'
            };
            await createAdminUser(newProfessor);
            alert(`"${name}" 교수 계정이 성공적으로 생성되었습니다.`);
            navigate('/master');
        } catch (err) {
            console.error("교수 계정 생성 중 오류 발생:", err);
            setError(`계정 생성에 실패했습니다: ${err.message || err.response?.data?.detail || ''}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/master');
    };

    return (
        // [수정] 헤더 공간 확보 및 레이아웃 통일을 위해 wrapper 추가
        <div className="page-wrapper">
            <Header />
            <div className="manageprofessor-manage-professor">
                <div className="manageprofessor-manage-professor__header">
                    <h2>교수 계정 추가</h2>
                </div>
                <form onSubmit={handleCreateProfessor}>
                    {error && <div className="manageprofessor-manage-professor__error">{error}</div>}
                    
                    <div className="manageprofessor-manage-professor__form-group">
                        <label htmlFor="name">이름 :</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="manageprofessor-manage-professor__form-group">
                        <label htmlFor="username">아이디 :</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="manageprofessor-manage-professor__form-group">
                        <label htmlFor="password">비밀번호 :</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="manageprofessor-manage-professor__form-group">
                        <label htmlFor="confirmPassword">
                            비밀번호 확인 :
                            {!isPasswordMatch && confirmPassword && (
                                <span style={{ color: '#dc3545', fontSize: '0.9rem', marginLeft: '10px' }}>
                                    *비밀번호가 일치하지 않습니다
                                </span>
                            )}
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="manageprofessor-manage-professor__button-group">
                        <button
                            type="submit"
                            className="manageprofessor-manage-professor__submit-btn"
                            disabled={!isFormValid || loading}
                        >
                            {loading ? '생성 중...' : '확인'}
                        </button>
                        <button type="button" className="manageprofessor-manage-professor__cancel-btn" onClick={handleCancel} disabled={loading}>
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageProfessor;