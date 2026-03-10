import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemList, deleteProblem } from '../Api/ProblemAPI';
import './ProblemList.css';

function ProblemList() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getProblemList(classId);
            console.log("ProblemList: API response for classId", classId, ":", response);
            setProblems(response);
        } catch (error) {
            console.error("문제 목록을 불러오는 중 오류 발생:", error);
            setError(`${error.message || error.response?.data?.detail || ''}`);
            setProblems([]);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (classId) {
            fetchProblems();
        } else {
            console.log("ProblemList: classId가 없어 특정 강좌 문제를 불러오지 않음. 강좌 목록으로 이동.");
            setError('강좌 ID가 필요합니다. 강좌 목록으로 이동합니다.');
            setLoading(false);
        }
    }, [classId, fetchProblems]);

    const handleDelete = async (e, problemId, problemTitle) => {
        e.stopPropagation();
        if (window.confirm(`"${problemTitle}" 문제를 정말로 삭제하시겠습니까?`)) {
            try {
                await deleteProblem(problemId);
                fetchProblems();
                alert(`"${problemTitle}" 문제가 성공적으로 삭제되었습니다.`);
            } catch (error) {
                console.error("문제 삭제 중 오류 발생:", error);
                alert(`문제 삭제에 실패했습니다: ${error.message || error.response?.data?.detail || ''}`);
            }
        }
    };

    const handleGoToClasses = () => {
        navigate('/admin/classes');
    };

    if (loading) return <div className="problemlist-loading-message">문제 목록을 불러오는 중...</div>;
    if (error) {
        return (
            <div className="problemlist-error-message">
                <p>오류: {error}</p>
                <button className="problemlist-back-to-classes-button" onClick={handleGoToClasses}>
                    강좌 목록으로
                </button>
            </div>
        );
    }

    return (
        <div className="problemlist-problem-wrapper">
            <div className="problemlist-problem-header">
                {/* ▼▼▼ [수정] '강좌 목록으로' 버튼을 h2 앞으로 이동 ▼▼▼ */}
                <button className="problemlist-back-to-classes-button" onClick={handleGoToClasses}>
                    강좌 목록으로
                </button>
                <h2>문제 목록</h2>
                <div className="problemlist-header-actions">
                    <button
                        className="problemlist-add-btn"
                        onClick={() => {
                            if (classId) {
                                navigate(`/admin/classes/${classId}/problems/add`);
                            } else {
                                alert("문제를 추가할 강좌를 먼저 선택해 주세요.");
                                navigate("/admin/classes");
                            }
                        }}
                        disabled={!classId}
                    >
                        문제 추가
                    </button>
                </div>
                {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}
            </div>

            <div className="problemlist-problem-list">
                {problems.length > 0 ? (
                    problems.map((problem) => (
                        <div
                            key={problem.id}
                            className="problemlist-problem-item"
                            onClick={() => navigate(
                                `/admin/classes/${classId}/problems/detail/${problem.id}`
                            )}
                        >
                            <div className="problemlist-problem-item-info">
                                <div className="problemlist-problem-item-title">{problem.title}</div>
                            </div>
                            <div className="problemlist-problem-item-actions">
                                <button className="problemlist-edit-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/admin/classes/${classId}/problems/edit/${problem.id}`);
                                }}>수정</button>
                                <button className="problemlist-delete-btn" onClick={(e) => handleDelete(e, problem.id, problem.title)}>삭제</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="problemlist-no-problems-message">
                        {classId ? "등록된 문제가 없습니다." : "강좌를 선택하여 해당 강좌의 문제 목록을 확인하세요."}
                    </p>
                )}
            </div>
        </div>
    );
}

export default ProblemList;