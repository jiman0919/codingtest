import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../admin/Header/Header';
import { getAllClasses, getEnrolledClasses, enrollClass } from '../../services/api';
import './UserClass.css';

const UserClass = () => {
    const [allClasses, setAllClasses] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchClassData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [allClassesData, allRequestsData] = await Promise.all([
                getAllClasses(),
                getEnrolledClasses()
            ]);
            
            setAllClasses(allClassesData);
            setAllRequests(allRequestsData);
        } catch (err) {
            setError(err);
            console.error('Error fetching class data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassData();
    }, []);

    const handleClassClick = (classId) => {
        const isApproved = allRequests.some(req => req.course_id === classId && req.status === 'approved');
        if (isApproved) {
            navigate(`/user/classes/${classId}/problems`);
        }
    };

    const handleEnrollClick = async (e, classId, classTitle) => {
        e.stopPropagation();
        if (window.confirm(`"${classTitle}" 강좌를 수강 신청하시겠습니까?`)) {
            try {
                const currentId = localStorage.getItem('user_name');
                if (!currentId) {
                    throw new Error("로그인된 사용자 ID를 찾을 수 없습니다.");
                }

                await enrollClass(classId, currentId);
                alert(`"${classTitle}" 강좌 수강 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.`);
                
                fetchClassData();

            } catch (err) {
                alert(`수강 신청에 실패했습니다: ${err.message}`);
                console.error('Error enrolling class:', err);
            }
        }
    };

    // [수정] 로딩 및 에러 화면 구조 통일
    if (loading) {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="userclass-loading-message">강좌 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="userclass-error-message">
                    <p>오류 발생: {error.message || '알 수 없는 오류'}</p>
                    <button onClick={fetchClassData}>다시 시도</button>
                </div>
            </div>
        );
    }

    const approvedClasses = allClasses.filter(cls => 
        allRequests.some(req => req.course_id === cls.id && req.status === 'approved')
    );

    const approvedClassIds = new Set(approvedClasses.map(cls => cls.id));
    const otherClasses = allClasses.filter(cls => !approvedClassIds.has(cls.id));

    return (
        // ▼▼▼ [수정] 전체 구조를 다른 페이지와 통일 ▼▼▼
        <div className="page-wrapper">
            <Header />
            <div className="content-container">
                <div className="userclass-header">
                    <h2>수강 중인 강좌</h2>
                </div>
                <div className="userclass-list">
                    {approvedClasses.length === 0 ? (
                        <div className="userclass-no-items">수강 중인 강좌가 없습니다.</div>
                    ) : (
                        approvedClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className="userclass-item"
                                onClick={() => handleClassClick(cls.id)}
                            >
                                <div className="userclass-item-info">
                                    <div className="userclass-item-title">{cls.name}</div>
                                    <div className="userclass-item-details">
                                        <span>{cls.professor_name} 교수</span>
                                        <span>언어: {cls.language}</span>
                                    </div>
                                </div>
                                <div className="userclass-item-enrollment">
                                    <span>수강 인원: {cls.current_students} / {cls.max_students}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="userclass-header" style={{ marginTop: '40px' }}>
                    <h2>전체 강좌</h2>
                </div>
                <div className="userclass-list">
                    {otherClasses.length === 0 ? (
                        <div className="userclass-no-items">수강 신청 가능한 강좌가 없습니다.</div>
                    ) : (
                        otherClasses.map((cls) => {
                            const isPending = allRequests.some(req => req.course_id === cls.id && req.status === 'pending');
                            const buttonText = isPending ? '승인 대기 중' : '수강 신청';
                            const buttonClass = isPending ? 'userclass-enroll-btn userclass-enroll-btn--disabled' : 'userclass-enroll-btn';

                            return (
                                <div key={cls.id} className="userclass-item">
                                    <div className="userclass-item-info">
                                        <div className="userclass-item-title">{cls.name}</div>
                                        <div className="userclass-item-details">
                                            <span>{cls.professor_name} 교수</span>
                                            <span>언어: {cls.language}</span>
                                            <span>수강 인원: {cls.current_students} / {cls.max_students}</span>
                                        </div>
                                    </div>
                                    <div className="userclass-item-actions">
                                        <button
                                            className={buttonClass}
                                            onClick={!isPending ? (e) => handleEnrollClick(e, cls.id, cls.name) : undefined}
                                            disabled={isPending}
                                        >
                                            {buttonText}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
        // ▲▲▲ [수정] 여기까지 ▲▲▲
    );
};

export default UserClass;