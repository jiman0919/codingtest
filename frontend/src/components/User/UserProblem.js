import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemList, getSubmissionStatusForCourse } from '../../services/api';
import Header from '../admin/Header/Header';
import './UserProblem.css';

function UserProblem() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [problemData, statusData] = await Promise.all([
                getProblemList(classId),
                getSubmissionStatusForCourse(classId)
            ]);

            const mergedProblems = problemData.map(problem => {
                const statusInfo = statusData.find(status => status.problem_id === problem.id);
                return {
                    ...problem,
                    is_submitted: statusInfo ? statusInfo.is_submitted : false,
                    submitted_at: statusInfo ? statusInfo.submitted_at : null,
                };
            });

            setProblems(mergedProblems);
        } catch (error) {
            console.error("데이터를 불러오는 중 오류 발생:", error);
            setError(`데이터를 불러오는 데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
            setProblems([]);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (classId) {
            fetchPageData();
        } else {
            setError('강좌 ID가 필요합니다. 강좌 목록으로 이동합니다.');
            setLoading(false);
        }
    }, [classId, fetchPageData]);

    const handleGoToClasses = () => {
        navigate('/user/classes');
    };

    const handleProblemClick = (problemId) => {
        navigate(`/user/classes/${classId}/problems/${problemId}`);
    };

    if (loading) {
        return (
            <div className="userproblem-page-wrapper">
                <Header />
                <div className="userproblem-loading-message">문제 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="userproblem-page-wrapper">
                <Header />
                <div className="userproblem-user-problem__error-container">
                    <p>{error}</p>
                    <button className="userproblem-user-problem__back-btn" onClick={handleGoToClasses}>
                        강좌 목록으로
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="userproblem-page-wrapper">
            <Header />
            <div className="userproblem-user-problem">
                <div className="userproblem-user-problem__header">
                    <button className="userproblem-user-problem__back-btn" onClick={handleGoToClasses}>
                        강좌 목록으로
                    </button>
                    <h2>문제 목록</h2>
                </div>

                <div className="userproblem-user-problem__list">
                    {problems.length > 0 ? (
                        problems.map((problem) => {
                            const statusText = problem.is_submitted ? '제출 완료' : '미제출';
                            const statusClass = problem.is_submitted ? 'submitted' : 'not-submitted';

                            return (
                                <div
                                    key={problem.id}
                                    className="userproblem-user-problem__item"
                                    onClick={() => handleProblemClick(problem.id)}
                                >
                                    {/* ▼▼▼ [수정] 제목과 배점을 함께 묶었습니다. ▼▼▼ */}
                                    <div className="userproblem-user-problem__item-info">
                                        <div className="userproblem-user-problem__item-title">{problem.title}</div>
                                        <div className="userproblem-user-problem__item-score">
                                            배점: {problem.score}점
                                        </div>
                                    </div>
                                    {/* ▼▼▼ [수정] 제출 시간과 상태를 함께 묶었습니다. ▼▼▼ */}
                                    <div className="userproblem-user-problem__item-actions">
                                        {problem.submitted_at && (
                                            <div className="userproblem-item-submission-time">
                                                제출: {new Date(problem.submitted_at).toLocaleString('ko-KR')}
                                            </div>
                                        )}
                                        <div className={`userproblem-item-status status--${statusClass}`}>
                                            {statusText}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="userproblem-user-problem__no-items">
                            <p>등록된 문제가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProblem;