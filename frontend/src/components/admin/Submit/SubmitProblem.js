import React, { useEffect, useState } from 'react'; // useCallback 삭제
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmitUserList, getSubmitProblemList, exportSubmissionsAsCsv } from '../Api/SubmitAPI';
import './SubmitProblem.css';

const SubmitProblem = () => {
    const { classId, userId } = useParams();
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userList, problemStatusList] = await Promise.all([
                    getSubmitUserList(classId),
                    getSubmitProblemList(classId, userId)
                ]);
                const currentUser = userList.find(
                    (user) => user && user.user_id != null && user.user_id.toString() === userId
                );
                setUserName(currentUser ? currentUser.name : `ID: ${userId}`);
                const formattedProblems = problemStatusList.map(problem => {
                    let status = '미제출';
                    if (problem.submitted_at) {
                        status = problem.is_correct ? '정답' : '오답';
                    }
                    return { id: problem.problem_id, title: problem.problem_title, status, userScore: problem.score, submittedAt: problem.submitted_at };
                });
                setProblems(formattedProblems);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('데이터를 불러오는데 실패했습니다: ' + (err.message || '알 수 없는 오류'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, userId]);

    const handleExportCsv = async () => {
        if (loading || error) {
            alert("데이터를 로드하는 중에는 내보낼 수 없습니다.");
            return;
        }

        try {
            const blob = await exportSubmissionsAsCsv(classId, userId);
            const fileName = `submissions_${userName}_${userId}.csv`;

            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'CSV 파일',
                        accept: { 'text/csv': ['.csv'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert("CSV 파일을 저장하는 중 오류가 발생했습니다.");
                console.error(err);
            }
        }
    };

    const handleGoBack = () => navigate(-1);
    const handleProblemClick = (problemId) => navigate(`/admin/classes/${classId}/submits/${userId}/${problemId}`);

    if (loading) return <div className="submitproblem-loading-message">데이터를 불러오는 중...</div>;
    if (error) return <div className="submitproblem-error-message">오류 발생: {error}</div>;

    return (
        <div className="submitproblem-problem-wrapper">
            <div className="submitproblem-detail-header">
                <button className="submitproblem-back-button" onClick={handleGoBack}>뒤로 가기</button>
                <h2>{userName} 님의 제출 현황</h2>
                <div className="submitproblem-header-actions">
                    <button className="submitproblem-export-button" onClick={handleExportCsv}>CSV로 내보내기</button>
                </div>
            </div>

            <div className="submitproblem-problem-list">
                {problems.map(problem => (
                    <div 
                        key={problem.id} 
                        className="submitproblem-problem-item" 
                        onClick={() => {
                            if (problem.status === '미제출') {
                                alert('아직 제출하지 않은 문제입니다.');
                            } else {
                                handleProblemClick(problem.id);
                            }
                        }}
                    >
                        <div className="submitproblem-problem-item-info">
                            <div className="submitproblem-problem-item-title">{problem.title}</div>
                        </div>
                        <div className="submitproblem-problem-item-actions">
                            <span className="submitproblem-problem-score">획득 점수: {problem.userScore}</span>
                            {problem.submittedAt && (
                                <span className="submitproblem-submission-time">
                                    제출: {new Date(problem.submittedAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\./g, '. ')}
                                </span>
                            )}
                            <span className={`submitproblem-problem-status submitproblem-status-${problem.status}`}>
                                {problem.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubmitProblem;