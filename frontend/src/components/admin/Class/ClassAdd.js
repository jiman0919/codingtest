import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addClass } from '../Api/ClassAPI';
import './ClassAdd.css';

const ClassAdd = () => {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('python');
    const [maxStudents, setMaxStudents] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const availableLanguages = [
        { id: 'python', name: 'Python' },
        { id: 'java', name: 'Java' },
        { id: 'c', name: 'C' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!name.trim()) {
            setError(new Error('강좌 제목을 입력해주세요.'));
            setLoading(false);
            return;
        }
        if (maxStudents <= 0) {
            setError(new Error('제한 인원은 1명 이상이어야 합니다.'));
            setLoading(false);
            return;
        }

        try {
            const newClass = await addClass({
                name,
                language,
                max_students: maxStudents
            });
            console.log('강좌 추가 성공:', newClass);

            alert(`강좌 "${name}" (언어: ${language}, 제한인원: ${maxStudents}명) 추가 완료!`);
            navigate('/admin/classes');
        } catch (err) {
            setError(err);
            console.error('강좌 추가 중 오류 발생:', err);
            alert(`강좌 추가 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="classadd-class-add-wrapper">
            <div className="classadd-class-add-header">
                <h2>새 강좌 추가</h2>
            </div>

            <form onSubmit={handleSubmit} className="classadd-class-add-form">
                <div className="classadd-class-add-form-group">
                    <label htmlFor="name">강좌 제목:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="classadd-class-add-form-input"
                        placeholder="강좌 제목을 입력하세요."
                    />
                </div>
                <div className="classadd-class-add-form-group">
                    <label htmlFor="language">언어:</label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="classadd-class-add-form-input"
                    >
                        {availableLanguages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="classadd-class-add-form-group">
                    <label htmlFor="maxStudents">제한 인원:</label>
                    <input
                        type="number"
                        id="maxStudents"
                        value={maxStudents}
                        onChange={(e) => setMaxStudents(Number(e.target.value))}
                        required
                        min="1"
                        className="classadd-class-add-form-input"
                    />
                </div>
                {error && <div className="classadd-class-add-error-message">오류: {error.message}</div>}
                <div className="classadd-class-add-form-actions">
                    <button type="submit" className="classadd-class-add-submit-btn" disabled={loading}>
                        {loading ? '추가 중...' : '강좌 추가'}
                    </button>
                    <button
                        type="button"
                        className="classadd-class-add-cancel-btn"
                        onClick={() => navigate('/admin/classes')}
                        disabled={loading}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClassAdd;