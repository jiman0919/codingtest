import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassById, updateClass } from '../Api/ClassAPI';
import './ClassEdit.css'; // ClassEdit.css를 import하도록 변경

const ClassEdit = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [language, setLanguage] = useState('python');
    const [maxStudents, setMaxStudents] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const availableLanguages = [
        { id: 'python', name: 'Python' },
        { id: 'java', name: 'Java' },
        { id: 'c', name: 'C' }
    ];

    useEffect(() => {
        const fetchClassData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getClassById(classId);
                setName(data.name);
                setLanguage(data.language);
                setMaxStudents(data.max_students);
            } catch (err) {
                setError(new Error('강좌 정보를 불러오는데 실패했습니다.'));
                console.error('Error fetching class data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchClassData();
        } else {
            setError(new Error('강좌 ID가 없습니다.'));
            setLoading(false);
        }
    }, [classId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!name.trim()) {
            setError(new Error('강좌 제목을 입력해주세요.'));
            setSubmitting(false);
            return;
        }
        if (!maxStudents || maxStudents <= 0) {
            setError(new Error('제한 인원은 1명 이상이어야 합니다.'));
            setSubmitting(false);
            return;
        }

        try {
            await updateClass(classId, {
                name,
                language,
                max_students: maxStudents
            });

            alert(`강좌 "${name}" 수정 완료!`);
            navigate('/admin/classes');
        } catch (err) {
            setError(new Error(`강좌 수정 실패: ${err.message || '알 수 없는 오류'}`));
            console.error('강좌 수정 중 오류 발생:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="classedit-class-add-loading-message">강좌 정보를 불러오는 중...</div>;
    }

    if (error && !loading) {
        return (
            <div className="classedit-class-add-error-message">
                오류 발생: {error.message}
            </div>
        );
    }

    return (
        <div className="classedit-class-add-wrapper">
            <div className="classedit-class-add-header">
                <h2>강좌 정보 수정</h2>
            </div>

            <form onSubmit={handleSubmit} className="classedit-class-add-form">
                <div className="classedit-class-add-form-group">
                    <label htmlFor="name">강좌 제목:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="classedit-class-add-form-input"
                        placeholder="강좌 제목을 입력하세요."
                    />
                </div>
                <div className="classedit-class-add-form-group">
                    <label htmlFor="language">언어:</label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="classedit-class-add-form-input"
                    >
                        {availableLanguages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="classedit-class-add-form-group">
                    <label htmlFor="maxStudents">제한 인원:</label>
                    <input
                        type="number"
                        id="maxStudents"
                        value={maxStudents || ''}
                        onChange={(e) => setMaxStudents(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        min="1"
                        className="classedit-class-add-form-input"
                    />
                </div>
                {error && <div className="classedit-class-add-error-message">오류: {error.message}</div>}
                <div className="classedit-class-add-form-actions">
                    <button type="submit" className="classedit-class-add-submit-btn" disabled={submitting}>
                        {submitting ? '수정 중...' : '수정 완료'}
                    </button>
                    <button
                        type="button"
                        className="classedit-class-add-cancel-btn"
                        onClick={() => navigate('/admin/classes')}
                        disabled={submitting}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClassEdit;