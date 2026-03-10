import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header'; // [추가]
import { getClassList, deleteClass } from '../Api/ClassAPI';
import './ClassList.css';

const ClassList = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // [수정] error 상태 다시 추가
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null); // [추가] 에러 상태 초기화
        try {
            const data = await getClassList();
            setClasses(data);
        } catch (err) {
            // [수정] alert 대신 setError 사용
            setError('강좌 목록을 불러오는 데 실패했습니다.');
            console.error('Error fetching class list:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClassClick = (classId) => {
        navigate(`/admin/classes/${classId}/problems`);
    };

    const handleDeleteClick = async (e, classId, classTitle) => {
        e.stopPropagation();
        if (window.confirm(`"${classTitle}" 강좌를 정말로 삭제하시겠습니까?`)) {
            try {
                await deleteClass(classId);
                alert(`강좌 ID ${classId} (${classTitle}) 삭제 완료!`);
                fetchData();
            } catch (err) {
                console.error('강좌 삭제 중 오류 발생:', err);
                alert(`강좌 삭제 실패: ${err.message || '알 수 없는 오류'}`);
            }
        }
    };

    const handleEditClick = (e, classId) => {
        e.stopPropagation();
        navigate(`/admin/classes/edit/${classId}`);
    };

    const handleAddClassClick = () => {
        navigate('/admin/classes/add');
    };

    if (loading) return <div className="classlist-loading-message">강좌 목록을 불러오는 중...</div>;
    
    // [수정] 에러 메시지를 보여주는 JSX 다시 추가
    if (error) {
        return (
            <div className="page-wrapper">
                <div className="content-container">
                    <div className="classlist-error-message">
                        <p>오류 : {error}</p>
                        <button onClick={fetchData}>다시 시도</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // [수정] 다른 페이지와 구조 통일
        <>
            <Header />
            <div className="page-wrapper">
                <div className="content-container">
                    <div className="classlist-class-header">
                        <h2>강좌 목록</h2>
                        <button className="classlist-add-btn" onClick={handleAddClassClick}>
                            강좌 추가
                        </button>
                    </div>

                    <div className="classlist-class-list">
                        {classes.length === 0 ? (
                            <div className="classlist-no-classes-message">등록된 강좌가 없습니다.</div>
                        ) : (
                            classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="classlist-class-item"
                                    onClick={() => handleClassClick(cls.id)}
                                >
                                    <div className="classlist-class-item-info">
                                        <div className="classlist-class-item-title">{cls.name}</div>
                                        <div className="classlist-class-details">
                                            <span className="classlist-class-language">언어: {cls.language}</span>
                                            <span className="classlist-class-students">
                                                학생 수: {cls.current_students || 0} / {cls.max_students}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="classlist-class-item-actions">
                                        <button
                                            className="classlist-edit-btn"
                                            onClick={(e) => handleEditClick(e, cls.id)}
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="classlist-delete-btn"
                                            onClick={(e) => handleDeleteClick(e, cls.id, cls.name)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClassList;